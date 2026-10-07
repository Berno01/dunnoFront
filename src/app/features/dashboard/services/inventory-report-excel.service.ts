import { Injectable } from '@angular/core';
import ExcelJS, { CellValue } from 'exceljs';
import { InventoryReportOption, InventoryReportRow } from '../models/dashboard.models';

export interface InventoryWorkbookResult {
  blob: Blob;
  branchCount: number;
  designColorCount: number;
  failedPhotos: number;
  skippedPhotos: number;
}

interface DesignColorInventory {
  nombreModelo: string;
  categoria: string;
  marca: string;
  corte: string;
  color: string;
  codigoHex: string | null;
  precio: number;
  fotoUrl: string | null;
  stockBySize: Map<number, number>;
}

interface EmbeddedPhoto {
  dataUrl: string;
  extension: 'jpeg' | 'png' | 'gif';
}

@Injectable({ providedIn: 'root' })
export class InventoryReportExcelService {
  private readonly maxEmbeddedPhotos = 100;
  private readonly photoConcurrency = 4;
  private readonly collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
  private readonly clothingSizeOrder = [
    '3XS', 'XXXS', '2XS', 'XXS', 'XS', 'CH', 'P', 'S', 'M', 'G', 'L', 'EG', 'XL', 'XG',
    '2XL', 'XXL', '3XL', 'XXXL', '4XL', '5XL', 'UNICA', 'ÚNICA',
  ];

  async createWorkbook(
    rows: InventoryReportRow[],
    availableBranches: InventoryReportOption[],
    includePhotos: boolean,
    filterSummary: string,
    onPhotoProgress: (completed: number, total: number) => void,
  ): Promise<InventoryWorkbookResult> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dunno';
    workbook.subject = 'Inventario actual por sucursal';
    workbook.title = 'Inventario actual';
    workbook.created = new Date();

    const branches = this.groupByBranch(rows, availableBranches);
    const allSizes = this.getSortedSizes(rows);
    const uniquePhotoUrls = includePhotos
      ? [...new Set(rows.map((row) => row.foto_url?.trim()).filter((url): url is string => !!url))]
      : [];
    const photosToFetch = uniquePhotoUrls.slice(0, this.maxEmbeddedPhotos);
    const imageData = includePhotos
      ? await this.fetchPhotos(photosToFetch, onPhotoProgress)
      : new Map<string, EmbeddedPhoto>();
    const imageIds = new Map<string, number>();

    for (const [url, photo] of imageData) {
      imageIds.set(url, workbook.addImage({ base64: photo.dataUrl, extension: photo.extension }));
    }

    const usedSheetNames = new Set<string>();
    let designColorCount = 0;

    for (const branch of branches) {
      const groups = this.groupByDesignColor(branch.rows);
      designColorCount += groups.length;
      const sheetName = this.uniqueSheetName(branch.name, branch.id, usedSheetNames);
      const worksheet = workbook.addWorksheet(sheetName, {
        properties: { tabColor: { argb: 'FF303030' } },
      });

      this.populateBranchSheet(
        worksheet,
        branch.name,
        groups,
        allSizes,
        filterSummary,
        includePhotos,
        imageIds,
      );
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    return {
      blob,
      branchCount: branches.length,
      designColorCount,
      failedPhotos: photosToFetch.length - imageData.size,
      skippedPhotos: uniquePhotoUrls.length - photosToFetch.length,
    };
  }

  private groupByBranch(rows: InventoryReportRow[], availableBranches: InventoryReportOption[]) {
    const grouped = new Map<number, { id: number; name: string; rows: InventoryReportRow[] }>();
    for (const branch of availableBranches) {
      grouped.set(branch.id, { id: branch.id, name: branch.nombre, rows: [] });
    }
    for (const row of rows) {
      const branch = grouped.get(row.id_sucursal) ?? {
        id: row.id_sucursal,
        name: row.nombre_sucursal || `Sucursal ${row.id_sucursal}`,
        rows: [],
      };
      branch.rows.push(row);
      grouped.set(row.id_sucursal, branch);
    }

    return [...grouped.values()].sort((a, b) => this.collator.compare(a.name, b.name));
  }

  private groupByDesignColor(rows: InventoryReportRow[]): DesignColorInventory[] {
    const grouped = new Map<string, DesignColorInventory>();
    for (const row of rows) {
      const key = `${row.id_modelo}:${row.id_modelo_color}`;
      let group = grouped.get(key);
      if (!group) {
        group = {
          nombreModelo: row.nombre_modelo,
          categoria: row.categoria || 'Sin categoría',
          marca: row.marca || 'Sin marca',
          corte: row.corte || 'Sin corte',
          color: row.color || 'Sin color',
          codigoHex: row.codigo_hex,
          precio: row.precio || 0,
          fotoUrl: row.foto_url,
          stockBySize: new Map<number, number>(),
        };
        grouped.set(key, group);
      }
      group.stockBySize.set(
        row.id_talla,
        (group.stockBySize.get(row.id_talla) ?? 0) + Math.max(0, row.stock || 0),
      );
    }

    return [...grouped.values()].sort((a, b) =>
      this.collator.compare(
        `${a.categoria} ${a.marca} ${a.nombreModelo} ${a.color}`,
        `${b.categoria} ${b.marca} ${b.nombreModelo} ${b.color}`,
      ),
    );
  }

  private getSortedSizes(rows: InventoryReportRow[]): Array<{ id: number; name: string }> {
    const sizes = new Map<number, string>();
    for (const row of rows) sizes.set(row.id_talla, row.talla);
    return [...sizes.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => {
        const rankA = this.clothingSizeOrder.indexOf(a.name.trim().toLocaleUpperCase('es'));
        const rankB = this.clothingSizeOrder.indexOf(b.name.trim().toLocaleUpperCase('es'));
        if (rankA >= 0 && rankB >= 0) return rankA - rankB;
        if (rankA >= 0) return -1;
        if (rankB >= 0) return 1;
        return this.collator.compare(a.name, b.name);
      });
  }

  private populateBranchSheet(
    worksheet: ExcelJS.Worksheet,
    branchName: string,
    groups: DesignColorInventory[],
    sizes: Array<{ id: number; name: string }>,
    filterSummary: string,
    includePhotos: boolean,
    imageIds: Map<string, number>,
  ): void {
    const headers = [
      includePhotos ? 'Foto' : 'Foto / enlace',
      'Diseño',
      'Categoría',
      'Marca',
      'Corte',
      'Color',
      'Precio',
      ...sizes.map((size) => size.name),
      'Total unidades',
    ];
    const lastColumn = headers.length;
    const sizeStartColumn = 8;
    const totalColumn = sizeStartColumn + sizes.length;

    worksheet.columns = headers.map((header, index) => ({
      header,
      key: `column${index + 1}`,
      width: [15, 28, 20, 18, 17, 18, 14][index] ?? (index === totalColumn - 1 ? 17 : 11),
    }));
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(6).width = 20;
    worksheet.getColumn(7).numFmt = '"Bs" #,##0.00';

    worksheet.mergeCells(1, 1, 1, lastColumn);
    worksheet.mergeCells(2, 1, 2, lastColumn);
    worksheet.mergeCells(3, 1, 3, lastColumn);
    worksheet.getCell('A1').value = `INVENTARIO ACTUAL · ${branchName.toLocaleUpperCase('es')}`;
    worksheet.getCell('A2').value = `Generado: ${new Intl.DateTimeFormat('es-BO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date())}  |  ${groups.length} diseños-color`;
    worksheet.getCell('A3').value = `Filtros: ${filterSummary}`;

    worksheet.getRow(1).height = 32;
    worksheet.getRow(2).height = 22;
    worksheet.getRow(3).height = 22;
    worksheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF222222' } };
    worksheet.getRow(1).alignment = { vertical: 'middle' };
    worksheet.getRow(2).font = { size: 10, color: { argb: 'FF555555' } };
    worksheet.getRow(3).font = { size: 10, italic: true, color: { argb: 'FF555555' } };

    const headerRow = worksheet.getRow(5);
    headerRow.values = headers;
    headerRow.height = 28;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF343434' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.eachCell((cell) => {
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF111111' } },
        right: { style: 'thin', color: { argb: 'FF666666' } },
      };
    });

    const stockTotals = new Map<number, number>(sizes.map((size) => [size.id, 0]));
    groups.forEach((group, index) => {
      const excelRow = index + 6;
      const total = sizes.reduce((sum, size) => sum + (group.stockBySize.get(size.id) ?? 0), 0);
      const values: CellValue[] = [
        group.fotoUrl ? { text: includePhotos ? ' ' : 'Abrir foto', hyperlink: group.fotoUrl } : '—',
        group.nombreModelo,
        group.categoria,
        group.marca,
        group.corte,
        group.color,
        group.precio,
        ...sizes.map((size) => group.stockBySize.get(size.id) ?? 0),
        total,
      ];
      const dataRow = worksheet.getRow(excelRow);
      dataRow.values = values;
      dataRow.height = includePhotos && group.fotoUrl && imageIds.has(group.fotoUrl.trim()) ? 58 : 30;
      dataRow.alignment = { vertical: 'middle', wrapText: true };
      dataRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      dataRow.getCell(7).numFmt = '"Bs" #,##0.00';
      for (let column = sizeStartColumn; column <= totalColumn; column += 1) {
        dataRow.getCell(column).alignment = { horizontal: 'center', vertical: 'middle' };
      }
      dataRow.getCell(totalColumn).font = { bold: true };

      const hex = this.normalizeHex(group.codigoHex);
      if (hex) {
        const colorCell = dataRow.getCell(6);
        colorCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex } };
        colorCell.font = { bold: true, color: { argb: this.getContrastingColor(hex) } };
      }
      if (index % 2 === 1) {
        for (let column = 1; column <= lastColumn; column += 1) {
          if (column !== 6 || !hex) {
            dataRow.getCell(column).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF6F6F6' },
            };
          }
        }
      }
      dataRow.eachCell((cell) => {
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFE0E0E0' } } };
      });

      for (const size of sizes) {
        stockTotals.set(size.id, (stockTotals.get(size.id) ?? 0) + (group.stockBySize.get(size.id) ?? 0));
      }

      const photoId = group.fotoUrl ? imageIds.get(group.fotoUrl.trim()) : undefined;
      if (photoId !== undefined) {
        worksheet.addImage(photoId, {
          tl: { col: 0.18, row: excelRow - 0.9 },
          ext: { width: 76, height: 54 },
          editAs: 'oneCell',
        });
      } else if (group.fotoUrl) {
        dataRow.getCell(1).font = { color: { argb: 'FF2563EB' }, underline: true, size: 9 };
      }
    });

    const totalRowIndex = groups.length + 6;
    worksheet.mergeCells(totalRowIndex, 1, totalRowIndex, 7);
    const totalRow = worksheet.getRow(totalRowIndex);
    totalRow.getCell(1).value = `TOTAL DE SUCURSAL · ${groups.length} diseños-color`;
    totalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
    let grandTotal = 0;
    sizes.forEach((size, index) => {
      const value = stockTotals.get(size.id) ?? 0;
      totalRow.getCell(sizeStartColumn + index).value = value;
      grandTotal += value;
    });
    totalRow.getCell(totalColumn).value = grandTotal;
    totalRow.height = 32;
    totalRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF222222' } };
    totalRow.alignment = { vertical: 'middle', horizontal: 'center' };
    totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'right' };

    worksheet.autoFilter = {
      from: { row: 5, column: 1 },
      to: { row: groups.length + 5, column: lastColumn },
    };
    worksheet.views = [{ state: 'frozen', xSplit: 7, ySplit: 5 }];
    worksheet.pageSetup = {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 9,
      margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    };
  }

  private async fetchPhotos(
    urls: string[],
    onProgress: (completed: number, total: number) => void,
  ): Promise<Map<string, EmbeddedPhoto>> {
    const results = new Map<string, EmbeddedPhoto>();
    let nextIndex = 0;
    let completed = 0;
    const workerCount = Math.min(this.photoConcurrency, urls.length);

    const worker = async () => {
      while (nextIndex < urls.length) {
        const url = urls[nextIndex++];
        try {
          const response = await fetch(this.thumbnailUrl(url), {
            mode: 'cors',
            credentials: 'omit',
            signal: AbortSignal.timeout(8000),
          });
          if (!response.ok) throw new Error(`Image request failed: ${response.status}`);
          const blob = await response.blob();
          const extension = this.getImageExtension(blob.type);
          if (!extension) throw new Error('Excel does not support this image format.');
          const dataUrl = await this.readAsDataUrl(blob);
          results.set(url, { dataUrl, extension });
        } catch {
          // A missing/unavailable image must not prevent an inventory download.
        } finally {
          completed += 1;
          onProgress(completed, urls.length);
        }
      }
    };

    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return results;
  }

  private thumbnailUrl(imageUrl: string): string {
    const parsed = new URL(imageUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Unsupported image URL.');
    }
    if (parsed.hostname.endsWith('cloudinary.com') && parsed.pathname.includes('/upload/')) {
      parsed.pathname = parsed.pathname.replace('/upload/', '/upload/w_180,h_180,c_limit,q_auto,f_jpg/');
    }
    return parsed.toString();
  }

  private readAsDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  private getImageExtension(contentType: string): EmbeddedPhoto['extension'] | null {
    switch (contentType.split(';')[0].trim().toLowerCase()) {
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpeg';
      case 'image/png':
        return 'png';
      case 'image/gif':
        return 'gif';
      default:
        return null;
    }
  }

  private normalizeHex(value: string | null): string | null {
    if (!value) return null;
    const hex = value.trim().replace(/^#/, '');
    return /^[0-9a-fA-F]{6}$/.test(hex) ? `FF${hex.toUpperCase()}` : null;
  }

  private getContrastingColor(argb: string): string {
    const hex = argb.slice(2);
    const red = parseInt(hex.slice(0, 2), 16);
    const green = parseInt(hex.slice(2, 4), 16);
    const blue = parseInt(hex.slice(4, 6), 16);
    const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
    return luminance < 145 ? 'FFFFFFFF' : 'FF202020';
  }

  private uniqueSheetName(name: string, id: number, used: Set<string>): string {
    const base = name
      .replace(/[\\/?*:[\]]/g, ' ')
      .replace(/^'+|'+$/g, '')
      .trim()
      .slice(0, 31) || `Sucursal ${id}`;
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate.toLocaleLowerCase('es'))) {
      const ending = ` (${suffix++})`;
      candidate = `${base.slice(0, 31 - ending.length)}${ending}`;
    }
    used.add(candidate.toLocaleLowerCase('es'));
    return candidate;
  }
}
