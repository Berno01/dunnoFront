import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DropsService } from '../../../../core/services/drops.service';
import { SessionService } from '../../../../core/services/session.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Drop } from '../../../../core/models/drops.models';

@Component({
  selector: 'app-drops-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-white">
      <!-- Header Filtros -->
      <div class="px-4 md:px-8 py-4 md:py-6 border-b border-gray-100">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <!-- Izquierda: Filtro Sucursal (solo Admin) -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
            @if (isAdmin()) {
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <label
                class="text-xs font-semibold tracking-[0.15em] md:tracking-[0.2em] text-gray-400"
                >SUCURSAL</label
              >
              <select
                class="px-3 md:px-4 py-2 border border-black text-xs md:text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-black w-full sm:w-auto"
                [ngModel]="selectedBranch()"
                (ngModelChange)="onBranchChange($event)"
              >
                <option [value]="null">Todas</option>
                <option [value]="1">Tarija</option>
                <option [value]="2">Cochabamba</option>
                <option [value]="3">Santa Cruz</option>
              </select>
            </div>
            }
          </div>

          <!-- Derecha: Info y Acciones -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-6">
            <span
              class="text-xs tracking-[0.15em] md:tracking-[0.2em] text-gray-400 text-center sm:text-left"
            >
              {{ drops().length }} REGISTROS
            </span>

            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <!-- Date Picker -->
              <div class="relative">
                <input
                  type="date"
                  class="w-full px-3 md:px-4 py-2 border border-gray-300 text-xs md:text-sm outline-none focus:border-black"
                  [ngModel]="selectedDate()"
                  (ngModelChange)="onDateChange($event)"
                />
              </div>

              <!-- Botón Nuevo Drop -->
              <button
                type="button"
                class="px-4 md:px-6 py-2 bg-black text-white text-xs font-semibold tracking-[0.15em] md:tracking-[0.2em] hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                (click)="onNewDrop()"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
                <span class="hidden sm:inline">NUEVO DROP</span>
                <span class="sm:hidden">NUEVO</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla Desktop / Cards Mobile -->
      <div class="flex-1 overflow-auto">
        @if (loading()) {
        <div class="flex items-center justify-center h-64">
          <div
            class="h-10 w-10 border-4 border-gray-300 border-t-black rounded-full animate-spin"
          ></div>
        </div>
        } @else if (drops().length === 0) {
        <div class="flex flex-col items-center justify-center h-64 text-gray-400">
          <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            ></path>
          </svg>
          <p class="text-sm tracking-wider">No se encontraron recepciones</p>
        </div>
        } @else {

        <!-- Vista Desktop: Tabla -->
        <div class="hidden md:block">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  ID
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Fecha
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Sucursal
                </th>
                <th
                  class="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Cantidad Items
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Estado
                </th>
                <th
                  class="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (drop of drops(); track drop.idRecepcion) {
              <tr
                class="hover:bg-gray-50 transition-colors"
                [class.opacity-50]="drop.estado === false"
              >
                <td class="px-6 py-4 text-sm font-semibold text-gray-900">
                  #{{ drop.idRecepcion }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ formatDate(drop.fecha) }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ getBranchName(drop.idSucursal) }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 text-center">
                  {{ getTotalItems(drop) }}
                </td>
                <td class="px-6 py-4 text-sm">
                  <span
                    class="px-2 py-1 text-xs font-medium"
                    [class.bg-green-100]="drop.estado !== false"
                    [class.text-green-800]="drop.estado !== false"
                    [class.bg-red-100]="drop.estado === false"
                    [class.text-red-800]="drop.estado === false"
                  >
                    {{ drop.estado === false ? 'ANULADO' : 'ACTIVO' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-center">
                  <div class="flex items-center justify-center gap-2">
                    @if (drop.estado !== false) {
                    <!-- Botón Ver -->
                    <button
                      type="button"
                      class="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      (click)="onViewDrop(drop)"
                      title="Ver detalles"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        ></path>
                      </svg>
                    </button>
                    <!-- Botón Anular -->
                    <button
                      type="button"
                      class="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      (click)="onDeleteDrop(drop)"
                      title="Anular"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path>
                      </svg>
                    </button>
                    }
                  </div>
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Vista Mobile: Cards -->
        <div class="md:hidden px-3 py-4 space-y-3">
          @for (drop of drops(); track drop.idRecepcion) {
          <div
            class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
            [class.opacity-60]="drop.estado === false"
          >
            <!-- Header -->
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-bold text-gray-900">#{{ drop.idRecepcion }}</span>
              <span
                class="px-2 py-1 text-xs font-bold rounded"
                [class.bg-green-100]="drop.estado !== false"
                [class.text-green-800]="drop.estado !== false"
                [class.bg-red-100]="drop.estado === false"
                [class.text-red-800]="drop.estado === false"
              >
                {{ drop.estado === false ? 'ANULADO' : 'ACTIVO' }}
              </span>
            </div>

            <!-- Info -->
            <div class="space-y-2 text-xs text-gray-600 mb-4">
              <div class="flex justify-between">
                <span>Fecha:</span>
                <span class="font-semibold text-gray-900">{{ formatDate(drop.fecha) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Sucursal:</span>
                <span class="font-semibold text-gray-900">{{
                  getBranchName(drop.idSucursal)
                }}</span>
              </div>
              <div class="flex justify-between">
                <span>Items:</span>
                <span class="font-semibold text-gray-900">{{ getTotalItems(drop) }}</span>
              </div>
            </div>

            <!-- Acciones -->
            @if (drop.estado !== false) {
            <div class="flex gap-2">
              <button
                type="button"
                class="flex-1 px-3 py-2 border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
                (click)="onViewDrop(drop)"
              >
                Ver Detalles
              </button>
              <button
                type="button"
                class="px-3 py-2 border border-red-300 text-xs font-medium text-red-600 hover:bg-red-50"
                (click)="onDeleteDrop(drop)"
              >
                Anular
              </button>
            </div>
            }
          </div>
          }
        </div>
        }
      </div>
    </div>
  `,
})
export class DropsListComponent {
  private dropsService = inject(DropsService);
  private sessionService = inject(SessionService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  // Signals
  drops = signal<Drop[]>([]);
  loading = signal<boolean>(true);
  selectedDate = signal<string | null>(this.getTodayString());
  selectedBranch = signal<number | null>(null);

  // Computed
  isAdmin = computed(() => this.sessionService.rol() === 'ADMIN');

  constructor() {
    // Inicializar sucursal según el rol
    if (!this.isAdmin()) {
      this.selectedBranch.set(this.sessionService.sucursalId());
    }

    // Auto-cargar al iniciar
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.loadDrops();
      }
    });
  }

  private loadDrops(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.loading.set(true);

    const filters: any = {};
    if (this.selectedDate()) {
      filters.fecha = this.selectedDate();
    }
    if (this.selectedBranch() !== null) {
      filters.idSucursal = this.selectedBranch();
    }

    this.dropsService.getDrops(filters).subscribe({
      next: (drops) => {
        this.drops.set(drops);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando recepciones:', err);
        this.toastService.show('error', 'Error al cargar recepciones');
        this.loading.set(false);
      },
    });
  }

  onDateChange(date: string): void {
    this.selectedDate.set(date || null);
    this.loadDrops();
  }

  onBranchChange(value: any): void {
    const branchId = value === 'null' || value === null ? null : Number(value);
    this.selectedBranch.set(branchId);

    if (branchId !== null) {
      // Cambiar a una sucursal específica
      const branchName = this.getBranchName(branchId);
      this.sessionService.setSucursal(branchId, branchName);
    } else {
      // Si es "Todas", restaurar la sucursal original del usuario
      this.sessionService.restoreOriginalSucursal();
    }

    this.loadDrops();
  }

  onNewDrop(): void {
    this.router.navigate(['/drops/nueva']);
  }

  onViewDrop(drop: Drop): void {
    if (!drop.idRecepcion) return;
    this.router.navigate(['/drops/editar', drop.idRecepcion]);
  }

  onDeleteDrop(drop: Drop): void {
    if (!confirm(`¿Estás seguro de anular la recepción #${drop.idRecepcion}?`)) {
      return;
    }

    this.dropsService.deleteDrop(drop.idRecepcion!).subscribe({
      next: () => {
        this.toastService.show('success', 'Recepción anulada exitosamente');
        this.loadDrops();
      },
      error: (err) => {
        console.error('Error anulando recepción:', err);
        this.toastService.show('error', 'Error al anular la recepción');
      },
    });
  }

  formatDate(fecha: Date | string): string {
    if (!fecha) return '-';
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getBranchName(idSucursal: number): string {
    const branches: { [key: number]: string } = {
      1: 'Tarija',
      2: 'Cochabamba',
      3: 'Santa Cruz',
    };
    return branches[idSucursal] || 'Desconocida';
  }

  getTotalItems(drop: Drop): number {
    return drop.detalles?.reduce((sum, detalle) => sum + detalle.cantidad, 0) || 0;
  }

  private getTodayString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
