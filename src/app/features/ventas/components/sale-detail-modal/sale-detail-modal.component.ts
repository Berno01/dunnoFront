import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { VentasService } from '../../../../core/services/ventas.service';
import { CatalogService } from '../../services/catalog.service';
import { VentaDTO } from '../../../../core/models/venta.models';
import { DetallePrendaDTO } from '../../../../core/models/catalogo.models';

interface DetalleVentaEnriquecido {
  id_variante: number;
  id_modelo: number;
  cantidad: number;
  precio_unitario: number;
  total: number;
  nombreModelo?: string;
  nombreMarca?: string;
  nombreColor?: string;
  nombreTalla?: string;
  fotoUrl?: string;
}

@Component({
  selector: 'app-sale-detail-modal',
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
            <h2 class="text-xl font-bold text-gray-900">Detalles de Venta</h2>
            @if (venta()) {
            <p class="text-sm text-gray-500 mt-1">
              ID: #{{ venta()!.id_venta }} - {{ formatDateTime(venta()!.fecha_venta) }}
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
          } @else if (venta()) {
          <div class="space-y-6">
            <!-- Información General -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Sucursal</p>
                <p class="text-sm font-semibold text-gray-900">
                  {{ getBranchName(venta()!.id_sucursal) }}
                </p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Tipo de Venta</p>
                <p class="text-sm">
                  <span
                    class="px-2 py-1 text-xs font-medium inline-block rounded"
                    [class.bg-black]="venta()!.tipo_venta === 'LOCAL'"
                    [class.text-white]="venta()!.tipo_venta === 'LOCAL'"
                    [class.bg-gray-200]="venta()!.tipo_venta === 'ENVIO'"
                    [class.text-gray-700]="venta()!.tipo_venta === 'ENVIO'"
                  >
                    {{ venta()!.tipo_venta }}
                  </span>
                </p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Usuario</p>
                <p class="text-sm font-semibold text-gray-900">{{ venta()!.username || 'N/A' }}</p>
              </div>
            </div>

            <!-- Estado -->
            @if (venta()!.estado_venta === false) {
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
                <span class="text-sm font-semibold text-red-800">VENTA ANULADA</span>
              </div>
            </div>
            }

            <!-- Métodos de Pago -->
            <div>
              <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                Métodos de Pago
              </h3>
              <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                @if (venta()!.monto_efectivo > 0) {
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Efectivo</span>
                  <span class="text-sm font-semibold text-gray-900"
                    >Bs. {{ venta()!.monto_efectivo.toFixed(2) }}</span
                  >
                </div>
                } @if (venta()!.monto_qr > 0) {
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">QR</span>
                  <span class="text-sm font-semibold text-gray-900"
                    >Bs. {{ venta()!.monto_qr.toFixed(2) }}</span
                  >
                </div>
                } @if (venta()!.monto_tarjeta > 0) {
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Tarjeta</span>
                  <span class="text-sm font-semibold text-gray-900"
                    >Bs. {{ venta()!.monto_tarjeta.toFixed(2) }}</span
                  >
                </div>
                } @if (venta()!.monto_giftcard > 0) {
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Giftcard</span>
                  <span class="text-sm font-semibold text-gray-900"
                    >Bs. {{ venta()!.monto_giftcard.toFixed(2) }}</span
                  >
                </div>
                } @if (venta()!.descuento > 0) {
                <div class="flex justify-between items-center pt-2 border-t border-gray-200">
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-600">Descuento</span>
                    <span
                      class="px-2 py-0.5 text-xs font-medium rounded"
                      [class.bg-blue-100]="venta()!.tipo_descuento === 'DESCUENTO'"
                      [class.text-blue-700]="venta()!.tipo_descuento === 'DESCUENTO'"
                      [class.bg-purple-100]="venta()!.tipo_descuento === 'PROMOCION'"
                      [class.text-purple-700]="venta()!.tipo_descuento === 'PROMOCION'"
                    >
                      {{ venta()!.tipo_descuento }}
                    </span>
                  </div>
                  <span class="text-sm font-semibold text-red-600"
                    >- Bs. {{ venta()!.descuento.toFixed(2) }}</span
                  >
                </div>
                }
              </div>
            </div>

            <!-- Productos -->
            <div>
              <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                Productos ({{ detallesEnriquecidos().length }})
              </h3>
              <div class="space-y-3">
                @for (detalle of detallesEnriquecidos(); track detalle.id_variante) {
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
                        <span
                          >{{ detalle.cantidad }} x Bs.
                          {{ detalle.precio_unitario.toFixed(2) }}</span
                        >
                      </div>
                      <span class="text-sm font-semibold text-gray-900"
                        >Bs. {{ detalle.total.toFixed(2) }}</span
                      >
                    </div>
                  </div>
                </div>
                }
              </div>
            </div>

            <!-- Total -->
            <div class="border-t-2 border-gray-300 pt-4">
              <div class="flex justify-between items-center">
                <span class="text-lg font-bold text-gray-900">TOTAL</span>
                <span class="text-2xl font-bold text-gray-900"
                  >Bs. {{ venta()!.total.toFixed(2) }}</span
                >
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
export class SaleDetailModalComponent {
  private ventasService = inject(VentasService);
  private catalogService = inject(CatalogService);

  // Input: ID de la venta a mostrar
  saleId = input.required<number>();

  // Output: Evento de cerrar
  closed = output<void>();

  // Signals
  loading = signal<boolean>(true);
  venta = signal<VentaDTO | null>(null);
  detallesEnriquecidos = signal<DetalleVentaEnriquecido[]>([]);

  constructor() {
    effect(
      () => {
        const id = this.saleId();
        if (id) {
          this.loadSaleDetails(id);
        }
      },
      { allowSignalWrites: true }
    );
  }

  private loadSaleDetails(id: number): void {
    this.loading.set(true);
    this.ventasService.getSaleById(id).subscribe({
      next: (venta) => {
        this.venta.set(venta);
        this.enrichDetails(venta);
      },
      error: (err) => {
        console.error('Error cargando detalles de venta:', err);
        this.loading.set(false);
      },
    });
  }

  private enrichDetails(venta: VentaDTO): void {
    const detalles = venta.detalle_venta || [];

    if (detalles.length === 0) {
      this.detallesEnriquecidos.set([]);
      this.loading.set(false);
      return;
    }

    // Obtener IDs de modelo únicos
    const modelosUnicos = new Set<number>();
    detalles.forEach((detalle) => {
      if (detalle.id_modelo) {
        modelosUnicos.add(detalle.id_modelo);
      }
    });

    if (modelosUnicos.size === 0) {
      // Si no hay id_modelo, mostrar sin enriquecer
      const fallback = detalles.map((d) => ({
        ...d,
        id_modelo: d.id_modelo || 0,
        nombreModelo: 'N/A',
        nombreMarca: 'N/A',
        nombreColor: 'N/A',
        nombreTalla: 'N/A',
        fotoUrl: '',
      }));
      this.detallesEnriquecidos.set(fallback);
      this.loading.set(false);
      return;
    }

    // Consultar catálogo para cada modelo único (en paralelo)
    const catalogRequests = Array.from(modelosUnicos).map((idModelo) =>
      this.catalogService.getProductDetail(idModelo, venta.id_sucursal).pipe(
        map((detalle) => ({ idModelo, detalle })),
        catchError((err) => {
          console.error(`Error al cargar modelo ${idModelo}:`, err);
          return of(null);
        })
      )
    );

    forkJoin(catalogRequests).subscribe({
      next: (catalogResults) => {
        // Crear mapa idModelo -> DetallePrendaDTO
        const catalogMap = new Map<number, DetallePrendaDTO>();
        catalogResults.forEach((result) => {
          if (result) {
            catalogMap.set(result.idModelo, result.detalle);
          }
        });

        // Enriquecer detalles con información del catálogo
        const enriquecidos = detalles.map((detalle) => {
          if (!detalle.id_modelo) {
            return {
              ...detalle,
              id_modelo: 0,
              nombreModelo: 'N/A',
              nombreMarca: 'N/A',
              nombreColor: 'N/A',
              nombreTalla: 'N/A',
              fotoUrl: '',
            };
          }

          const productDetail = catalogMap.get(detalle.id_modelo);
          if (!productDetail) {
            return {
              ...detalle,
              id_modelo: detalle.id_modelo,
              nombreModelo: 'Producto',
              nombreMarca: 'N/A',
              nombreColor: 'N/A',
              nombreTalla: 'N/A',
              fotoUrl: '',
            };
          }

          // Buscar la variante en el árbol de colores/tallas
          const varianteData = this.findVarianteInCatalog(productDetail, detalle.id_variante);

          return {
            ...detalle,
            id_modelo: detalle.id_modelo,
            nombreModelo: productDetail.nombreModelo,
            nombreMarca: productDetail.nombreMarca,
            nombreColor: varianteData?.color.nombreColor || 'N/A',
            nombreTalla: varianteData?.talla.nombreTalla || 'N/A',
            fotoUrl: varianteData?.color.fotoUrl || '',
          };
        });

        this.detallesEnriquecidos.set(enriquecidos);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error enriqueciendo detalles:', err);
        // Mostrar detalles sin enriquecer
        const fallback = detalles.map((d) => ({
          ...d,
          id_modelo: d.id_modelo || 0,
          nombreModelo: 'Producto',
          nombreMarca: 'N/A',
          nombreColor: 'N/A',
          nombreTalla: 'N/A',
          fotoUrl: '',
        }));
        this.detallesEnriquecidos.set(fallback);
        this.loading.set(false);
      },
    });
  }

  /**
   * Busca una variante específica en el catálogo del producto
   * Retorna el color y talla correspondientes
   */
  private findVarianteInCatalog(
    productDetail: DetallePrendaDTO,
    idVariante: number
  ): { color: any; talla: any } | null {
    for (const color of productDetail.colores) {
      for (const talla of color.tallas) {
        if (talla.idVariante === idVariante) {
          return { color, talla };
        }
      }
    }
    return null;
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

  formatDateTime(dateStr: string | undefined): string {
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
