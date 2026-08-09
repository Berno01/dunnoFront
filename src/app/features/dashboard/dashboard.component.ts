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
  selectedSucursal = signal<number | null>(null); // Default null (Todas)
  selectedCategory = signal<string | null>(null); // Categoria activa para filtrar

  // Date Picker State
  showDatePicker = signal(false);
  customStartDate = signal<string>('');
  customEndDate = signal<string>('');
  dateLabel = signal<string>('Hoy');

  // Chart Options
  salesByHourOptions: Partial<ChartOptions> | any = {};
  salesByCategoryOptions: Partial<ChartOptions> | any = {};

  ngOnInit() {
    // Initialize with default filters
    // Si es admin, empezamos con null (Todas). Si es vendedor, con su sucursal.
    if (this.authService.getUser()?.rol === 'ADMIN') {
      this.selectedSucursal.set(null);
    } else {
      this.selectedSucursal.set(this.sessionService.sucursalId());
    }

    // Init dates
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

    // Apply Date Filters
    filters.fechaInicio = this.customStartDate();
    filters.fechaFin = this.customEndDate();

    // Apply Categoria Filter
    if (this.selectedCategory()) {
      filters.categoria = this.selectedCategory()!;
      filters.limit = 0; // Sin limite cuando hay categoria seleccionada
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

        // Calcular porcentajes para métodos de pago
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
    // 1. Ventas por Hora (Area Chart)
    // Generamos las 24 horas del día (0-23)
    const fullHours = Array.from({ length: 24 }, (_, i) => i);

    // Creamos un mapa para búsqueda rápida de las ventas existentes
    const salesMap = new Map(this.ventasPorHora().map((v) => [v.hora, v.cantidad]));

    // Mapeamos las 24 horas: si existe venta usamos su cantidad, si no 0
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

    // 2. Ventas por Categoría (Bar Chart)
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
    const summaryFont = { bold: true };
    const summaryFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFF3CD' } };
    const grandFont = { bold: true, color: { argb: 'FFFFFFFF' } };
    const grandFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF333333' } };
    const grandBorder = {
      top: { style: 'medium' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'medium' as const },
      right: { style: 'thin' as const },
    };
    const colWidths = [18, 8, 28, 18, 15, 15, 14, 14, 14, 12, 14, 14, 14, 14];
    const headers = [
      'Fecha y Hora', 'Cant', 'Modelo', 'Categoria', 'Marca', 'Corte',
      'P. Unit. (Bs)', 'Subtotal (Bs)',
      'Efectivo (Bs)', 'QR (Bs)', 'Tarjeta (Bs)', 'Giftcard (Bs)', 'Descuento (Bs)', 'Total Venta (Bs)',
    ];

    sucursalMap.forEach((sucData) => {
      const sheet = workbook.addWorksheet(sucData.nombre.substring(0, 31));

      colWidths.forEach((w, i) => {
        sheet.getColumn(i + 1).width = w;
      });

      const headerRow = sheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.font = headerFont;
        cell.fill = headerFill;
        cell.border = thinBorder;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      const dayMap = new Map<string, VentaExportRow[]>();
      sucData.rows.forEach((row) => {
        const date = new Date(row.fecha_venta);
        const key = [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, '0'),
          String(date.getDate()).padStart(2, '0'),
        ].join('-');
        if (!dayMap.has(key)) dayMap.set(key, []);
        dayMap.get(key)!.push(row);
      });

      let grandUnidades = 0;
      let grandSubtotal = 0;
      let grandEfectivo = 0;
      let grandQr = 0;
      let grandTarjeta = 0;
      let grandGiftcard = 0;
      let grandDescuento = 0;
      let grandTotal = 0;

      const sortedDays = Array.from(dayMap.keys()).sort();

      sortedDays.forEach((dayKey) => {
        const dayRows = dayMap.get(dayKey)!;

        const categoriesInDay = new Set(dayRows.map((r) => r.categoria));
        let sorted: VentaExportRow[];
        if (categoriesInDay.size > 1) {
          sorted = [...dayRows].sort((a, b) => {
            const catCmp = a.categoria.localeCompare(b.categoria);
            if (catCmp !== 0) return catCmp;
            return new Date(a.fecha_venta).getTime() - new Date(b.fecha_venta).getTime();
          });
        } else {
          sorted = [...dayRows].sort(
            (a, b) => new Date(a.fecha_venta).getTime() - new Date(b.fecha_venta).getTime()
          );
        }

        sorted.forEach((row) => {
          const date = new Date(row.fecha_venta);
          const dateStr = [
            String(date.getDate()).padStart(2, '0'),
            String(date.getMonth() + 1).padStart(2, '0'),
            date.getFullYear(),
          ].join('/') + ' ' + [
            String(date.getHours()).padStart(2, '0'),
            String(date.getMinutes()).padStart(2, '0'),
          ].join(':');

          sheet.addRow([
            dateStr,
            row.cantidad,
            row.nombre_modelo,
            row.categoria,
            row.marca,
            row.corte,
            row.precio_unitario,
            row.total_detalle,
            '', '', '', '', '', '',
          ]);
        });

        const totalUnidades = sorted.reduce((s, r) => s + r.cantidad, 0);
        const totalSubtotal = sorted.reduce((s, r) => s + r.total_detalle, 0);

        const ventasUnicas = new Set<number>();
        let efecDia = 0,
          qrDia = 0,
          tarjDia = 0,
          giftDia = 0,
          descDia = 0,
          totalDia = 0;
        sorted.forEach((r) => {
          if (!ventasUnicas.has(r.id_venta)) {
            ventasUnicas.add(r.id_venta);
            efecDia += r.monto_efectivo;
            qrDia += r.monto_qr;
            tarjDia += r.monto_tarjeta;
            giftDia += r.monto_giftcard;
            descDia += r.descuento;
            totalDia += r.total_venta;
          }
        });

        const summaryRow = sheet.addRow([
          'TOTAL DIA ' + dayKey.split('-').reverse().join('/'),
          totalUnidades,
          '', '', '', '',
          '',
          totalSubtotal,
          efecDia,
          qrDia,
          tarjDia,
          giftDia,
          descDia,
          totalDia,
        ]);
        summaryRow.eachCell((cell) => {
          cell.font = summaryFont;
          cell.fill = summaryFill;
          cell.border = thinBorder;
        });

        sheet.addRow([]);

        grandUnidades += totalUnidades;
        grandSubtotal += totalSubtotal;
        grandEfectivo += efecDia;
        grandQr += qrDia;
        grandTarjeta += tarjDia;
        grandGiftcard += giftDia;
        grandDescuento += descDia;
        grandTotal += totalDia;
      });

      const grandRow = sheet.addRow([
        'GRAN TOTAL',
        grandUnidades,
        '', '', '', '',
        '',
        grandSubtotal,
        grandEfectivo,
        grandQr,
        grandTarjeta,
        grandGiftcard,
        grandDescuento,
        grandTotal,
      ]);
      grandRow.eachCell((cell) => {
        cell.font = grandFont;
        cell.fill = grandFill;
        cell.border = grandBorder;
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
