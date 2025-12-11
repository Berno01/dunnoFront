import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModeloDTO } from '../../models/catalogo-admin.models';

@Component({
  selector: 'app-product-card-admin',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="group relative bg-white overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl"
      (click)="cardClick.emit(modelo().id)"
    >
      <!-- Imagen del Producto -->
      <div class="relative aspect-[4/5] overflow-hidden bg-gray-100">
        @if (modelo().colores && modelo().colores.length > 0) {
        <img
          [src]="modelo().colores[0].fotoUrl"
          [alt]="modelo().nombre"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          (error)="onImageError($event)"
        />
        } @else {
        <!-- Placeholder si no hay imagen -->
        <div
          class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
        >
          <svg
            class="w-24 h-24 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            ></path>
          </svg>
        </div>
        }

        <!-- Botones Acción (Aparece en hover) -->
        <div
          class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100"
        >
          <button
            class="px-4 py-1.5 bg-white text-black text-[10px] font-bold tracking-wider hover:bg-gray-100 transition-colors"
            (click)="onEdit($event)"
          >
            EDITAR
          </button>
          <button
            class="p-1.5 bg-white text-red-600 hover:bg-red-50 transition-colors"
            (click)="onDelete($event)"
            title="Eliminar modelo"
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
        </div>
      </div>

      <!-- Información del Producto -->
      <div class="p-3 space-y-0.5">
        <!-- Categoría -->
        <p class="text-[10px] font-semibold tracking-[0.15em] text-gray-400 uppercase">
          {{ modelo().categoria.nombre }}
        </p>

        <!-- Nombre del Modelo -->
        <h3
          class="font-serif text-sm text-gray-900 font-medium leading-tight"
          style="font-family: 'Playfair Display', serif"
        >
          {{ modelo().nombre }}
        </h3>

        <!-- Marca -->
        <p class="text-xs text-gray-500">{{ modelo().marca.nombre }}</p>

        <!-- Colores Disponibles -->
        @if (modelo().colores && modelo().colores.length > 0) {
        <div class="flex items-center gap-1.5 pt-1.5">
          <span class="text-[10px] text-gray-400">{{ modelo().colores.length }} colores</span>
          <div class="flex gap-1">
            @for (colorModelo of modelo().colores.slice(0, 4); track colorModelo.id) {
            <div
              class="w-4 h-4 rounded-full border border-gray-200"
              [style.background-color]="colorModelo.color.codigoHex"
              [title]="colorModelo.color.nombre"
            ></div>
            } @if (modelo().colores.length > 4) {
            <div
              class="w-4 h-4 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-[8px] text-gray-500"
            >
              +{{ modelo().colores.length - 4 }}
            </div>
            }
          </div>
        </div>
        }

        <!-- Precio -->
        <div class="pt-2 border-t border-gray-100 mt-2">
          <p class="text-lg font-bold text-gray-900">Bs. {{ modelo().precio.toFixed(2) }}</p>
        </div>
      </div>
    </div>
  `,
})
export class ProductCardAdminComponent {
  modelo = input.required<ModeloDTO>();
  cardClick = output<number>();
  deleteClick = output<number>();

  onEdit(event: Event) {
    event.stopPropagation();
    this.cardClick.emit(this.modelo().id);
  }

  onDelete(event: Event) {
    event.stopPropagation();
    this.deleteClick.emit(this.modelo().id);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
