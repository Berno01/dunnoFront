import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { forkJoin } from 'rxjs';
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

  loadData() {
    this.isLoading.set(true);

    const filters: DashboardFilters = {};

    if (this.selectedSucursal() !== null) {
      filters.idSucursal = this.selectedSucursal()!;
    }

    // Apply Date Filters
    filters.fechaInicio = this.customStartDate();
    filters.fechaFin = this.customEndDate();

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
        height: 350,
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
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          barHeight: '50%',
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
}
