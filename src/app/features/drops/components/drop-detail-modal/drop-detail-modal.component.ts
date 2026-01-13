import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DropsService } from '../../../../core/services/drops.service';
import { Drop, DetalleDrop } from '../../../../core/models/drops.models';

interface DetalleDropEnriquecido {
  idVariante: number;
  idModelo?: number;
  cantidad: number;
  nombreModelo?: string;
  nombreMarca?: string;
  nombreColor?: string;
  nombreTalla?: string;
  fotoUrl?: string;
}

@Component({
  selector: 'app-drop-detail-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      (click)="onClose()"
    >
      <div
        class="relative w-full max-w-3xl bg-white shadow-2xl rounded-lg max-h-[90vh] flex flex-col"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200"
        >
          <div>
            <h2 class="text-xl font-bold text-gray-900">Detalles de Recepción</h2>
            @if (drop()) {
            <p class="text-sm text-gray-500 mt-1">
              ID: #{{ drop()!.idRecepcion }} - {{ formatDateTime(drop()!.fecha) }}
            </p>
            }
          </div>
          <button
            type="button"
            class="p-2 text-gray-400 hover:text-gray-900 transition-colors"
            (click)="onClose()"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto min-h-0 px-6 py-4">
          @if (loading()) {
          <div class="flex items-center justify-center py-12">
            <div
              class="h-10 w-10 border-4 border-gray-300 border-t-black rounded-full animate-spin"
            ></div>
          </div>
          } @else if (drop()) {
          <div class="space-y-6">
            <!-- Información General -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Sucursal</p>
                <p class="text-sm font-semibold text-gray-900">
                  {{ getBranchName(drop()!.idSucursal) }}
                </p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Items</p>
                <p class="text-sm font-semibold text-gray-900">{{ getTotalItems() }}</p>
              </div>
            </div>

            <!-- Estado -->
            @if (drop()!.estado === false) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex items-center gap-2">
                <svg
                  class="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  ></path>
                </svg>
                <span class="text-sm font-semibold text-red-800">RECEPCIÓN ANULADA</span>
              </div>
            </div>
            }

            <!-- Productos -->
            <div>
              <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                Productos Recibidos ({{ detallesEnriquecidos().length }})
              </h3>
              <div class="space-y-3">
                @for (detalle of detallesEnriquecidos(); track detalle.idVariante) {
                <div
                  class="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img
                    [src]="resolveImageUrl(detalle.fotoUrl)"
                    [alt]="detalle.nombreModelo"
                    class="w-16 h-20 object-cover bg-gray-200 rounded flex-shrink-0"
                    onerror="this.onerror=null; this.src='/assets/images/placeholder-product.svg'"
                  />
                  <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-semibold text-gray-900 truncate">
                      {{ detalle.nombreModelo || 'Producto' }}
                    </h4>
                    <p class="text-xs text-gray-500 mt-0.5">
                      {{ detalle.nombreMarca || '-' }} / {{ detalle.nombreColor || '-' }} /
                      {{ detalle.nombreTalla || '-' }}
                    </p>
                    <div class="flex items-center justify-between mt-2">
                      <div class="text-xs text-gray-600">
                        <span>Cantidad recibida</span>
                      </div>
                      <span class="text-sm font-semibold text-gray-900"
                        >{{ detalle.cantidad }} unidades</span
                      >
                    </div>
                  </div>
                </div>
                }
              </div>
            </div>

            <!-- Resumen -->
            <div class="border-t-2 border-gray-300 pt-4">
              <div class="flex justify-between items-center">
                <span class="text-lg font-bold text-gray-900">TOTAL ITEMS RECIBIDOS</span>
                <span class="text-2xl font-bold text-gray-900">{{ getTotalItems() }}</span>
              </div>
            </div>
          </div>
          }
        </div>

        <!-- Footer -->
        <div
          class="flex-shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50"
        >
          <button
            type="button"
            class="px-6 py-2 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors rounded"
            (click)="onClose()"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
})
export class DropDetailModalComponent {
  private dropsService = inject(DropsService);

  // Input: ID de la recepción a mostrar
  dropId = input.required<number>();

  // Output: Evento de cerrar
  closed = output<void>();

  // Signals
  loading = signal<boolean>(true);
  drop = signal<Drop | null>(null);
  detallesEnriquecidos = signal<DetalleDropEnriquecido[]>([]);

  constructor() {
    effect(
      () => {
        const id = this.dropId();
        if (id) {
          this.loadDropDetails(id);
        }
      },
      { allowSignalWrites: true }
    );
  }

  private loadDropDetails(id: number): void {
    this.loading.set(true);
    this.dropsService.getDropById(id).subscribe({
      next: (drop) => {
        this.drop.set(drop);
        this.enrichDetails(drop);
      },
      error: (err) => {
        console.error('Error cargando detalles de recepción:', err);
        this.loading.set(false);
      },
    });
  }

  private enrichDetails(drop: Drop): void {
    const detalles = drop.detalles || [];

    if (detalles.length === 0) {
      this.detallesEnriquecidos.set([]);
      this.loading.set(false);
      return;
    }

    // Mostrar datos básicos inmediatamente (sin esperar al catálogo)
    const detallesBasicos = detalles.map((d) => ({
      idVariante: d.idVariante,
      idModelo: d.idModelo || 0,
      cantidad: d.cantidad,
      nombreModelo: 'Cargando...',
      nombreMarca: '-',
      nombreColor: '-',
      nombreTalla: '-',
      fotoUrl: '',
    }));
    this.detallesEnriquecidos.set(detallesBasicos);
    this.loading.set(false); // Ocultar spinner principal

    // Obtener IDs de modelo únicos
    const modelosUnicos = new Set<number>();
    detalles.forEach((detalle) => {
      if (detalle.idModelo) {
        modelosUnicos.add(detalle.idModelo);
      }
    });

    if (modelosUnicos.size === 0) {
      // Si no hay idModelo, actualizar a "N/A"
      const fallback = detalles.map((d) => ({
        idVariante: d.idVariante,
        idModelo: d.idModelo || 0,
        cantidad: d.cantidad,
        nombreModelo: 'N/A',
        nombreMarca: 'N/A',
        nombreColor: 'N/A',
        nombreTalla: 'N/A',
        fotoUrl: '',
      }));
      this.detallesEnriquecidos.set(fallback);
      return;
    }

    // Crear mapa para ir acumulando resultados
    const catalogMap = new Map<number, any>();

    // Lanzar todas las peticiones en paralelo pero procesar cada una conforme llega
    Array.from(modelosUnicos).forEach((idModelo) => {
      this.dropsService.getDetalleModelo(idModelo).pipe(
        catchError((err) => {
          console.error(`Error al cargar modelo ${idModelo}:`, err);
          return of(null);
        })
      ).subscribe({
        next: (detalle) => {
          if (detalle) {
            catalogMap.set(idModelo, detalle);
            
            // Actualizar inmediatamente los items que corresponden a este modelo
            const enriquecidos = detalles.map((detalleDrop) => {
              if (!detalleDrop.idModelo) {
                return {
                  idVariante: detalleDrop.idVariante,
                  idModelo: 0,
                  cantidad: detalleDrop.cantidad,
                  nombreModelo: 'N/A',
                  nombreMarca: 'N/A',
                  nombreColor: 'N/A',
                  nombreTalla: 'N/A',
                  fotoUrl: '',
                };
              }

              const productDetail = catalogMap.get(detalleDrop.idModelo);
              if (!productDetail) {
                // Aún no ha llegado el catálogo de este modelo
                return {
                  idVariante: detalleDrop.idVariante,
                  idModelo: detalleDrop.idModelo,
                  cantidad: detalleDrop.cantidad,
                  nombreModelo: 'Cargando...',
                  nombreMarca: '-',
                  nombreColor: '-',
                  nombreTalla: '-',
                  fotoUrl: '',
                };
              }

              // Buscar la variante en el árbol de colores/tallas
              const varianteData = this.findVarianteInCatalog(productDetail, detalleDrop.idVariante);

              return {
                idVariante: detalleDrop.idVariante,
                idModelo: detalleDrop.idModelo,
                cantidad: detalleDrop.cantidad,
                nombreModelo: productDetail.nombreModelo,
                nombreMarca: productDetail.nombreMarca,
                nombreColor: varianteData?.color.nombreColor || 'N/A',
                nombreTalla: varianteData?.talla.nombreTalla || 'N/A',
                fotoUrl: varianteData?.color.fotoUrl || '',
              };
            });

            this.detallesEnriquecidos.set(enriquecidos);
          }
        }
      });
    });
  }

  /**
   * Busca una variante específica en el catálogo del producto
   * Retorna el color y talla correspondientes
   */
  private findVarianteInCatalog(
    productDetail: any,
    idVariante: number
  ): { color: any; talla: any } | null {
    for (const color of productDetail.colores || []) {
      for (const talla of color.tallas || []) {
        if (talla.idVariante === idVariante) {
          return { color, talla };
        }
      }
    }
    return null;
  }

  getTotalItems(): number {
    return this.detallesEnriquecidos().reduce((sum, d) => sum + d.cantidad, 0);
  }

  onClose(): void {
    this.closed.emit();
  }

  getBranchName(id: number): string {
    const branches: { [key: number]: string } = {
      1: 'Tarija',
      2: 'Cochabamba',
      3: 'Santa Cruz',
    };
    return branches[id] || 'N/A';
  }

  formatDateTime(dateStr: string | Date | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  resolveImageUrl(path: string | undefined | null): string {
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
