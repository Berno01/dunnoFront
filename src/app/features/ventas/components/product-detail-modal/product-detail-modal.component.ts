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
import { ColorDTO, DetallePrendaDTO, TallaDTO } from '../../../../core/models/catalogo.models';
import { CatalogService } from '../../services/catalog.service';
import { VentasStoreService } from '../../../../core/services/ventas-store.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-product-detail-modal',
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
              @if (selectedSize()) {
              <div
                class="flex items-center gap-2 text-[10px] md:text-xs"
                [class.text-emerald-600]="currentStock() > 0"
                [class.text-red-500]="currentStock() === 0"
              >
                <span
                  class="h-2 w-2 rounded-full"
                  [class.bg-emerald-500]="currentStock() > 0"
                  [class.bg-red-500]="currentStock() === 0"
                ></span>
                <span> Stock disponible: {{ currentStock() }} unidades </span>
              </div>
              }
            </div>

            <!-- Input de Precio -->
            <div class="space-y-2 md:space-y-3">
              <label
                class="text-[10px] md:text-xs font-semibold tracking-[0.15em] md:tracking-[0.2em] text-gray-500"
                >PRECIO</label
              >
              <div class="flex items-center gap-2 border-b border-gray-300 pb-2">
                <span class="text-base md:text-lg font-semibold text-gray-500">Bs.</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full text-xl md:text-3xl font-semibold text-gray-900 outline-none bg-gray-50 cursor-not-allowed"
                  [ngModel]="priceInput()"
                  (ngModelChange)="onPriceInput($event)"
                  placeholder="0"
                  readonly
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
                class="px-4 md:px-8 py-2.5 md:py-3 bg-black text-white text-xs md:text-sm font-semibold tracking-[0.15em] md:tracking-[0.2em] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                [disabled]="!canAddToCart()"
                (click)="onAddToCart()"
              >
                <span class="hidden sm:inline">AGREGAR AL CARRITO</span>
                <span class="sm:hidden">AGREGAR</span>
              </button>
            </div>
          </div>
          } @else {
          <div
            class="flex flex-col items-center justify-center h-full text-xs md:text-sm text-gray-500"
          >
            Error al cargar el producto.
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ProductDetailModalComponent implements OnChanges {
  @Input({ required: true }) idModelo!: number;
  @Input({ required: true }) sucursalId!: number;
  @Output() closed = new EventEmitter<void>();

  private catalogService = inject(CatalogService);
  private ventasStore = inject(VentasStoreService);
  private platformId = inject(PLATFORM_ID);

  product = signal<DetallePrendaDTO | null>(null);
  loading = signal<boolean>(true);
  selectedColor = signal<ColorDTO | null>(null);
  selectedSize = signal<TallaDTO | null>(null);
  customPrice = signal<number>(0);
  priceInput = signal<string>('');

  currentStock = computed(() => this.selectedSize()?.stock ?? 0);

  availableSizes = computed(() => this.selectedColor()?.tallas ?? []);

  priceDisplay = computed(() => {
    const value = this.priceInput();
    return value && !isNaN(Number(value)) ? value : '0';
  });

  primaryImage = computed(() => {
    const color = this.selectedColor();
    const fallback = this.product()?.colores?.[0]?.fotoUrl ?? '';
    return this.resolveImageUrl(color?.fotoUrl || fallback);
  });

  canAddToCart = computed(() => {
    return (
      !!this.selectedColor() &&
      !!this.selectedSize() &&
      this.customPrice() > 0 &&
      this.currentStock() > 0
    );
  });

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['idModelo'] && this.idModelo) || (changes['sucursalId'] && this.sucursalId)) {
      this.fetchProductDetail();
    }
  }

  onCloseRequest() {
    this.closed.emit();
  }

  onSelectColor(color: ColorDTO) {
    this.selectedColor.set(color);
    this.selectedSize.set(null);
  }

  onSelectSize(talla: TallaDTO) {
    this.selectedSize.set(talla);
  }

  onPriceInput(value: string) {
    this.priceInput.set(value);
    const parsed = parseFloat(value);
    this.customPrice.set(isNaN(parsed) ? 0 : parsed);
  }

  onAddToCart() {
    if (!this.canAddToCart()) {
      return;
    }

    const product = this.product();
    const color = this.selectedColor();
    const size = this.selectedSize();
    const price = this.customPrice();

    if (!product || !color || !size || price <= 0) {
      return;
    }

    this.ventasStore.addItem(product, color, size, price);
    this.onCloseRequest();
  }

  getColorHex(color: ColorDTO): string {
    const base = color.codigoHex ?? '';
    if (!base) {
      return '#000000';
    }

    return base.startsWith('#') ? base : `#${base}`;
  }

  private fetchProductDetail() {
    if (!this.idModelo || !this.sucursalId) {
      return;
    }

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loading.set(true);
    this.product.set(null);
    this.selectedColor.set(null);
    this.selectedSize.set(null);
    this.customPrice.set(0);
    this.priceInput.set('');

    this.catalogService
      .getProductDetail(this.idModelo, this.sucursalId)
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          this.product.set(data);
          const initialColor = data.colores?.[0] ?? null;
          this.selectedColor.set(initialColor);
          // Setear el precio automáticamente desde el backend
          this.customPrice.set(data.precio || 0);
          this.priceInput.set((data.precio || 0).toFixed(2));
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error cargando el detalle del producto', err);
          this.loading.set(false);
        },
      });
  }

  private resolveImageUrl(path: string | undefined | null): string {
    if (!path) {
      return '/assets/images/placeholder-product.svg';
    }

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const sanitizedPath = path.replace(/^\/+/, '');
    return `/assets/images/${sanitizedPath}`;
  }
}
