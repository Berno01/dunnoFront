import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CatalogoItemDrop } from '../../../../core/models/drops.models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-drop-product-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="group cursor-pointer flex flex-col gap-3" (click)="onCardClick()">
      <!-- Imagen Container -->
      <div class="relative aspect-[4/5] w-full overflow-hidden bg-gray-100">
        <img
          [src]="getImageSrc(product)"
          [alt]="product.nombreModelo"
          class="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          onerror="this.onerror=null; this.src='/assets/images/placeholder-product.svg'"
        />
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
      </div>
    </div>
  `,
})
export class DropProductCardComponent {
  @Input({ required: true }) product!: CatalogoItemDrop;
  @Output() cardClick = new EventEmitter<CatalogoItemDrop>();

  private readonly assetBasePath = '/assets/images/';

  getImageSrc(product: CatalogoItemDrop): string {
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
    this.cardClick.emit(this.product);
  }
}
