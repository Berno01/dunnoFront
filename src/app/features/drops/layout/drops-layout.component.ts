import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DropCatalogComponent } from '../components/drop-catalog/drop-catalog.component';
import { DropSummaryComponent } from '../components/drop-summary/drop-summary.component';
import { DropsStoreService } from '../services/drops-store.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-drops-layout',
  standalone: true,
  imports: [CommonModule, DropCatalogComponent, DropSummaryComponent],
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
          {{ isEditMode ? 'Editar #' + editingId : 'Nueva Recepción' }}
        </span>
      </div>

      <!-- Loading Overlay -->
      @if (dropsStore.isLoading()) {
      <div class="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
        <div class="text-center">
          <div
            class="h-12 w-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto"
          ></div>
          <p class="mt-4 text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
      }

      <!-- Contenido Principal -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Catálogo (Full width en mobile, 75% en desktop) -->
        <section class="w-full lg:w-3/4 h-full lg:border-r border-gray-200 overflow-hidden">
          <app-drop-catalog></app-drop-catalog>
        </section>

        <!-- Resumen Desktop (Solo visible en desktop) -->
        <section class="hidden lg:block lg:w-1/4 h-full bg-gray-50 overflow-hidden">
          <app-drop-summary></app-drop-summary>
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
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          ></path>
        </svg>
        <span class="font-semibold tracking-wider">{{ dropsStore.itemCount() }}</span>
      </button>

      <!-- Modal Mobile para Resumen -->
      @if (showCartModal()) {
      <div
        class="lg:hidden fixed inset-0 z-50 bg-black/50 flex items-end"
        (click)="toggleCartModal()"
      >
        <div
          class="w-full bg-white rounded-t-2xl max-h-[85vh] flex flex-col"
          (click)="$event.stopPropagation()"
        >
          <!-- Handle -->
          <div class="flex-shrink-0 flex justify-center py-2">
            <div class="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>

          <!-- Contenido del Resumen con Scroll -->
          <div class="flex-1 overflow-y-auto min-h-0">
            <app-drop-summary></app-drop-summary>
          </div>
        </div>
      </div>
      }
    </div>
  `,
})
export class DropsLayoutComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected dropsStore = inject(DropsStoreService);

  isEditMode = false;
  editingId: number | null = null;
  showCartModal = signal<boolean>(false);

  ngOnInit() {
    // Detectar si estamos en modo edición
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.isEditMode = true;
      this.editingId = parseInt(idParam, 10);

      // Cargar el drop para edición (hidratación)
      this.dropsStore.loadDropForEdit(this.editingId);
    } else {
      // Modo creación: limpiar el estado
      this.dropsStore.clearCart();
    }
  }

  goBack(): void {
    // Confirmar si hay items en el carrito
    if (this.dropsStore.itemCount() > 0) {
      if (confirm('¿Descartar cambios y volver al listado?')) {
        this.dropsStore.clearCart();
        this.router.navigate(['/drops']);
      }
    } else {
      this.router.navigate(['/drops']);
    }
  }

  toggleCartModal(): void {
    this.showCartModal.update((val) => !val);
  }
}
