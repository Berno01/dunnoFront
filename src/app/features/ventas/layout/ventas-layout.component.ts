import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogComponent } from '../components/catalog/catalog.component';
import { CartSummaryComponent } from '../components/cart-summary/cart-summary.component';
import { VentasStoreService } from '../../../core/services/ventas-store.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ventas-layout',
  standalone: true,
  imports: [CommonModule, CatalogComponent, CartSummaryComponent],
  template: `
    <div class="h-[calc(100vh-5rem)] flex flex-col overflow-hidden bg-white">
      <!-- Header con botón de volver -->
      <div
        class="px-3 md:px-6 py-3 md:py-4 border-b border-gray-100 flex items-center gap-2 md:gap-4"
      >
        <button
          type="button"
          class="flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-gray-600 hover:text-black transition-colors group"
          (click)="goBack()"
        >
          <svg
            class="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
          <span class="font-medium tracking-wide hidden sm:inline">VOLVER AL LISTADO</span>
          <span class="font-medium tracking-wide sm:hidden">VOLVER</span>
        </button>
        <div class="h-4 w-px bg-gray-200 hidden md:block"></div>
        <span
          class="text-[10px] md:text-xs tracking-[0.15em] md:tracking-[0.2em] text-gray-400 uppercase truncate"
        >
          {{ isEditMode ? 'Editar #' + editingId : 'Nueva Venta' }}
        </span>
      </div>

      <!-- Loading Overlay -->
      @if (ventasStore.isLoading()) {
      <div class="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
        <div class="text-center">
          <div
            class="h-12 w-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto"
          ></div>
          <p class="mt-4 text-sm text-gray-600">Cargando venta...</p>
        </div>
      </div>
      }

      <!-- Contenido Principal -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Catálogo (Full width en mobile, 75% en desktop) -->
        <section class="w-full lg:w-3/4 h-full lg:border-r border-gray-200 overflow-hidden">
          <app-catalog></app-catalog>
        </section>

        <!-- Carrito Desktop (Solo visible en desktop) -->
        <section class="hidden lg:block lg:w-1/4 h-full bg-gray-50 overflow-hidden">
          <app-cart-summary></app-cart-summary>
        </section>
      </div>

      <!-- Botón Flotante Mobile (Solo visible en mobile) -->
      <button
        type="button"
        class="lg:hidden fixed bottom-6 right-4 z-40 bg-black text-white rounded-full shadow-2xl flex items-center gap-3 px-6 py-4 hover:bg-gray-800 transition-all active:scale-95"
        (click)="toggleCartModal()"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          ></path>
        </svg>
        <div class="flex flex-col items-start">
          <span class="text-xs font-bold tracking-wider">CARRITO</span>
          <span class="text-[10px] text-gray-300"
            >{{ ventasStore.cantidadTotalArticulos() }} items · Bs.
            {{ ventasStore.totalVenta().toFixed(2) }}</span
          >
        </div>
        @if (ventasStore.cantidadTotalArticulos() > 0) {
        <div
          class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
        >
          {{ ventasStore.cantidadTotalArticulos() }}
        </div>
        }
      </button>

      <!-- Modal/Drawer Carrito Mobile -->
      @if (cartModalOpen()) {
      <div
        class="lg:hidden fixed inset-0 z-50 bg-black/50 animate-fadeIn"
        (click)="toggleCartModal()"
      >
        <div
          class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[90vh] flex flex-col animate-slideUp"
          (click)="$event.stopPropagation()"
        >
          <!-- Header Modal -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 class="text-sm font-bold tracking-wider text-gray-900">
              CARRITO ({{ ventasStore.cantidadTotalArticulos() }})
            </h2>
            <div class="flex items-center gap-3">
              @if (ventasStore.cantidadTotalArticulos() > 0) {
              <button
                type="button"
                class="text-xs text-gray-400 hover:text-red-600 transition-colors uppercase tracking-wider"
                (click)="clearCart()"
              >
                Vaciar
              </button>
              }
              <button
                type="button"
                class="p-2 text-gray-400 hover:text-gray-900"
                (click)="toggleCartModal()"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Contenido del Carrito -->
          <div class="flex-1 overflow-hidden">
            <app-cart-summary></app-cart-summary>
          </div>
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes slideUp {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }

      .animate-fadeIn {
        animation: fadeIn 0.2s ease-out;
      }

      .animate-slideUp {
        animation: slideUp 0.3s ease-out;
      }
    `,
  ],
})
export class VentasLayoutComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected ventasStore = inject(VentasStoreService);

  isEditMode = false;
  editingId: number | null = null;
  cartModalOpen = signal<boolean>(false);

  ngOnInit() {
    // Detectar si estamos en modo edición
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.isEditMode = true;
      this.editingId = parseInt(idParam, 10);

      // Cargar la venta para edición (hidratación)
      this.ventasStore.loadSaleForEdit(this.editingId);
    } else {
      // Modo creación: limpiar el estado
      this.ventasStore.resetState();
    }
  }

  goBack() {
    this.router.navigate(['/ventas']);
  }

  toggleCartModal() {
    this.cartModalOpen.update((v) => !v);
  }

  clearCart() {
    this.ventasStore.clearCart();
  }
}
