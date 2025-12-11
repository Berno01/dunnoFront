import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, switchMap, debounceTime } from 'rxjs';
import { UsuariosService } from './services/usuarios.service';
import { SessionService } from '../../core/services/session.service';
import { AuthService } from '../../core/services/auth.service';
import {
  DashboardUsuariosResponse,
  VendedorRanking,
  AnalisisDescuentos,
  TopItemAPI,
  UsuariosFilters,
} from './models/usuarios.models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class UsuariosComponent implements OnInit, OnDestroy {
  private usuariosService = inject(UsuariosService);
  public sessionService = inject(SessionService);
  public authService = inject(AuthService);

  // State
  isLoading = signal<boolean>(true);

  // Data Signals
  rankingVendedores = signal<VendedorRanking[]>([]);
  analisisDescuentos = signal<AnalisisDescuentos | null>(null);
  topCategorias = signal<TopItemAPI[]>([]);
  topModelos = signal<TopItemAPI[]>([]);
  topColores = signal<TopItemAPI[]>([]);
  distribucionTallas = signal<TopItemAPI[]>([]);

  // Filters
  dateMode = signal<'day' | 'range'>('day'); // Modo: día específico o rango
  selectedDate = signal<string>(''); // Para modo día
  customStartDate = signal<string>('');
  customEndDate = signal<string>('');
  selectedVendedorId = signal<number | null>(null);
  dateLabel = signal<string>('Hoy');

  // Quick Range Selection
  selectedRange = signal<string>('hoy');
  showDatePicker = signal(false);

  // RxJS para optimización
  private filtersSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // Inicializar con la fecha de hoy
    const hoy = this.usuariosService.getRangoHoy();
    this.selectedDate.set(hoy.fechaInicio);
    this.customStartDate.set(hoy.fechaInicio);
    this.customEndDate.set(hoy.fechaFin);

    // Configurar suscripción con switchMap para cancelar peticiones pendientes
    this.filtersSubject
      .pipe(
        debounceTime(300), // Esperar 300ms después del último cambio
        switchMap(() => {
          this.isLoading.set(true);
          const filters = this.buildFilters();
          const userId = this.sessionService.userId();
          return this.usuariosService.getDashboardData(userId, filters);
        })
      )
      .subscribe({
        next: (data) => {
          this.updateData(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading usuarios dashboard data', err);
          this.isLoading.set(false);
        },
      });

    // Cargar datos iniciales
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildFilters(): UsuariosFilters {
    const filters: UsuariosFilters = {
      startDate: this.dateMode() === 'day' ? this.selectedDate() : this.customStartDate(),
      endDate: this.dateMode() === 'day' ? this.selectedDate() : this.customEndDate(),
    };

    if (this.selectedVendedorId()) {
      filters.salesRepId = this.selectedVendedorId()!;
    }

    return filters;
  }

  private updateData(data: DashboardUsuariosResponse) {
    this.rankingVendedores.set(data.ranking_vendedores);
    this.analisisDescuentos.set(data.analisis_descuentos);
    this.topCategorias.set(data.top_categorias);
    this.topModelos.set(data.top_modelos);
    this.topColores.set(data.top_colores);
    this.distribucionTallas.set(data.distribucion_tallas);
  }

  loadData() {
    this.filtersSubject.next();
  }

  // Date Mode Toggle
  setDateMode(mode: 'day' | 'range') {
    this.dateMode.set(mode);
    if (mode === 'day') {
      // Usar selectedDate como ambas fechas
      this.selectedDate.set(this.customStartDate());
    }
    this.loadData();
  }

  // Date Picker Methods
  toggleDatePicker() {
    this.showDatePicker.update((v) => !v);
  }

  selectQuickRange(range: string) {
    this.selectedRange.set(range);
    let dateRange;

    switch (range) {
      case 'hoy':
        dateRange = this.usuariosService.getRangoHoy();
        this.dateLabel.set('Hoy');
        this.dateMode.set('day');
        this.selectedDate.set(dateRange.fechaInicio);
        break;
      case 'mes':
        dateRange = this.usuariosService.getRangoEsteMes();
        this.dateLabel.set('Este Mes');
        this.dateMode.set('range');
        break;
      case '7dias':
        dateRange = this.usuariosService.getRangoUltimos7Dias();
        this.dateLabel.set('Últimos 7 días');
        this.dateMode.set('range');
        break;
      default:
        dateRange = this.usuariosService.getRangoHoy();
        this.dateLabel.set('Hoy');
        this.dateMode.set('day');
        this.selectedDate.set(dateRange.fechaInicio);
    }

    this.customStartDate.set(dateRange.fechaInicio);
    this.customEndDate.set(dateRange.fechaFin);
    this.showDatePicker.set(false);
    this.loadData();
  }

  applyCustomDate() {
    if (this.dateMode() === 'day' && this.selectedDate()) {
      this.dateLabel.set(this.selectedDate());
      this.showDatePicker.set(false);
      this.loadData();
    } else if (this.dateMode() === 'range' && this.customStartDate() && this.customEndDate()) {
      this.selectedRange.set('custom');
      this.dateLabel.set(`${this.customStartDate()} - ${this.customEndDate()}`);
      this.showDatePicker.set(false);
      this.loadData();
    }
  }

  // Vendedor Selection
  selectVendedor(vendedor: VendedorRanking) {
    if (this.selectedVendedorId() === vendedor.id_usuario) {
      // Si ya está seleccionado, deseleccionar (volver a datos globales)
      this.selectedVendedorId.set(null);
    } else {
      // Seleccionar nuevo vendedor
      this.selectedVendedorId.set(vendedor.id_usuario);
    }
    this.loadData();
  }

  isVendedorSelected(vendedorId: number): boolean {
    return this.selectedVendedorId() === vendedorId;
  }

  // Helper para iniciales del avatar
  getInitials(nombreCompleto: string): string {
    const names = nombreCompleto.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  }

  // Helper para formato de moneda
  formatCurrency(value: number): string {
    return `Bs. ${value.toLocaleString('es-BO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  // Helper para formato de porcentaje
  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }
}
