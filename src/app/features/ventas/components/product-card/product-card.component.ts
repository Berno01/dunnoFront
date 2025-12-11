import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ResumenPrendaDTO } from '../../../../core/models/catalogo.models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="group cursor-pointer flex flex-col gap-3"
      (click)="onCardClick()"
      [class.opacity-75]="product.stockTotal === 0"
      [class.pointer-events-none]="product.stockTotal === 0"
    >
      <!-- Imagen Container -->
      <div class="relative aspect-[4/5] w-full overflow-hidden bg-gray-100">
        <img
          [src]="getImageSrc(product)"
          [alt]="product.nombreModelo"
          class="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          onerror="this.onerror=null; this.src='/assets/images/placeholder-product.svg'"
        />

        <!-- Badge Agotado -->
        @if (product.stockTotal === 0) {
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="bg-white border border-black px-3 py-1">
            <span class="text-xs font-bold tracking-wider text-black">AGOTADO</span>
          </div>
        </div>
        }

        <!-- Badge Pocas Unidades -->
        @if (product.stockTotal > 0 && product.pocasUnidades) {
        <div class="absolute top-2 right-2">
          <span
            class="bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 uppercase tracking-wide"
          >
            Pocas Unidades
          </span>
        </div>
        }
      </div>

      <!-- Info Producto -->
      <div class="flex flex-col items-start gap-1">
        <span class="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          {{ product.nombreCategoria }}
        </span>
        <h3
          class="font-serif text-lg leading-tight text-gray-900 group-hover:underline decoration-1 underline-offset-4"
        >
          {{ product.nombreModelo }}
        </h3>
        <p class="text-base font-bold text-gray-900 mt-1">Bs. {{ product.precio.toFixed(2) }}</p>
      </div>
    </div>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ResumenPrendaDTO;
  @Output() cardClick = new EventEmitter<ResumenPrendaDTO>();

  private readonly assetBasePath = '/assets/images/';

  getImageSrc(product: ResumenPrendaDTO): string {
    const relativePath = product.fotoPortada?.trim();
    if (!relativePath) {
      return `${this.assetBasePath}placeholder-product.svg`;
    }

    if (/^https?:\/\//i.test(relativePath)) {
      return relativePath;
    }

    const sanitizedPath = relativePath.replace(/^\/+/, '');
    return `${this.assetBasePath}${sanitizedPath}`;
  }

  onCardClick() {
    if (this.product.stockTotal > 0) {
      this.cardClick.emit(this.product);
    }
  }
}
