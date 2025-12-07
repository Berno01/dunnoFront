import { Component, inject, OnInit } from '@angular/core';
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
      <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors group"
          (click)="goBack()"
        >
          <svg
            class="w-5 h-5 transition-transform group-hover:-translate-x-1"
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
          <span class="font-medium tracking-wide">VOLVER AL LISTADO</span>
        </button>
        <div class="h-4 w-px bg-gray-200"></div>
        <span class="text-xs tracking-[0.2em] text-gray-400 uppercase">
          {{ isEditMode ? 'Editar Venta #' + editingId : 'Nueva Venta' }}
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
        <!-- Columna Izquierda: Catálogo (75%) -->
        <section class="w-3/4 h-full border-r border-gray-200">
          <app-catalog></app-catalog>
        </section>

        <!-- Columna Derecha: Resumen de Venta (25%) -->
        <section class="w-1/4 h-full bg-gray-50">
          <app-cart-summary></app-cart-summary>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
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
}
