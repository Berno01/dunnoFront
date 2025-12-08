import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  computed,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { InventarioService } from '../../../../core/services/inventario.service';
import {
  InventarioDetalle,
  SucursalInventario,
  getStock,
} from '../../../../core/models/inventario.models';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-inventario-matriz',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-2 md:p-4 bg-gray-50">
      @if (loading()) {
      <div class="flex items-center justify-center py-8">
        <div
          class="h-6 w-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"
        ></div>
      </div>
      } @else if (detalle()) {
      <!-- Tabs de Sucursales -->
      <div class="flex justify-center gap-2 mb-3 overflow-x-auto pb-1">
        @for (sucursal of detalle()?.sucursales ?? []; track sucursal.id_sucursal) {
        <button
          type="button"
          class="px-3 py-1.5 text-xs font-semibold tracking-wider transition-colors whitespace-nowrap rounded-md"
          [class.bg-black]="selectedSucursalId() === sucursal.id_sucursal"
          [class.text-white]="selectedSucursalId() === sucursal.id_sucursal"
          [class.bg-white]="selectedSucursalId() !== sucursal.id_sucursal"
          [class.text-gray-600]="selectedSucursalId() !== sucursal.id_sucursal"
          [class.border]="selectedSucursalId() !== sucursal.id_sucursal"
          [class.border-gray-300]="selectedSucursalId() !== sucursal.id_sucursal"
          (click)="selectSucursal(sucursal.id_sucursal)"
        >
          {{ sucursal.nombre_sucursal }}
        </button>
        }
      </div>

      <!-- Tabla Matriz -->
      @if (sucursalActual()) {
      <div class="flex justify-center">
        <div
          class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden inline-block max-w-full overflow-x-auto"
        >
          <div class="min-w-max">
            <table class="text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10"
                  >
                    Color
                  </th>
                  @for (talla of detalle()?.tallas_disponibles ?? []; track talla) {
                  <th
                    class="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {{ talla }}
                  </th>
                  }
                  <th
                    class="px-3 py-2 text-center text-xs font-semibold text-indigo-700 uppercase tracking-wider bg-indigo-50"
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (color of detalle()?.colores_disponibles ?? []; track color) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <!-- Columna Color -->
                  <td class="px-3 py-2 sticky left-0 bg-white z-10 border-r border-gray-100">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0 shadow-sm"
                        [style.background-color]="getColorHex(color)"
                      ></div>
                      <span class="font-medium text-gray-700 text-xs">{{ color }}</span>
                    </div>
                  </td>
                  <!-- Columnas de Tallas -->
                  @for (talla of detalle()?.tallas_disponibles ?? []; track talla) {
                  <td class="px-3 py-2 text-center border-r border-gray-50 last:border-r-0">
                    @if (getStockValue(color, talla) > 0) {
                    <span
                      class="font-bold text-xs"
                      [class.text-red-500]="getStockValue(color, talla) < 5"
                      [class.text-amber-600]="
                        getStockValue(color, talla) >= 5 && getStockValue(color, talla) < 10
                      "
                      [class.text-gray-900]="getStockValue(color, talla) >= 10"
                    >
                      {{ getStockValue(color, talla) }}
                    </span>
                    } @else {
                    <span class="text-gray-200 text-[10px]">0</span>
                    }
                  </td>
                  }
                  <!-- Total por Color -->
                  <td class="px-3 py-2 text-center bg-indigo-50">
                    <span class="font-bold text-indigo-700 text-xs">{{
                      getTotalPorColor(color)
                    }}</span>
                  </td>
                </tr>
                }
                <!-- Fila de Totales -->
                <tr class="bg-indigo-50 font-semibold border-t border-indigo-100">
                  <td
                    class="px-3 py-2 text-left sticky left-0 bg-indigo-50 z-10 border-r border-indigo-100"
                  >
                    <span class="text-[10px] uppercase tracking-wider text-indigo-700">Total</span>
                  </td>
                  @for (talla of detalle()?.tallas_disponibles ?? []; track talla) {
                  <td class="px-3 py-2 text-center border-r border-indigo-100 last:border-r-0">
                    <span class="font-bold text-indigo-700 text-xs">{{
                      getTotalPorTalla(talla)
                    }}</span>
                  </td>
                  }
                  <td class="px-3 py-2 text-center bg-indigo-100">
                    <span class="font-bold text-indigo-900 text-sm">{{ getTotalGeneral() }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      } }
    </div>
  `,
})
export class InventarioMatrizComponent implements OnChanges {
  @Input({ required: true }) idModelo!: number;

  private inventarioService = inject(InventarioService);
  private platformId = inject(PLATFORM_ID);

  // Signals
  detalle = signal<InventarioDetalle | null>(null);
  loading = signal<boolean>(true);
  selectedSucursalId = signal<number>(0); // 0 = Global por defecto

  // Computed
  sucursalActual = computed(() => {
    const det = this.detalle();
    if (!det) return null;
    return det.sucursales.find((s) => s.id_sucursal === this.selectedSucursalId()) || null;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idModelo'] && this.idModelo) {
      this.loadDetalle();
    }
  }

  private loadDetalle(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.loading.set(true);
    this.inventarioService
      .getInventarioDetalle(this.idModelo)
      .pipe(take(1))
      .subscribe({
        next: (detalle) => {
          this.detalle.set(detalle);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error cargando detalle de inventario:', err);
          this.loading.set(false);
        },
      });
  }

  selectSucursal(idSucursal: number): void {
    this.selectedSucursalId.set(idSucursal);
  }

  getStockValue(color: string, talla: string): number {
    const sucursal = this.sucursalActual();
    if (!sucursal) return 0;
    return getStock(sucursal.matriz_color_talla, color, talla);
  }

  getColorHex(color: string): string {
    const sucursal = this.sucursalActual();
    if (!sucursal) return '#000000';

    const det = this.detalle();
    if (!det) return '#000000';

    // Buscar en cualquier talla para obtener el código hex del color
    for (const talla of det.tallas_disponibles) {
      const variante = sucursal.matriz_color_talla[color]?.[talla];
      if (variante?.codigo_hex_color) {
        return variante.codigo_hex_color;
      }
    }
    return '#000000';
  }

  getTotalPorColor(color: string): number {
    const det = this.detalle();
    if (!det) return 0;

    return det.tallas_disponibles.reduce((sum, talla) => {
      return sum + this.getStockValue(color, talla);
    }, 0);
  }

  getTotalPorTalla(talla: string): number {
    const det = this.detalle();
    if (!det) return 0;

    return det.colores_disponibles.reduce((sum, color) => {
      return sum + this.getStockValue(color, talla);
    }, 0);
  }

  getTotalGeneral(): number {
    const det = this.detalle();
    if (!det) return 0;

    return det.colores_disponibles.reduce((sum, color) => {
      return sum + this.getTotalPorColor(color);
    }, 0);
  }
}
