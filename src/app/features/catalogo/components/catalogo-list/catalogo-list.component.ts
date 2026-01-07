import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CatalogoAdminService } from '../../services/catalogo-admin.service';
import { ProductCardAdminComponent } from '../product-card-admin/product-card-admin.component';
import { NuevoModeloModalComponent } from '../nuevo-modelo-modal/nuevo-modelo-modal.component';
import {
  ModeloDTO,
  OpcionesCatalogoDTO,
  MarcaDTO,
  CategoriaDTO,
  CorteDTO,
} from '../../models/catalogo-admin.models';

@Component({
  selector: 'app-catalogo-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardAdminComponent, NuevoModeloModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-white">
      <!-- Header con Filtros y Buscador -->
      <header class="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 md:px-8 py-4 md:py-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <!-- Filtros (Arriba en mobile, Izquierda en desktop) -->
          <div class="flex flex-wrap items-center gap-3 md:gap-8">
            <!-- Dropdown Categoría -->
            <div class="relative group">
              <button
                class="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wider"
                (click)="toggleDropdown('categoria')"
              >
                {{ selectedCategoria() ? selectedCategoria()!.nombre : 'CATEGORÍA' }}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              @if (showCategoriaDropdown()) {
              <div
                class="absolute top-full left-0 mt-2 w-48 bg-white shadow-xl border border-gray-100 py-2 rounded-sm z-20"
              >
                <button
                  class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                  (click)="selectCategoria(null)"
                >
                  Todas
                </button>
                @for (cat of opciones()?.categorias || []; track cat.id) {
                <button
                  class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                  [class.font-bold]="selectedCategoria()?.id === cat.id"
                  (click)="selectCategoria(cat)"
                >
                  {{ cat.nombre }}
                </button>
                }
              </div>
              }
            </div>

            <!-- Dropdown Marca -->
            <div class="relative group">
              <button
                class="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wider"
                (click)="toggleDropdown('marca')"
              >
                {{ selectedMarca() ? selectedMarca()!.nombre : 'MARCA' }}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              @if (showMarcaDropdown()) {
              <div
                class="absolute top-full left-0 mt-2 w-48 bg-white shadow-xl border border-gray-100 py-2 rounded-sm z-20"
              >
                <button
                  class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                  (click)="selectMarca(null)"
                >
                  Todas
                </button>
                @for (marca of opciones()?.marcas || []; track marca.id) {
                <button
                  class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                  [class.font-bold]="selectedMarca()?.id === marca.id"
                  (click)="selectMarca(marca)"
                >
                  {{ marca.nombre }}
                </button>
                }
              </div>
              }
            </div>

            <!-- Dropdown Corte -->
            <div class="relative group">
              <button
                class="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wider"
                (click)="toggleDropdown('corte')"
              >
                {{ selectedCorte() ? selectedCorte()!.nombre : 'CORTE' }}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              @if (showCorteDropdown()) {
              <div
                class="absolute top-full left-0 mt-2 w-48 bg-white shadow-xl border border-gray-100 py-2 rounded-sm z-20"
              >
                <button
                  class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                  (click)="selectCorte(null)"
                >
                  Todos
                </button>
                @for (corte of opciones()?.cortes || []; track corte.id) {
                <button
                  class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                  [class.font-bold]="selectedCorte()?.id === corte.id"
                  (click)="selectCorte(corte)"
                >
                  {{ corte.nombre }}
                </button>
                }
              </div>
              }
            </div>
          </div>

          <!-- Buscador y Botón (Abajo en mobile, Derecha en desktop) -->
          <div class="flex flex-col md:items-end gap-3 w-full md:w-auto">
            <!-- Buscador -->
            <div
              class="flex items-center gap-2 w-full md:w-80 border-b border-gray-300 focus-within:border-black transition-colors pb-1"
            >
              <svg
                class="w-4 h-4 text-gray-400"
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
                placeholder="BUSCAR MODELO..."
                class="w-full text-xs md:text-sm outline-none placeholder-gray-300 font-medium uppercase bg-transparent"
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
              />
            </div>

            <!-- Botón Nuevo Diseño -->
            <button
              type="button"
              class="w-full md:w-auto px-4 md:px-6 py-2.5 bg-black text-white text-xs font-bold tracking-[0.15em] md:tracking-[0.2em] hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              (click)="onNewModelo()"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                ></path>
              </svg>
              <span class="hidden sm:inline">NUEVO DISEÑO/MODELO</span>
              <span class="sm:hidden">NUEVO</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Grid de Productos -->
      <main class="p-8">
        @if (loading()) {
        <!-- Skeletons mientras cargan los datos -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          @for (i of [1,2,3,4,5,6,7,8,9,10]; track i) {
          <div class="bg-white overflow-hidden animate-pulse">
            <!-- Skeleton imagen -->
            <div class="aspect-[4/5] bg-gray-200"></div>
            <!-- Skeleton info -->
            <div class="p-3 space-y-2">
              <div class="h-2 bg-gray-200 rounded w-1/3"></div>
              <div class="h-4 bg-gray-200 rounded w-2/3"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
              <div class="h-3 bg-gray-200 rounded w-1/4"></div>
              <div class="h-6 bg-gray-200 rounded w-1/3 mt-2"></div>
            </div>
          </div>
          }
        </div>
        } @else if (filteredModelos().length === 0) {
        <div class="flex flex-col items-center justify-center h-64 text-gray-400">
          <svg class="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            ></path>
          </svg>
          <p class="text-sm tracking-wider">NO SE ENCONTRARON MODELOS</p>
          <button
            (click)="clearFilters()"
            class="mt-4 text-xs underline hover:text-black transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
        } @else {
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          @for (modelo of filteredModelos(); track modelo.id) {
          <app-product-card-admin
            [modelo]="modelo"
            (cardClick)="onEditModelo($event)"
            (deleteClick)="onDeleteModelo($event)"
          ></app-product-card-admin>
          }
        </div>
        }
      </main>
    </div>

    <!-- Modal Nuevo Modelo -->
    @if (showNuevoModeloModal() && opciones()) {
    <app-nuevo-modelo-modal
      [opciones]="opciones()!"
      [modeloId]="editingModeloId()"
      (closed)="closeNuevoModeloModal()"
      (modeloCreated)="onModeloCreated()"
      (opcionesUpdated)="onOpcionesUpdated()"
    ></app-nuevo-modelo-modal>
    }
  `,
})
export class CatalogoListComponent implements OnInit {
  private catalogoService = inject(CatalogoAdminService);
  private router = inject(Router);

  // Estado de datos
  modelos = signal<ModeloDTO[]>([]);
  opciones = signal<OpcionesCatalogoDTO | null>(null);
  loading = signal<boolean>(true);

  // Filtros
  searchQuery = signal<string>('');
  selectedCategoria = signal<CategoriaDTO | null>(null);
  selectedMarca = signal<MarcaDTO | null>(null);
  selectedCorte = signal<CorteDTO | null>(null);

  // Dropdowns
  showCategoriaDropdown = signal<boolean>(false);
  showMarcaDropdown = signal<boolean>(false);
  showCorteDropdown = signal<boolean>(false);

  // Modal
  showNuevoModeloModal = signal<boolean>(false);
  editingModeloId = signal<number | null>(null);

  // Computed: Modelos filtrados
  filteredModelos = computed(() => {
    let result = this.modelos();

    // Filtrar por búsqueda de texto
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter((m) => m.nombre.toLowerCase().includes(query));
    }

    // Filtrar por categoría
    const categoria = this.selectedCategoria();
    if (categoria) {
      result = result.filter((m) => m.categoria.id === categoria.id);
    }

    // Filtrar por marca
    const marca = this.selectedMarca();
    if (marca) {
      result = result.filter((m) => m.marca.id === marca.id);
    }

    // Filtrar por corte
    const corte = this.selectedCorte();
    if (corte) {
      result = result.filter((m) => m.corte.id === corte.id);
    }

    return result;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    // Cargar opciones y modelos en paralelo
    this.catalogoService.getOpciones().subscribe({
      next: (data) => this.opciones.set(data),
      error: (err) => console.error('Error cargando opciones:', err),
    });

    this.catalogoService.getModelos().subscribe({
      next: (data) => {
        this.modelos.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando modelos:', err);
        this.loading.set(false);
      },
    });
  }

  toggleDropdown(type: 'categoria' | 'marca' | 'corte') {
    if (type === 'categoria') {
      this.showCategoriaDropdown.update((v) => !v);
      this.showMarcaDropdown.set(false);
      this.showCorteDropdown.set(false);
    } else if (type === 'marca') {
      this.showMarcaDropdown.update((v) => !v);
      this.showCategoriaDropdown.set(false);
      this.showCorteDropdown.set(false);
    } else {
      this.showCorteDropdown.update((v) => !v);
      this.showCategoriaDropdown.set(false);
      this.showMarcaDropdown.set(false);
    }
  }

  selectCategoria(cat: CategoriaDTO | null) {
    this.selectedCategoria.set(cat);
    this.showCategoriaDropdown.set(false);
  }

  selectMarca(marca: MarcaDTO | null) {
    this.selectedMarca.set(marca);
    this.showMarcaDropdown.set(false);
  }

  selectCorte(corte: CorteDTO | null) {
    this.selectedCorte.set(corte);
    this.showCorteDropdown.set(false);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedCategoria.set(null);
    this.selectedMarca.set(null);
    this.selectedCorte.set(null);
  }

  onNewModelo() {
    this.showNuevoModeloModal.set(true);
  }

  closeNuevoModeloModal() {
    this.showNuevoModeloModal.set(false);
    this.editingModeloId.set(null);
  }

  onModeloCreated() {
    this.loadData(); // Recargar listado
  }

  onOpcionesUpdated() {
    // Recargar solo las opciones sin cerrar el modal
    this.catalogoService.getOpciones().subscribe({
      next: (data) => this.opciones.set(data),
      error: (err) => console.error('Error recargando opciones:', err),
    });
  }

  onDeleteModelo(id: number) {
    if (confirm('¿Estás seguro de eliminar este modelo?')) {
      this.catalogoService.deleteModelo(id).subscribe({
        next: () => {
          this.modelos.update((current) => current.filter((m) => m.id !== id));
        },
        error: (err) => {
          console.error('Error deleting modelo', err);
        },
      });
    }
  }

  onEditModelo(id: number) {
    this.editingModeloId.set(id);
    this.showNuevoModeloModal.set(true);
  }
}
