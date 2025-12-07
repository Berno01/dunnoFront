import {
  Component,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
  PLATFORM_ID,
  OnInit,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropsService } from '../../../../core/services/drops.service';
import { CatalogoItemDrop } from '../../../../core/models/drops.models';
import { DropProductCardComponent } from '../drop-product-card/drop-product-card.component';
import { DropProductDetailModalComponent } from '../drop-product-detail-modal/drop-product-detail-modal.component';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-drop-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, DropProductCardComponent, DropProductDetailModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full bg-white">
      <!-- Header: Filtros y Buscador -->
      <header class="sticky top-0 z-10 bg-white px-3 md:px-8 py-3 md:py-6 border-b border-gray-100">
        <div class="flex flex-col gap-3">
          <!-- Buscador (Prioridad en mobile) -->
          <div
            class="flex items-center gap-2 w-full border-b border-gray-200 focus-within:border-black transition-colors pb-1"
          >
            <svg
              class="w-4 h-4 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            <input
              type="text"
              placeholder="Buscar modelo..."
              class="w-full text-xs md:text-sm outline-none placeholder-gray-300 font-medium"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
            />
          </div>

          <!-- Filtros -->
          <div class="flex items-center gap-3 md:gap-6">
            <!-- Dropdown Categoría -->
            <div class="relative group">
              <button
                class="flex items-center gap-1 text-[10px] md:text-xs font-bold text-gray-400 hover:text-black uppercase tracking-wider transition-colors"
                (click)="toggleCategoryMenu()"
              >
                <span class="hidden sm:inline">{{ selectedCategory() || 'CATEGORÍA' }}</span>
                <span class="sm:hidden">{{ selectedCategory() || 'CAT.' }}</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              <!-- Dropdown Menu -->
              @if (showCategoryMenu()) {
              <div
                class="absolute top-full left-0 mt-2 w-40 md:w-48 bg-white shadow-xl border border-gray-100 py-2 rounded-sm z-20"
              >
                <button
                  class="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm hover:bg-gray-50"
                  (click)="selectCategory(null)"
                >
                  Todas
                </button>
                @for (cat of uniqueCategories(); track cat) {
                <button
                  class="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm hover:bg-gray-50"
                  [class.font-bold]="selectedCategory() === cat"
                  (click)="selectCategory(cat)"
                >
                  {{ cat }}
                </button>
                }
              </div>
              }
            </div>
          </div>
        </div>
      </header>

      <!-- Grid de Productos -->
      <div class="flex-1 overflow-y-auto p-3 md:p-8">
        @if (loading()) {
        <div class="flex items-center justify-center h-64">
          <span class="text-gray-400 text-xs md:text-sm tracking-wider">CARGANDO...</span>
        </div>
        } @else if (filteredProducts().length === 0) {
        <div class="flex flex-col items-center justify-center h-64 text-gray-400">
          <span class="text-xs md:text-sm tracking-wider">NO HAY PRODUCTOS</span>
          <button (click)="clearFilters()" class="mt-4 text-xs underline hover:text-black">
            Limpiar filtros
          </button>
        </div>
        } @else {
        <div
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-6 md:gap-y-10"
        >
          @for (product of filteredProducts(); track product.idModelo) {
          <app-drop-product-card
            [product]="product"
            (cardClick)="onProductClick($event)"
          ></app-drop-product-card>
          }
        </div>
        }
      </div>
    </div>

    @if (detailModalOpen() && activeProductId() !== null) {
    <app-drop-product-detail-modal
      [idModelo]="activeProductId()!"
      (closed)="closeProductDetail()"
    ></app-drop-product-detail-modal>
    }
  `,
})
export class DropCatalogComponent implements OnInit {
  private dropsService = inject(DropsService);
  private platformId = inject(PLATFORM_ID);

  // Signals de Estado
  products = signal<CatalogoItemDrop[]>([]);
  loading = signal<boolean>(true);
  detailModalOpen = signal<boolean>(false);
  activeProductId = signal<number | null>(null);

  // Signals de Filtros
  searchQuery = signal<string>('');
  selectedCategory = signal<string | null>(null);
  showCategoryMenu = signal<boolean>(false);

  // Computed Signals
  filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();

    return this.products().filter((p) => {
      const matchesSearch =
        !query ||
        p.nombreModelo.toLowerCase().includes(query) ||
        p.nombreMarca.toLowerCase().includes(query);

      const matchesCategory = !category || p.nombreCategoria === category;

      return matchesSearch && matchesCategory;
    });
  });

  uniqueCategories = computed(() => {
    const categories = new Set(this.products().map((p) => p.nombreCategoria));
    return Array.from(categories).sort();
  });

  ngOnInit(): void {
    this.loadCatalog();
  }

  private loadCatalog(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.loading.set(true);
    this.dropsService
      .getCatalogoParaSelector()
      .pipe(take(1))
      .subscribe({
        next: (productos) => {
          this.products.set(productos);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error cargando catálogo:', err);
          this.loading.set(false);
        },
      });
  }

  onProductClick(product: CatalogoItemDrop): void {
    this.activeProductId.set(product.idModelo);
    this.detailModalOpen.set(true);
  }

  closeProductDetail(): void {
    this.detailModalOpen.set(false);
    this.activeProductId.set(null);
  }

  toggleCategoryMenu(): void {
    this.showCategoryMenu.update((val) => !val);
  }

  selectCategory(category: string | null): void {
    this.selectedCategory.set(category);
    this.showCategoryMenu.set(false);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set(null);
  }
}
