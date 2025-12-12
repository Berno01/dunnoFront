import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../../../core/services/inventario.service';
import { InventarioItem } from '../../../../core/models/inventario.models';
import { InventarioMatrizComponent } from '../inventario-matriz/inventario-matriz.component';
import { take } from 'rxjs/operators';

type CategoriaFiltro = 'Todas' | 'Poleras' | 'Pantalones' | 'Shorts' | 'Hoodies';

@Component({
  selector: 'app-inventario-list',
  standalone: true,
  imports: [CommonModule, FormsModule, InventarioMatrizComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-[calc(100vh-5rem)] flex flex-col bg-gray-50">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <!-- Filtros Principales -->
          <div class="space-y-3">
            <!-- Búsqueda -->
            <div class="relative">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange()"
              />
              @if (searchTerm()) {
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                (click)="clearSearch()"
              >
                ✕
              </button>
              }
            </div>

            <!-- Pills de Categoría -->
            <div class="flex flex-wrap gap-2">
              @for (cat of categorias; track cat) {
              <button
                type="button"
                class="px-4 py-2 text-xs md:text-sm font-semibold tracking-wider transition-all"
                [class.bg-black]="categoriaSeleccionada() === cat"
                [class.text-white]="categoriaSeleccionada() === cat"
                [class.bg-white]="categoriaSeleccionada() !== cat"
                [class.text-gray-700]="categoriaSeleccionada() !== cat"
                [class.border]="categoriaSeleccionada() !== cat"
                [class.border-gray-300]="categoriaSeleccionada() !== cat"
                (click)="selectCategoria(cat)"
              >
                {{ cat }}
              </button>
              }
            </div>

            <!-- Filtros Avanzados -->
            <div class="flex flex-col sm:flex-row gap-3">
              <!-- Marca -->
              <select
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
                [(ngModel)]="marcaSeleccionada"
                (ngModelChange)="onFilterChange()"
              >
                <option value="">Todas las marcas</option>
                @for (marca of marcasDisponibles(); track marca) {
                <option [value]="marca">{{ marca }}</option>
                }
              </select>

              <!-- Corte -->
              <select
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
                [(ngModel)]="corteSeleccionado"
                (ngModelChange)="onFilterChange()"
              >
                <option value="">Todos los cortes</option>
                @for (corte of cortesDisponibles(); track corte) {
                <option [value]="corte">{{ corte }}</option>
                }
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido Principal -->
      <div class="flex-1 overflow-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          @if (loading()) {
          <div class="flex items-center justify-center py-24">
            <div
              class="h-12 w-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"
            ></div>
          </div>
          } @else if (inventarioFiltrado().length === 0) {
          <div class="text-center py-24">
            <div class="text-gray-400 text-6xl mb-4">📦</div>
            <p class="text-gray-500 text-lg">No se encontraron productos</p>
          </div>
          } @else {
          <!-- Tabla Desktop -->
          <div class="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th
                    class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16"
                  >
                    Foto
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Nombre
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Categoría
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Marca
                  </th>
                  <th
                    class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Stock Total
                  </th>
                  <th
                    class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (item of inventarioFiltrado(); track item.id_modelo) {
                <!-- Fila Principal -->
                <tr
                  class="hover:bg-gray-50 cursor-pointer transition-colors"
                  (click)="toggleExpansion(item.id_modelo)"
                >
                  <td class="px-4 py-3">
                    @if (item.foto_portada) {
                    <img
                      [src]="item.foto_portada"
                      [alt]="item.nombre_modelo"
                      class="w-10 h-10 object-cover rounded"
                    />
                    } @else {
                    <div
                      class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs"
                    >
                      Sin foto
                    </div>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <div class="font-semibold text-gray-900 text-sm">{{ item.nombre_modelo }}</div>
                    @if (item.corte) {
                    <div class="text-xs text-gray-500 mt-0.5">{{ item.corte }}</div>
                    }
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-700">
                    {{ item.categoria }}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-700">
                    {{ item.marca }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="text-base font-bold text-gray-900">{{
                      item.total_stock_global
                    }}</span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span
                      class="inline-block px-2 py-0.5 text-xs font-semibold rounded-full"
                      [class.bg-green-100]="item.total_stock_global >= 20"
                      [class.text-green-800]="item.total_stock_global >= 20"
                      [class.bg-red-100]="item.total_stock_global < 10"
                      [class.text-red-800]="item.total_stock_global < 10"
                      [class.bg-orange-100]="
                        item.total_stock_global >= 10 && item.total_stock_global < 20
                      "
                      [class.text-orange-800]="
                        item.total_stock_global >= 10 && item.total_stock_global < 20
                      "
                    >
                      @if (item.total_stock_global >= 20) { Stock Alto } @else if
                      (item.total_stock_global < 10) { Stock Bajo } @else { Stock Medio }
                    </span>
                  </td>
                </tr>
                <!-- Fila Expandida (Matriz) -->
                @if (isExpanded(item.id_modelo)) {
                <tr>
                  <td colspan="6" class="p-0">
                    <app-inventario-matriz [idModelo]="item.id_modelo"></app-inventario-matriz>
                  </td>
                </tr>
                } }
              </tbody>
            </table>
          </div>

          <!-- Cards Mobile -->
          <div class="md:hidden space-y-4">
            @for (item of inventarioFiltrado(); track item.id_modelo) {
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <!-- Card Header (Clickeable) -->
              <div class="p-4" (click)="toggleExpansion(item.id_modelo)">
                <div class="flex gap-4">
                  @if (item.foto_portada) {
                  <img
                    [src]="item.foto_portada"
                    [alt]="item.nombre_modelo"
                    class="w-20 h-20 object-cover rounded flex-shrink-0"
                  />
                  } @else {
                  <div
                    class="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs flex-shrink-0"
                  >
                    Sin foto
                  </div>
                  }
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-gray-900 truncate">{{ item.nombre_modelo }}</h3>
                    <p class="text-xs text-gray-500 mt-1">{{ item.categoria }}</p>
                    <p class="text-xs text-gray-500">{{ item.marca }}</p>
                    @if (item.corte) {
                    <p class="text-xs text-gray-500">{{ item.corte }}</p>
                    }
                  </div>
                </div>
                <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <div class="text-xs text-gray-500 mb-1">Stock Total</div>
                    <div class="text-xl font-bold text-gray-900">{{ item.total_stock_global }}</div>
                  </div>
                  <span
                    class="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                    [class.bg-green-100]="item.total_stock_global >= 20"
                    [class.text-green-800]="item.total_stock_global >= 20"
                    [class.bg-red-100]="item.total_stock_global < 10"
                    [class.text-red-800]="item.total_stock_global < 10"
                    [class.bg-orange-100]="
                      item.total_stock_global >= 10 && item.total_stock_global < 20
                    "
                    [class.text-orange-800]="
                      item.total_stock_global >= 10 && item.total_stock_global < 20
                    "
                  >
                    @if (item.total_stock_global >= 20) { Stock Alto } @else if
                    (item.total_stock_global < 10) { Stock Bajo } @else { Stock Medio }
                  </span>
                </div>
              </div>
              <!-- Card Expandido (Matriz) -->
              @if (isExpanded(item.id_modelo)) {
              <app-inventario-matriz [idModelo]="item.id_modelo"></app-inventario-matriz>
              }
            </div>
            }
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class InventarioListComponent implements OnInit {
  private inventarioService = inject(InventarioService);
  private platformId = inject(PLATFORM_ID);

  // Signals
  inventario = signal<InventarioItem[]>([]);
  loading = signal<boolean>(true);
  searchTerm = signal<string>('');
  categoriaSeleccionada = signal<CategoriaFiltro>('Todas');
  marcaSeleccionada = signal<string>('');
  corteSeleccionado = signal<string>('');
  expandedIds = signal<Set<number>>(new Set());

  // Constantes
  categorias: CategoriaFiltro[] = ['Todas', 'Poleras', 'Pantalones', 'Shorts', 'Hoodies'];

  // Computed
  marcasDisponibles = computed(() => {
    const marcas = this.inventario().map((i) => i.marca);
    return Array.from(new Set(marcas)).sort();
  });

  cortesDisponibles = computed(() => {
    const cortes = this.inventario()
      .map((i) => i.corte)
      .filter((c): c is string => !!c);
    return Array.from(new Set(cortes)).sort();
  });

  inventarioFiltrado = computed(() => {
    let items = this.inventario();

    // Filtro de búsqueda
    const search = this.searchTerm().trim().toLowerCase();
    if (search) {
      items = items.filter((i) => i.nombre_modelo.toLowerCase().includes(search));
    }

    // Filtro de categoría
    const cat = this.categoriaSeleccionada();
    if (cat !== 'Todas') {
      items = items.filter((i) => {
        const itemCat = i.categoria.toLowerCase();
        const filterCat = cat.toLowerCase();

        // Manejo de plurales/singulares
        if (filterCat === 'pantalones') return itemCat.includes('pantal');
        if (filterCat === 'poleras') return itemCat.includes('polera');
        if (filterCat === 'shorts') return itemCat.includes('short');
        if (filterCat === 'hoodies')
          return itemCat.includes('hoodie') || itemCat.includes('hoddie');

        return itemCat === filterCat;
      });
    }

    // Filtro de marca
    const marca = this.marcaSeleccionada();
    if (marca) {
      items = items.filter((i) => i.marca === marca);
    }

    // Filtro de corte
    const corte = this.corteSeleccionado();
    if (corte) {
      items = items.filter((i) => i.corte === corte);
    }

    return items;
  });

  ngOnInit(): void {
    this.loadInventario();
  }

  private loadInventario(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.loading.set(true);
    this.inventarioService
      .getInventario({})
      .pipe(take(1))
      .subscribe({
        next: (items) => {
          this.inventario.set(items);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error cargando inventario:', err);
          this.loading.set(false);
        },
      });
  }

  onSearchChange(): void {
    // Trigger signal update (already handled by [(ngModel)])
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  selectCategoria(cat: CategoriaFiltro): void {
    this.categoriaSeleccionada.set(cat);
  }

  onFilterChange(): void {
    // Trigger computed recalculation (already handled by signal updates)
  }

  toggleExpansion(idModelo: number): void {
    const expanded = new Set(this.expandedIds());
    if (expanded.has(idModelo)) {
      expanded.delete(idModelo);
    } else {
      expanded.add(idModelo);
    }
    this.expandedIds.set(expanded);
  }

  isExpanded(idModelo: number): boolean {
    return this.expandedIds().has(idModelo);
  }
}
