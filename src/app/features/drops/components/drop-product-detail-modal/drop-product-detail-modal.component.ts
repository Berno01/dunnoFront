import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
  computed,
  inject,
  signal,
  Output,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ColorDropDetalle,
  ModeloDetalleDrop,
  TallaDropDetalle,
} from '../../../../core/models/drops.models';
import { DropsService } from '../../../../core/services/drops.service';
import { DropsStoreService } from '../../services/drops-store.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-drop-product-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4"
      (click)="onCloseRequest()"
    >
      <div
        class="relative w-full h-full md:h-auto md:max-w-5xl bg-white shadow-2xl grid grid-cols-1 md:grid-cols-2 overflow-y-auto md:overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <button
          type="button"
          class="absolute top-3 right-3 md:top-4 md:right-4 text-gray-400 hover:text-black z-10 bg-white md:bg-transparent rounded-full w-8 h-8 md:w-auto md:h-auto flex items-center justify-center text-2xl md:text-3xl"
          (click)="onCloseRequest()"
        >
          <span class="sr-only">Cerrar</span>
          ×
        </button>

        <!-- Columna Izquierda: Imagen -->
        <div class="hidden md:flex items-center justify-center bg-gray-100 p-6">
          @if (loading()) {
          <div class="h-96 w-full max-w-md flex items-center justify-center">
            <div
              class="h-10 w-10 border-4 border-gray-300 border-t-black rounded-full animate-spin"
            ></div>
          </div>
          } @else {
          <img
            [src]="primaryImage()"
            [alt]="product()?.nombreModelo || 'Producto'"
            class="h-full w-full max-h-[32rem] object-cover"
            onerror="this.onerror=null; this.src='/assets/images/placeholder-product.svg'"
          />
          }
        </div>

        <!-- Columna Derecha: Contenido -->
        <div class="flex flex-col gap-4 md:gap-8 p-4 md:p-8 pb-20 md:pb-8">
          @if (loading()) {
          <div class="flex flex-col gap-4 md:gap-6">
            <div class="h-6 w-40 bg-gray-200 animate-pulse"></div>
            <div class="h-10 w-24 bg-gray-200 animate-pulse"></div>
            <div class="space-y-4">
              <div class="h-4 w-20 bg-gray-200 animate-pulse"></div>
              <div class="h-12 w-full bg-gray-100 animate-pulse"></div>
            </div>
            <div class="space-y-4">
              <div class="h-4 w-24 bg-gray-200 animate-pulse"></div>
              <div class="flex gap-3">
                <div class="h-10 w-10 bg-gray-100 animate-pulse"></div>
                <div class="h-10 w-10 bg-gray-100 animate-pulse"></div>
                <div class="h-10 w-10 bg-gray-100 animate-pulse"></div>
              </div>
            </div>
          </div>
          } @else if (product()) {
          <div class="flex flex-col gap-4 md:gap-8">
            <!-- Imagen Mobile -->
            <div class="md:hidden -mx-4 -mt-4">
              <img
                [src]="primaryImage()"
                [alt]="product()?.nombreModelo || 'Producto'"
                class="h-48 md:h-64 w-full object-cover"
                onerror="this.onerror=null; this.src='/assets/images/placeholder-product.svg'"
              />
            </div>

            <!-- Info del Producto -->
            <div class="space-y-2 md:space-y-3">
              <p
                class="text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] text-gray-400"
              >
                {{ product()?.nombreMarca }} / {{ product()?.nombreCategoria }}
              </p>
              <h2 class="font-serif text-xl md:text-3xl text-gray-900">
                {{ product()?.nombreModelo }}
              </h2>
            </div>

            <!-- Selector de Color -->
            <div class="space-y-3 md:space-y-4">
              <p
                class="text-[10px] md:text-xs font-semibold tracking-[0.15em] md:tracking-[0.2em] text-gray-500"
              >
                COLOR
              </p>
              <div class="flex items-center gap-2 md:gap-4">
                @for (color of product()?.colores ?? []; track color.nombreColor) {
                <button
                  type="button"
                  class="relative h-9 w-9 md:h-10 md:w-10 rounded-full border border-gray-200"
                  [class.ring-2]="selectedColor()?.nombreColor === color.nombreColor"
                  [class.ring-black]="selectedColor()?.nombreColor === color.nombreColor"
                  [class.ring-offset-2]="selectedColor()?.nombreColor === color.nombreColor"
                  [style.background-color]="getColorHex(color)"
                  (click)="onSelectColor(color)"
                >
                  <span class="sr-only">{{ color.nombreColor }}</span>
                </button>
                }
              </div>
            </div>

            <!-- Selector de Talla -->
            <div class="space-y-3 md:space-y-4">
              <p
                class="text-[10px] md:text-xs font-semibold tracking-[0.15em] md:tracking-[0.2em] text-gray-500"
              >
                TALLA
              </p>
              <div class="flex flex-wrap gap-2 md:gap-3">
                @for (talla of availableSizes(); track talla.idVariante) {
                <button
                  type="button"
                  class="w-9 h-9 md:w-10 md:h-10 border text-xs md:text-sm font-medium transition-colors"
                  [class.border-gray-900]="selectedSize()?.idVariante === talla.idVariante"
                  [class.bg-black]="selectedSize()?.idVariante === talla.idVariante"
                  [class.text-white]="selectedSize()?.idVariante === talla.idVariante"
                  [class.border-gray-200]="selectedSize()?.idVariante !== talla.idVariante"
                  [class.text-gray-600]="selectedSize()?.idVariante !== talla.idVariante"
                  (click)="onSelectSize(talla)"
                >
                  {{ talla.nombreTalla }}
                </button>
                }
              </div>
            </div>

            <!-- Input de Cantidad -->
            <div class="space-y-2 md:space-y-3">
              <label
                class="text-[10px] md:text-xs font-semibold tracking-[0.15em] md:tracking-[0.2em] text-gray-500"
                >CANTIDAD A INGRESAR</label
              >
              <div class="flex items-center gap-2 border-b border-gray-300 pb-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  class="w-full text-xl md:text-3xl font-semibold text-gray-900 outline-none"
                  [ngModel]="quantityInput()"
                  (ngModelChange)="onQuantityInput($event)"
                  placeholder="0"
                />
              </div>
            </div>

            <!-- Botones de Acción -->
            <div
              class="flex items-center justify-between gap-3 md:gap-4 pt-4 md:pt-6 border-t border-gray-200"
            >
              <button
                type="button"
                class="text-xs md:text-sm font-medium tracking-[0.15em] md:tracking-[0.2em] text-gray-500 hover:text-black px-3 py-2"
                (click)="onCloseRequest()"
              >
                CANCELAR
              </button>
              <button
                type="button"
                class="px-4 md:px-6 py-2 md:py-3 bg-black text-white text-xs md:text-sm font-semibold tracking-[0.15em] md:tracking-[0.2em] hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                [disabled]="!canAddToCart()"
                (click)="onAddToCart()"
              >
                AGREGAR AL DROP
              </button>
            </div>
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DropProductDetailModalComponent implements OnChanges {
  @Input({ required: true }) idModelo!: number;
  @Output() closed = new EventEmitter<void>();

  private dropsService = inject(DropsService);
  private dropsStore = inject(DropsStoreService);
  private platformId = inject(PLATFORM_ID);

  // Signals de Estado
  product = signal<ModeloDetalleDrop | null>(null);
  loading = signal<boolean>(true);
  selectedColor = signal<ColorDropDetalle | null>(null);
  selectedSize = signal<TallaDropDetalle | null>(null);
  quantityInput = signal<number>(1);

  // Computed Signals
  availableSizes = computed(() => {
    const tallas = this.selectedColor()?.tallas ?? [];
    return this.sortSizes(tallas);
  });

  primaryImage = computed(() => {
    const color = this.selectedColor();
    const fotoUrl = color?.fotoUrl ?? '';

    if (!fotoUrl.trim()) {
      return '/assets/images/placeholder-product.svg';
    }

    if (/^https?:\/\//i.test(fotoUrl)) {
      return fotoUrl;
    }

    const sanitizedPath = fotoUrl.replace(/^\/+/, '');
    return `/assets/images/${sanitizedPath}`;
  });

  canAddToCart = computed(() => {
    return (
      this.selectedColor() !== null && this.selectedSize() !== null && this.quantityInput() > 0
    );
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idModelo'] && this.idModelo) {
      this.loadProductDetail();
    }
  }

  private loadProductDetail(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.loading.set(true);
    this.dropsService
      .getDetalleModelo(this.idModelo)
      .pipe(take(1))
      .subscribe({
        next: (producto) => {
          this.product.set(producto);
          // Auto-seleccionar primer color si existe
          if (producto.colores && producto.colores.length > 0) {
            this.onSelectColor(producto.colores[0]);
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error cargando detalle del producto:', err);
          this.loading.set(false);
        },
      });
  }

  onSelectColor(color: ColorDropDetalle): void {
    this.selectedColor.set(color);
    this.selectedSize.set(null); // Resetear talla al cambiar color
  }

  onSelectSize(talla: TallaDropDetalle): void {
    this.selectedSize.set(talla);
  }

  onQuantityInput(value: number): void {
    if (value < 1) {
      this.quantityInput.set(1);
    } else {
      this.quantityInput.set(Math.floor(value));
    }
  }

  getColorHex(color: ColorDropDetalle): string {
    return color.codigoHex || '#000000';
  }

  onAddToCart(): void {
    if (!this.canAddToCart()) return;

    const producto = this.product();
    const color = this.selectedColor();
    const talla = this.selectedSize();
    const cantidad = this.quantityInput();

    if (!producto || !color || !talla) return;

    this.dropsStore.addItem({
      idVariante: talla.idVariante,
      idModelo: producto.idModelo,
      nombreModelo: producto.nombreModelo,
      nombreMarca: producto.nombreMarca,
      nombreColor: color.nombreColor,
      nombreTalla: talla.nombreTalla,
      fotoUrl: color.fotoUrl,
      cantidad: cantidad,
    });

    this.onCloseRequest();
  }

  onCloseRequest(): void {
    this.closed.emit();
  }

  private sortSizes(tallas: TallaDropDetalle[]): TallaDropDetalle[] {
    const ordenTallas = ['S', 'M', 'L', 'XL', '36', '38', '40', '42', '44', '46', '48'];

    return [...tallas].sort((a, b) => {
      const indexA = ordenTallas.indexOf(a.nombreTalla);
      const indexB = ordenTallas.indexOf(b.nombreTalla);

      // Si ambos están en la lista definida
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // Si solo A está en la lista, va primero
      if (indexA !== -1) return -1;

      // Si solo B está en la lista, va primero
      if (indexB !== -1) return 1;

      // Si ninguno está, orden alfanumérico natural
      return a.nombreTalla.localeCompare(b.nombreTalla, undefined, { numeric: true });
    });
  }
}
