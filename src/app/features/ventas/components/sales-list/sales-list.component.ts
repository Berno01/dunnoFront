import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VentasService } from '../../../../core/services/ventas.service';
import { SessionService } from '../../../../core/services/session.service';
import { ToastService } from '../../../../core/services/toast.service';
import { VentaDTO } from '../../../../core/models/venta.models';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-white">
      <!-- Header Filtros -->
      <div class="px-4 md:px-8 py-4 md:py-6 border-b border-gray-100">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <!-- Izquierda: Filtro Sucursal (solo Admin) -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
            @if (isAdmin()) {
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <label
                class="text-xs font-semibold tracking-[0.15em] md:tracking-[0.2em] text-gray-400"
                >SUCURSAL</label
              >
              <select
                class="px-3 md:px-4 py-2 border border-black text-xs md:text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-black w-full sm:w-auto"
                [ngModel]="selectedBranch()"
                (ngModelChange)="onBranchChange($event)"
              >
                <option [value]="null">Todas</option>
                <option [value]="1">Tarija</option>
                <option [value]="2">Cochabamba</option>
                <option [value]="3">Santa Cruz</option>
              </select>
            </div>
            }
          </div>

          <!-- Derecha: Info y Acciones -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-6">
            <span
              class="text-xs tracking-[0.15em] md:tracking-[0.2em] text-gray-400 text-center sm:text-left"
            >
              {{ sales().length }} REGISTROS
            </span>

            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <!-- Date Picker -->
              <div class="flex items-center gap-2">
                @if (!dateRangeMode()) {
                <!-- Single Date Mode -->
                <div class="relative">
                  <input
                    type="date"
                    class="w-full px-3 md:px-4 py-2 border border-gray-300 text-xs md:text-sm outline-none focus:border-black"
                    [ngModel]="selectedDateStart()"
                    (ngModelChange)="onSingleDateChange($event)"
                    title="Fecha"
                  />
                </div>
                } @else {
                <!-- Date Range Mode -->
                <div class="relative">
                  <input
                    type="date"
                    class="w-full px-3 md:px-4 py-2 border border-gray-300 text-xs md:text-sm outline-none focus:border-black"
                    [ngModel]="selectedDateStart()"
                    (ngModelChange)="onDateStartChange($event)"
                    title="Fecha inicio"
                  />
                </div>
                <span class="text-gray-400 text-xs">-</span>
                <div class="relative">
                  <input
                    type="date"
                    class="w-full px-3 md:px-4 py-2 border border-gray-300 text-xs md:text-sm outline-none focus:border-black"
                    [ngModel]="selectedDateEnd()"
                    (ngModelChange)="onDateEndChange($event)"
                    [min]="selectedDateStart()"
                    title="Fecha fin"
                  />
                </div>
                }
                <!-- Toggle Range Mode Button -->
                <button
                  type="button"
                  class="p-2 border border-gray-300 hover:border-black hover:bg-gray-50 transition-colors"
                  (click)="toggleDateRangeMode()"
                  [title]="dateRangeMode() ? 'Cambiar a fecha única' : 'Cambiar a rango de fechas'"
                >
                  <svg
                    class="w-4 h-4"
                    [class.text-black]="dateRangeMode()"
                    [class.text-gray-400]="!dateRangeMode()"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    ></path>
                  </svg>
                </button>
              </div>

              <!-- Botón Nueva Venta -->
              <button
                type="button"
                class="px-4 md:px-6 py-2 bg-black text-white text-xs font-semibold tracking-[0.15em] md:tracking-[0.2em] hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                (click)="onNewSale()"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
                <span class="hidden sm:inline">NUEVA VENTA</span>
                <span class="sm:hidden">NUEVA</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla Desktop / Cards Mobile -->
      <div class="flex-1 overflow-auto">
        @if (loading()) {
        <div class="flex items-center justify-center h-64">
          <div
            class="h-10 w-10 border-4 border-gray-300 border-t-black rounded-full animate-spin"
          ></div>
        </div>
        } @else if (sales().length === 0) {
        <div class="flex flex-col items-center justify-center h-64 text-gray-400">
          <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
          <p class="text-sm tracking-wider">No se encontraron ventas</p>
        </div>
        } @else {

        <!-- Vista Desktop: Tabla -->
        <div class="hidden md:block">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Hora
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Sucursal
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Tipo
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Efectivo
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  QR
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Tarjeta
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Giftcard
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Total
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Descuento
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Usuario
                </th>
                @if (isAdmin()) {
                <th
                  class="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Acciones
                </th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (sale of sales(); track sale.id_venta) {
              <tr
                class="hover:bg-gray-50 transition-colors"
                [class.opacity-50]="sale.estado_venta === false"
              >
                <td class="px-6 py-4 text-sm text-gray-900">{{ formatTime(sale.fecha_venta) }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ getBranchName(sale.id_sucursal) }}
                </td>
                <td class="px-6 py-4 text-sm">
                  <span
                    class="px-2 py-1 text-xs font-medium"
                    [class.bg-black]="sale.tipo_venta === 'LOCAL'"
                    [class.text-white]="sale.tipo_venta === 'LOCAL'"
                    [class.bg-gray-200]="sale.tipo_venta === 'ENVIO'"
                    [class.text-gray-700]="sale.tipo_venta === 'ENVIO'"
                  >
                    {{ sale.tipo_venta }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 text-right">
                  {{ sale.monto_efectivo.toFixed(2) }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 text-right">
                  {{ sale.monto_qr.toFixed(2) }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 text-right">
                  {{ sale.monto_tarjeta.toFixed(2) }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 text-right">
                  {{ (sale.monto_giftcard || 0).toFixed(2) }}
                </td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                  {{ sale.total.toFixed(2) }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 text-right">
                  @if (sale.descuento && sale.descuento > 0) {
                  <div class="flex flex-col items-end gap-0.5">
                    <span class="font-medium">{{ sale.descuento.toFixed(2) }}</span>
                    <span
                      class="text-xs px-1.5 py-0.5 rounded"
                      [class.bg-blue-100]="sale.tipo_descuento === 'DESCUENTO'"
                      [class.text-blue-700]="sale.tipo_descuento === 'DESCUENTO'"
                      [class.bg-purple-100]="sale.tipo_descuento === 'PROMOCION'"
                      [class.text-purple-700]="sale.tipo_descuento === 'PROMOCION'"
                    >
                      {{ sale.tipo_descuento }}
                    </span>
                  </div>
                  } @else {
                  <span class="text-gray-400">-</span>
                  }
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ sale.username || '-' }}
                </td>
                @if (isAdmin()) {
                <td class="px-6 py-4 text-sm text-center">
                  <div class="flex items-center justify-center gap-2">
                    @if (sale.estado_venta !== false) {
                    <!-- Botón Editar (solo ventas activas) -->
                    <button
                      type="button"
                      class="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      (click)="onEditSale(sale)"
                      title="Editar"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        ></path>
                      </svg>
                    </button>
                    <!-- Botón Anular (solo ventas activas) -->
                    <button
                      type="button"
                      class="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      (click)="onDeleteSale(sale)"
                      title="Anular"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path>
                      </svg>
                    </button>
                    } @else {
                    <!-- Botón Reactivar (solo ventas anuladas) -->
                    <button
                      type="button"
                      class="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      (click)="onActivateSale(sale)"
                      title="Reactivar"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                    </button>
                    }
                  </div>
                </td>
                }
              </tr>
              }
            </tbody>
            <!-- Footer: Totales -->
            <tfoot class="bg-gray-100 border-t-2 border-gray-300">
              <tr>
                <td colspan="3" class="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                  TOTALES:
                </td>
                <td class="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                  {{ totals().efectivo.toFixed(2) }}
                </td>
                <td class="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                  {{ totals().qr.toFixed(2) }}
                </td>
                <td class="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                  {{ totals().tarjeta.toFixed(2) }}
                </td>
                <td class="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                  {{ totals().giftcard.toFixed(2) }}
                </td>
                <td class="px-6 py-4 text-sm font-bold text-gray-900 text-right bg-gray-200">
                  {{ totals().total.toFixed(2) }}
                </td>
                <td class="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                  {{ totals().descuento.toFixed(2) }}
                </td>
                <td class="px-6 py-4"></td>
                @if (isAdmin()) {
                <td class="px-6 py-4"></td>
                }
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Vista Mobile: Cards -->
        <div class="md:hidden px-3 py-4 space-y-3">
          @for (sale of sales(); track sale.id_venta) {
          <div
            class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
            [class.opacity-60]="sale.estado_venta === false"
          >
            <!-- Header: Hora + Usuario -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span class="text-sm font-semibold text-gray-900">{{
                  formatTime(sale.fecha_venta)
                }}</span>
              </div>
              <div class="flex items-center gap-1.5 text-xs text-gray-600">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  ></path>
                </svg>
                <span class="font-medium">{{ sale.username || 'N/A' }}</span>
              </div>
            </div>

            <!-- Info Grid -->
            <div class="grid grid-cols-2 gap-3 mb-3 text-xs">
              <div>
                <span class="text-gray-500 uppercase tracking-wide">Sucursal</span>
                <p class="text-gray-900 font-medium mt-0.5">
                  {{ getBranchName(sale.id_sucursal) }}
                </p>
              </div>
              <div>
                <span class="text-gray-500 uppercase tracking-wide">Tipo</span>
                <p class="mt-0.5">
                  <span
                    class="px-2 py-0.5 text-xs font-medium inline-block"
                    [class.bg-black]="sale.tipo_venta === 'LOCAL'"
                    [class.text-white]="sale.tipo_venta === 'LOCAL'"
                    [class.bg-gray-200]="sale.tipo_venta === 'ENVIO'"
                    [class.text-gray-700]="sale.tipo_venta === 'ENVIO'"
                  >
                    {{ sale.tipo_venta }}
                  </span>
                </p>
              </div>
            </div>

            <!-- Pagos -->
            <div class="bg-gray-50 rounded p-3 mb-3 space-y-1.5 text-xs">
              @if (sale.monto_efectivo > 0) {
              <div class="flex justify-between">
                <span class="text-gray-600">Efectivo</span>
                <span class="font-medium text-gray-900"
                  >Bs. {{ sale.monto_efectivo.toFixed(2) }}</span
                >
              </div>
              } @if (sale.monto_qr > 0) {
              <div class="flex justify-between">
                <span class="text-gray-600">QR</span>
                <span class="font-medium text-gray-900">Bs. {{ sale.monto_qr.toFixed(2) }}</span>
              </div>
              } @if (sale.monto_tarjeta > 0) {
              <div class="flex justify-between">
                <span class="text-gray-600">Tarjeta</span>
                <span class="font-medium text-gray-900"
                  >Bs. {{ sale.monto_tarjeta.toFixed(2) }}</span
                >
              </div>
              } @if (sale.monto_giftcard && sale.monto_giftcard > 0) {
              <div class="flex justify-between">
                <span class="text-gray-600">Giftcard</span>
                <span class="font-medium text-gray-900"
                  >Bs. {{ sale.monto_giftcard.toFixed(2) }}</span
                >
              </div>
              }
              <div class="flex justify-between pt-1.5 border-t border-gray-200">
                <span class="font-semibold text-gray-900">TOTAL</span>
                <span class="font-bold text-gray-900">Bs. {{ sale.total.toFixed(2) }}</span>
              </div>
              @if (sale.descuento && sale.descuento > 0) {
              <div class="flex justify-between items-center pt-1.5 border-t border-gray-200">
                <span class="text-gray-600">Descuento</span>
                <div class="flex items-center gap-1.5">
                  <span class="font-medium text-gray-900">Bs. {{ sale.descuento.toFixed(2) }}</span>
                  <span
                    class="px-1.5 py-0.5 text-xs rounded"
                    [class.bg-blue-100]="sale.tipo_descuento === 'DESCUENTO'"
                    [class.text-blue-700]="sale.tipo_descuento === 'DESCUENTO'"
                    [class.bg-purple-100]="sale.tipo_descuento === 'PROMOCION'"
                    [class.text-purple-700]="sale.tipo_descuento === 'PROMOCION'"
                  >
                    {{ sale.tipo_descuento }}
                  </span>
                </div>
              </div>
              }
            </div>

            <!-- Acciones -->
            @if (isAdmin()) {
            <div class="flex gap-2">
              @if (sale.estado_venta !== false) {
              <button
                type="button"
                class="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
                (click)="onEditSale(sale)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  ></path>
                </svg>
                EDITAR
              </button>
              <button
                type="button"
                class="flex-1 px-3 py-2 border-2 border-red-600 text-red-600 text-xs font-semibold rounded hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
                (click)="onDeleteSale(sale)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  ></path>
                </svg>
                ANULAR
              </button>
              } @else {
              <button
                type="button"
                class="w-full px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
                (click)="onActivateSale(sale)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                REACTIVAR
              </button>
              }
            </div>
            }
          </div>
          }

          <!-- Totales Mobile -->
          @if (sales().length > 0) {
          <div class="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 mt-4">
            <h3 class="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Totales</h3>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-gray-600">Efectivo:</span>
                <span class="font-bold text-gray-900">Bs. {{ totals().efectivo.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">QR:</span>
                <span class="font-bold text-gray-900">Bs. {{ totals().qr.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Tarjeta:</span>
                <span class="font-bold text-gray-900">Bs. {{ totals().tarjeta.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Giftcard:</span>
                <span class="font-bold text-gray-900">Bs. {{ totals().giftcard.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between pt-2 border-t-2 border-gray-300">
                <span class="font-bold text-gray-900">TOTAL:</span>
                <span class="font-bold text-gray-900 text-base"
                  >Bs. {{ totals().total.toFixed(2) }}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Descuento:</span>
                <span class="font-bold text-gray-900">Bs. {{ totals().descuento.toFixed(2) }}</span>
              </div>
            </div>
          </div>
          }
        </div>
        }
      </div>
    </div>
  `,
})
export class SalesListComponent {
  private ventasService = inject(VentasService);
  private sessionService = inject(SessionService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  sales = signal<VentaDTO[]>([]);
  loading = signal<boolean>(false);
  selectedBranch = signal<number | null>(null);
  selectedDateStart = signal<string>(this.getTodayString());
  selectedDateEnd = signal<string>(this.getTodayString());
  dateRangeMode = signal<boolean>(false);

  isAdmin = computed(() => this.sessionService.rol() === 'ADMIN');

  totals = computed(() => {
    const salesList = this.sales();
    return {
      efectivo: salesList.reduce((sum, sale) => sum + (sale.monto_efectivo || 0), 0),
      qr: salesList.reduce((sum, sale) => sum + (sale.monto_qr || 0), 0),
      tarjeta: salesList.reduce((sum, sale) => sum + (sale.monto_tarjeta || 0), 0),
      giftcard: salesList.reduce((sum, sale) => sum + (sale.monto_giftcard || 0), 0),
      total: salesList.reduce((sum, sale) => sum + (sale.total || 0), 0),
      descuento: salesList.reduce((sum, sale) => sum + (sale.descuento || 0), 0),
    };
  });

  constructor() {
    // Inicializar sucursal según el rol
    if (!this.isAdmin()) {
      this.selectedBranch.set(this.sessionService.sucursalId());
    }

    // Auto-cargar cuando cambien los filtros
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const branch = this.selectedBranch();
        const dateStart = this.selectedDateStart();
        const dateEnd = this.selectedDateEnd();
        this.loadSales(branch, dateStart, dateEnd);
      }
    });
  }

  onBranchChange(value: string | null) {
    const branchId = value === 'null' || value === null ? null : parseInt(value, 10);
    this.selectedBranch.set(branchId);

    if (branchId !== null) {
      // Cambiar a una sucursal específica
      const branchName = this.getBranchName(branchId);
      this.sessionService.setSucursal(branchId, branchName);
    } else {
      // Si es "Todas", restaurar la sucursal original del usuario
      this.sessionService.restoreOriginalSucursal();
    }
  }

  onSingleDateChange(value: string) {
    this.selectedDateStart.set(value);
    this.selectedDateEnd.set(value); // Mantener ambas fechas iguales en modo single
  }

  onDateStartChange(value: string) {
    this.selectedDateStart.set(value);
  }

  onDateEndChange(value: string) {
    this.selectedDateEnd.set(value);
  }

  toggleDateRangeMode() {
    this.dateRangeMode.set(!this.dateRangeMode());
    // Si cambiamos a modo single, sincronizar la fecha fin con la fecha inicio
    if (!this.dateRangeMode()) {
      this.selectedDateEnd.set(this.selectedDateStart());
    }
  }

  onNewSale() {
    this.router.navigate(['/ventas/nueva']);
  }

  onEditSale(sale: VentaDTO) {
    if (!sale.id_venta) return;
    this.router.navigate(['/ventas/editar', sale.id_venta]);
  }

  onDeleteSale(sale: VentaDTO) {
    if (!sale.id_venta) return;

    if (
      confirm(
        `¿Está seguro de ANULAR la venta #${sale.id_venta}?\nEsta acción marcará la venta como anulada.`
      )
    ) {
      this.ventasService.deleteSale(sale.id_venta).subscribe({
        next: () => {
          this.toastService.success(`Venta #${sale.id_venta} anulada correctamente`, 4000);
          this.reloadSales();
        },
        error: (err) => {
          console.error('Error al anular la venta:', err);
          this.toastService.error('Error al anular la venta. Intente nuevamente.', 4000);
        },
      });
    }
  }

  onActivateSale(sale: VentaDTO) {
    if (!sale.id_venta) return;

    if (confirm(`¿Desea REACTIVAR la venta #${sale.id_venta}?`)) {
      this.ventasService.activateSale(sale.id_venta).subscribe({
        next: () => {
          this.toastService.success(`Venta #${sale.id_venta} reactivada correctamente`, 4000);
          this.reloadSales();
        },
        error: (err) => {
          console.error('Error al reactivar la venta:', err);
          this.toastService.error('Error al reactivar la venta. Intente nuevamente.', 4000);
        },
      });
    }
  }

  private reloadSales() {
    const branch = this.selectedBranch();
    const dateStart = this.selectedDateStart();
    const dateEnd = this.selectedDateEnd();
    this.loadSales(branch, dateStart, dateEnd);
  }

  getBranchName(id: number): string {
    const branches: Record<number, string> = {
      1: 'Tarija',
      2: 'Cochabamba',
      3: 'Santa Cruz',
    };
    return branches[id] || `Sucursal ${id}`;
  }

  formatTime(fecha?: string): string {
    if (!fecha) return '--:--';
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  }

  private loadSales(idSucursal: number | null, fecha: string, fecha_fin: string) {
    this.loading.set(true);

    this.ventasService.getSales(idSucursal ?? undefined, fecha, fecha_fin).subscribe({
      next: (data) => {
        this.sales.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando ventas:', err);
        this.sales.set([]);
        this.loading.set(false);
      },
    });
  }

  private getTodayString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
