import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DropsStoreService } from '../../services/drops-store.service';
import { DropsService } from '../../../../core/services/drops.service';
import { SessionService } from '../../../../core/services/session.service';
import { ToastService } from '../../../../core/services/toast.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-drop-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-gray-50">
      <!-- Header (Solo visible en desktop) -->
      <div
        class="hidden lg:flex flex-shrink-0 px-3 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-white"
      >
        <div class="flex items-center justify-between w-full">
          <h2
            class="text-xs md:text-sm font-bold tracking-[0.15em] md:tracking-[0.2em] text-gray-900"
          >
            RESUMEN ({{ itemCount() }})
          </h2>
          @if (itemCount() > 0) {
          <button
            type="button"
            class="text-[10px] md:text-xs text-gray-400 hover:text-red-600 transition-colors uppercase tracking-wider"
            (click)="onClearCart()"
          >
            Vaciar
          </button>
          }
        </div>
      </div>

      <!-- Items List -->
      <div class="flex-1 overflow-y-auto px-3 md:px-6 py-3 md:py-4 min-h-0">
        @if (itemCount() === 0) {
        <div class="flex flex-col items-center justify-center h-full text-gray-400">
          <svg
            class="w-12 md:w-16 h-12 md:h-16 mb-3 md:mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            ></path>
          </svg>
          <p class="text-xs md:text-sm tracking-wider">Sin items agregados</p>
        </div>
        } @else {
        <div class="space-y-3 md:space-y-4">
          @for (item of cartItems(); track item.idVariante) {
          <div class="flex gap-2 md:gap-3 pb-3 md:pb-4 border-b border-gray-100">
            <img
              [src]="resolveImageUrl(item.fotoUrl)"
              [alt]="item.nombreModelo"
              class="w-14 h-16 md:w-16 md:h-20 object-cover bg-gray-200 flex-shrink-0"
              onerror="this.onerror=null; this.src='/assets/images/placeholder-product.svg'"
            />
            <div class="flex-1 flex flex-col justify-between min-w-0">
              <div class="space-y-0.5 md:space-y-1">
                <h4 class="text-[11px] md:text-xs font-semibold text-gray-900 truncate">
                  {{ item.nombreModelo }}
                </h4>
                <p class="text-[10px] md:text-xs text-gray-500 line-clamp-1">
                  {{ item.nombreMarca }} / {{ item.nombreColor }} / {{ item.nombreTalla }}
                </p>
              </div>
              <div class="flex items-center justify-between gap-2 mt-2">
                <div class="flex items-center gap-1.5 md:gap-2">
                  <button
                    type="button"
                    class="w-7 h-7 md:w-6 md:h-6 flex items-center justify-center border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm"
                    (click)="decrementItem(item.idVariante)"
                  >
                    -
                  </button>
                  <span class="text-xs md:text-sm font-medium w-7 md:w-8 text-center">{{
                    item.cantidad
                  }}</span>
                  <button
                    type="button"
                    class="w-7 h-7 md:w-6 md:h-6 flex items-center justify-center border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm"
                    (click)="incrementItem(item.idVariante)"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
          }
        </div>
        }
      </div>

      <!-- Footer con Datos y Botón Guardar -->
      @if (itemCount() > 0) {
      <div
        class="flex-shrink-0 border-t border-gray-200 bg-white px-3 md:px-6 py-3 md:py-4 space-y-3 md:space-y-4"
      >
        <!-- Total de Items -->
        <div class="flex items-center justify-between text-xs md:text-sm">
          <span class="text-gray-600">Total Items</span>
          <span class="font-semibold text-gray-900">{{ itemCount() }}</span>
        </div>

        <!-- Sucursal -->
        <div class="space-y-2">
          <label
            class="text-[10px] md:text-xs font-semibold tracking-[0.15em] md:tracking-[0.2em] text-gray-500"
            >SUCURSAL</label
          >
          @if (isAdmin() && !isEditMode()) {
          <select
            class="w-full px-3 py-2 border border-black text-xs md:text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-black"
            [ngModel]="sessionService.sucursalId()"
            (ngModelChange)="onBranchChange($event)"
          >
            <option [value]="1">Tarija</option>
            <option [value]="2">Cochabamba</option>
            <option [value]="3">Santa Cruz</option>
          </select>
          } @else {
          <div
            class="px-3 py-2 border border-gray-300 text-xs md:text-sm font-medium text-gray-900 bg-gray-50"
          >
            {{ sessionService.sucursalNombre() }}
          </div>
          }
        </div>

        <!-- Botón Guardar -->
        <button
          type="button"
          class="w-full px-4 py-3 bg-black text-white text-xs md:text-sm font-semibold tracking-[0.15em] md:tracking-[0.2em] hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          [disabled]="saving()"
          (click)="onSaveDrop()"
        >
          {{
            saving() ? 'GUARDANDO...' : isEditMode() ? 'ACTUALIZAR RECEPCIÓN' : 'GUARDAR RECEPCIÓN'
          }}
        </button>
      </div>
      }
    </div>
  `,
})
export class DropSummaryComponent {
  protected dropsStore = inject(DropsStoreService);
  private dropsService = inject(DropsService);
  protected sessionService = inject(SessionService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  // Signals
  saving = signal<boolean>(false);

  // Computed
  cartItems = computed(() => this.dropsStore.cartItems());
  itemCount = computed(() => this.dropsStore.itemCount());
  isEditMode = computed(() => this.dropsStore.isEditMode());
  editingDropId = computed(() => this.dropsStore.getEditingDropId());
  isAdmin = computed(() => this.sessionService.rol() === 'ADMIN');

  resolveImageUrl(fotoUrl: string): string {
    if (!fotoUrl?.trim()) {
      return '/assets/images/placeholder-product.svg';
    }

    if (/^https?:\/\//i.test(fotoUrl)) {
      return fotoUrl;
    }

    const sanitizedPath = fotoUrl.replace(/^\/+/, '');
    return `/assets/images/${sanitizedPath}`;
  }

  onBranchChange(id: string) {
    const branchId = Number(id);
    const branches: { [key: number]: string } = {
      1: 'Tarija',
      2: 'Cochabamba',
      3: 'Santa Cruz',
    };
    this.sessionService.setSucursal(branchId, branches[branchId]);
  }

  incrementItem(idVariante: number): void {
    this.dropsStore.incrementItem(idVariante);
  }

  decrementItem(idVariante: number): void {
    this.dropsStore.decrementItem(idVariante);
  }

  onClearCart(): void {
    if (confirm('¿Estás seguro de vaciar el ingreso actual?')) {
      this.dropsStore.clearCart();
    }
  }

  onSaveDrop(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.itemCount() === 0) return;

    const idSucursal = this.sessionService.sucursalId();
    const items = this.cartItems();
    const editingId = this.editingDropId();

    const dropRequest = {
      idSucursal,
      detalles: items.map((item) => ({
        idVariante: item.idVariante,
        cantidad: item.cantidad,
        idModelo: item.idModelo, // Necesario para actualización
      })),
    };

    this.saving.set(true);

    if (editingId) {
      // Actualizar drop existente
      this.dropsService
        .updateDrop(editingId, dropRequest)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.toastService.show('success', 'Recepción actualizada exitosamente');
            this.dropsStore.clearCart();
            this.saving.set(false);
            this.router.navigate(['/drops']);
          },
          error: (err: any) => {
            console.error('Error actualizando recepción:', err);
            this.toastService.show(
              'error',
              err.error?.mensaje || 'Error al actualizar la recepción'
            );
            this.saving.set(false);
          },
        });
    } else {
      // Crear nuevo drop
      this.dropsService
        .createDrop(dropRequest)
        .pipe(take(1))
        .subscribe({
          next: (response) => {
            this.toastService.show(
              'success',
              response.mensaje || 'Recepción guardada exitosamente'
            );
            this.dropsStore.clearCart();
            this.saving.set(false);
            this.router.navigate(['/drops']);
          },
          error: (err: any) => {
            console.error('Error guardando recepción:', err);
            this.toastService.show('error', err.error?.mensaje || 'Error al guardar la recepción');
            this.saving.set(false);
          },
        });
    }
  }
}
