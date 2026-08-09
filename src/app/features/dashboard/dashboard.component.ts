import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { forkJoin } from 'rxjs';
import ExcelJS from 'exceljs';
import { DashboardService } from './services/dashboard.service';
import { SessionService } from '../../core/services/session.service';
import { AuthService } from '../../core/services/auth.service';
import {
  DashboardKPIs,
  VentasPorHora,
  VentasPorCategoria,
  MetodoPago,
  DistribucionTalla,
  TopProducto,
  DashboardFilters,
  VentaExportRow,
} from './models/dashboard.models';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  ApexTooltip,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexFill,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  stroke: ApexStroke;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  colors: string[];
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './dashboard.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  public sessionService = inject(SessionService);
  public authService = inject(AuthService);

  // State
  isLoading = signal<boolean>(true);
  isExporting = signal<boolean>(false);

  // Data Signals
  kpis = signal<DashboardKPIs | null>(null);
  ventasPorHora = signal<VentasPorHora[]>([]);
  ventasPorCategoria = signal<VentasPorCategoria[]>([]);
  metodosPago = signal<MetodoPago[]>([]);
  topProductos = signal<TopProducto[]>([]);
  distribucionTallas = signal<DistribucionTalla[]>([]);

  // Filters
  selectedRange = signal<string>('hoy');
  selectedSucursal = signal<number | null>(null);
  selectedCategory = signal<string | null>(null);

  // Date Picker State
  showDatePicker = signal(false);
  customStartDate = signal<string>('');
  customEndDate = signal<string>('');
  dateLabel = signal<string>('Hoy');

  // Chart Options
  salesByHourOptions: Partial<ChartOptions> | any = {};
  salesByCategoryOptions: Partial<ChartOptions> | any = {};

  ngOnInit() {
    if (this.authService.getUser()?.rol === 'ADMIN') {
      this.selectedSucursal.set(null);
    } else {
      this.selectedSucursal.set(this.sessionService.sucursalId());
    }

    const hoy = this.dashboardService.getRangoHoy();
    this.customStartDate.set(hoy.fechaInicio);
    this.customEndDate.set(hoy.fechaFin);

    this.loadData();
  }

  toggleDatePicker() {
    this.showDatePicker.update((v) => !v);
  }

  selectQuickRange(range: string) {
    this.selectedRange.set(range);
    let dateRange;

    switch (range) {
      case 'hoy':
        dateRange = this.dashboardService.getRangoHoy();
        this.dateLabel.set('Hoy');
        break;
      case 'mes':
        dateRange = this.dashboardService.getRangoEsteMes();
        this.dateLabel.set('Este Mes');
        break;
      case '7dias':
        dateRange = this.dashboardService.getRangoUltimos7Dias();
        this.dateLabel.set('Últimos 7 días');
        break;
      default:
        dateRange = this.dashboardService.getRangoHoy();
        this.dateLabel.set('Hoy');
    }

    this.customStartDate.set(dateRange.fechaInicio);
    this.customEndDate.set(dateRange.fechaFin);
    this.showDatePicker.set(false);
    this.loadData();
  }

  applyCustomDate() {
    if (this.customStartDate() && this.customEndDate()) {
      this.selectedRange.set('custom');
      this.dateLabel.set(`${this.customStartDate()} - ${this.customEndDate()}`);
      this.showDatePicker.set(false);
      this.loadData();
    }
  }

  onSucursalChange(sucursalId: number | null) {
    this.selectedSucursal.set(sucursalId);
    this.loadData();
  }

  toggleCategory(catName: string) {
    if (this.selectedCategory() === catName) {
      this.selectedCategory.set(null);
    } else {
      this.selectedCategory.set(catName);
    }
    this.loadData();
  }

  clearCategory() {
    this.selectedCategory.set(null);
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    const filters: DashboardFilters = {};

    if (this.selectedSucursal() !== null) {
      filters.idSucursal = this.selectedSucursal()!;
    }

    filters.fechaInicio = this.customStartDate();
    filters.fechaFin = this.customEndDate();

    if (this.selectedCategory()) {
      filters.categoria = this.selectedCategory()!;
      filters.limit = 0;
    }

    forkJoin({
      kpis: this.dashboardService.getKPIs(filters),
      ventasHora: this.dashboardService.getVentasPorHora(filters),
      ventasCat: this.dashboardService.getVentasPorCategoria(filters),
      metodos: this.dashboardService.getMetodosPago(filters),
      tallas: this.dashboardService.getDistribucionTallas(filters),
      top: this.dashboardService.getTopProductos(filters),
    }).subscribe({
      next: (data) => {
        this.kpis.set(data.kpis);
        this.ventasPorHora.set(data.ventasHora);
        this.ventasPorCategoria.set(data.ventasCat);

        const totalMetodos = data.metodos.reduce((acc, curr) => acc + curr.cantidad, 0);
        const metodosConPorcentaje = data.metodos.map((m) => ({
          ...m,
          porcentaje: totalMetodos > 0 ? Math.round((m.cantidad / totalMetodos) * 100) : 0,
        }));
        this.metodosPago.set(metodosConPorcentaje);

        this.distribucionTallas.set(data.tallas);
        this.topProductos.set(data.top);

        this.initCharts();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
        this.isLoading.set(false);
      },
    });
  }

  initCharts() {
    const fullHours = Array.from({ length: 24 }, (_, i) => i);
    const salesMap = new Map(this.ventasPorHora().map((v) => [v.hora, v.cantidad]));
    const salesData = fullHours.map((h) => salesMap.get(h) || 0);
    const categories = fullHours.map((h) => `${h}:00`);

    this.salesByHourOptions = {
      series: [
        {
          name: 'Ventas',
          data: salesData,
        },
      ],
      chart: {
        type: 'area',
        height: 250,
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 2,
        colors: ['#000000'],
      },
      xaxis: {
        categories: categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        show: true,
        labels: {
          formatter: (value: number) => {
            return value.toFixed(0);
          },
        },
      },
      grid: {
        strokeDashArray: 4,
        borderColor: '#f1f1f1',
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100],
          colorStops: [
            {
              offset: 0,
              color: '#000000',
              opacity: 0.1,
            },
            {
              offset: 100,
              color: '#000000',
              opacity: 0,
            },
          ],
        },
      },
      tooltip: {
        theme: 'dark',
      },
    };

    const categoryLabels = this.ventasPorCategoria().map((v) => v.categoria);
    const quantities = this.ventasPorCategoria().map((v) => v.cantidad);

    this.salesByCategoryOptions = {
      series: [
        {
          name: 'Unidades',
          data: quantities,
        },
      ],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: { show: false },
        fontFamily: 'inherit',
        events: {
          click: (event: any, chartContext: any, config: any) => {
            if (config.dataPointIndex >= 0) {
              const catName = categoryLabels[config.dataPointIndex];
              this.toggleCategory(catName);
            }
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          barHeight: '50%',
          cursor: 'pointer',
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: categoryLabels,
      },
      colors: ['#333333'],
      grid: {
        show: false,
      },
    };
  }

  getSucursalName(id: number): string {
    const sucursales: { [key: number]: string } = { 1: 'Tarija', 2: 'Cochabamba', 3: 'Santa Cruz' };
    return sucursales[id] || 'Desconocida';
  }

  exportarExcel() {
    this.isExporting.set(true);

    const filters: DashboardFilters = {};
    if (this.selectedSucursal() !== null) {
      filters.idSucursal = this.selectedSucursal()!;
    }
    filters.fechaInicio = this.customStartDate();
    filters.fechaFin = this.customEndDate();
    if (this.selectedCategory()) {
      filters.categoria = this.selectedCategory()!;
    }

    this.dashboardService.getVentasExport(filters).subscribe({
      next: async (rows) => {
        if (!rows || rows.length === 0) {
          alert('No hay datos para exportar en el rango seleccionado.');
          this.isExporting.set(false);
          return;
        }
        try {
          await this.generarExcel(rows);
        } catch (err) {
          console.error('Error generando Excel', err);
          alert('Ocurrio un error al generar el archivo Excel.');
        }
        this.isExporting.set(false);
      },
      error: (err) => {
        console.error('Error exportando ventas', err);
        alert('Error al obtener los datos del servidor.');
        this.isExporting.set(false);
      },
    });
  }

  private async generarExcel(rows: VentaExportRow[]) {
    const workbook = new ExcelJS.Workbook();

    const sucursalMap = new Map<number, { nombre: string; rows: VentaExportRow[] }>();
    rows.forEach((row) => {
      if (!sucursalMap.has(row.id_sucursal)) {
        sucursalMap.set(row.id_sucursal, { nombre: row.nombre_sucursal, rows: [] });
      }
      sucursalMap.get(row.id_sucursal)!.rows.push(row);
    });

    const headerFont = { bold: true, color: { argb: 'FF000000' } };
    const headerFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFE0E0E0' } };
    const thinBorder = {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const },
    };
    const marcaFont = { bold: true, size: 12 };
    const marcaFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF0F0F0' } };
    const subtotalFont = { bold: true };
    const subtotalFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFF3CD' } };
    const grandFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    const grandFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF333333' } };
    const grandBorder = {
      top: { style: 'medium' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'medium' as const },
      right: { style: 'thin' as const },
    };
    const paymentLabelFont = { bold: true, size: 11 };
    const colWidths = [22, 20, 20, 18];

    sucursalMap.forEach((sucData) => {
      const sheet = workbook.addWorksheet(sucData.nombre.substring(0, 31));

      colWidths.forEach((w, i) => {
        sheet.getColumn(i + 1).width = w;
      });

      const headerRow = sheet.addRow(['Marca', 'Corte', 'Cantidad Vendida', 'Subtotal (Bs)']);
      headerRow.eachCell((cell) => {
        cell.font = headerFont;
        cell.fill = headerFill;
        cell.border = thinBorder;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      const marcaCorteMap = new Map<string, Map<string, { cantidad: number; subtotal: number }>>();
      sucData.rows.forEach((row) => {
        const marca = row.marca || 'Sin Marca';
        const corte = row.corte || 'Sin Corte';
        if (!marcaCorteMap.has(marca)) {
          marcaCorteMap.set(marca, new Map());
        }
        const corteMap = marcaCorteMap.get(marca)!;
        if (!corteMap.has(corte)) {
          corteMap.set(corte, { cantidad: 0, subtotal: 0 });
        }
        const entry = corteMap.get(corte)!;
        entry.cantidad += row.cantidad;
        entry.subtotal += row.total_detalle;
      });

      const sortedMarcas = Array.from(marcaCorteMap.keys()).sort((a, b) =>
        a.localeCompare(b, 'es', { sensitivity: 'base' })
      );

      let grandCantidad = 0;
      let grandSubtotal = 0;

      sortedMarcas.forEach((marca) => {
        const corteMap = marcaCorteMap.get(marca)!;
        const sortedCortes = Array.from(corteMap.keys()).sort((a, b) =>
          a.localeCompare(b, 'es', { sensitivity: 'base' })
        );

        let marcaCantidad = 0;
        let marcaSubtotal = 0;

        const marcaRow = sheet.addRow([marca.toUpperCase(), '', '', '']);
        marcaRow.eachCell((cell) => {
          cell.font = marcaFont;
          cell.fill = marcaFill;
          cell.border = thinBorder;
        });

        sortedCortes.forEach((corte) => {
          const entry = corteMap.get(corte)!;
          sheet.addRow(['', corte, entry.cantidad, entry.subtotal]);
          marcaCantidad += entry.cantidad;
          marcaSubtotal += entry.subtotal;
        });

        const subRow = sheet.addRow(['', 'Subtotal ' + marca, marcaCantidad, marcaSubtotal]);
        subRow.eachCell((cell) => {
          cell.font = subtotalFont;
          cell.fill = subtotalFill;
          cell.border = thinBorder;
        });

        sheet.addRow([]);

        grandCantidad += marcaCantidad;
        grandSubtotal += marcaSubtotal;
      });

      const grandRow = sheet.addRow(['GRAN TOTAL', '', grandCantidad, grandSubtotal]);
      grandRow.eachCell((cell) => {
        cell.font = grandFont;
        cell.fill = grandFill;
        cell.border = grandBorder;
      });

      sheet.addRow([]);
      sheet.addRow([]);

      const tituloPagos = sheet.addRow(['RESUMEN DE PAGOS DEL PERIODO']);
      tituloPagos.getCell(1).font = { bold: true, size: 12 };

      const ventasUnicas = new Set<number>();
      let totalEfectivo = 0,
        totalQr = 0,
        totalTarjeta = 0,
        totalGiftcard = 0,
        totalDescuento = 0,
        totalVentas = 0;
      sucData.rows.forEach((r) => {
        if (!ventasUnicas.has(r.id_venta)) {
          ventasUnicas.add(r.id_venta);
          totalEfectivo += r.monto_efectivo;
          totalQr += r.monto_qr;
          totalTarjeta += r.monto_tarjeta;
          totalGiftcard += r.monto_giftcard;
          totalDescuento += r.descuento;
          totalVentas += r.total_venta;
        }
      });

      const pagoHeaders = ['Efectivo (Bs)', 'QR (Bs)', 'Tarjeta (Bs)', 'Giftcard (Bs)', 'Descuento (Bs)', 'Total Ventas (Bs)'];
      const pagoRow = sheet.addRow(pagoHeaders);
      pagoRow.eachCell((cell) => {
        cell.font = headerFont;
        cell.fill = headerFill;
        cell.border = thinBorder;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      const pagoValores = sheet.addRow([totalEfectivo, totalQr, totalTarjeta, totalGiftcard, totalDescuento, totalVentas]);
      pagoValores.eachCell((cell) => {
        cell.font = paymentLabelFont;
        cell.border = thinBorder;
      });

      [5, 6, 7, 8, 9, 10].forEach((col) => {
        sheet.getColumn(col).width = 17;
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const hoy = new Date();
    const fechaFile = [
      hoy.getFullYear(),
      String(hoy.getMonth() + 1).padStart(2, '0'),
      String(hoy.getDate()).padStart(2, '0'),
    ].join('-');
    a.href = url;
    a.download = 'ventas_export_' + fechaFile + '.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }
}
