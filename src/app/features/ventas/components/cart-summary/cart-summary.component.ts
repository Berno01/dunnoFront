import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  PLATFORM_ID,
  effect,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { VentasStoreService } from '../../../../core/services/ventas-store.service';
import { VentasService } from '../../../../core/services/ventas.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PaymentSplitModalComponent } from '../payment-split-modal/payment-split-modal.component';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-cart-summary',
  standalone: true,
  imports: [CommonModule, PaymentSplitModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-gray-50">
      <!-- Header (Solo visible en desktop) -->
      <div class="hidden lg:flex px-3 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-white">
        <div class="flex items-center justify-between w-full">
          <h2
            class="text-xs md:text-sm font-bold tracking-[0.15em] md:tracking-[0.2em] text-gray-900"
          >
            RESUMEN ({{ itemCount() }})
          </h2>
          @if (itemCount() > 0) {
          <button
            type="button"
            class="text-[10px] md:text-xs text-gray-400 hover:text-red-600 transition-colors uppercase tracking-wider"
            (click)="onClearCart()"
          >
            Vaciar
          </button>
          }
        </div>
      </div>

      <!-- Cart Items List -->
      <div class="flex-1 overflow-y-auto px-3 md:px-6 py-3 md:py-4">
        @if (itemCount() === 0) {
        <div class="flex flex-col items-center justify-center h-full text-gray-400">
          <svg
            class="w-12 md:w-16 h-12 md:h-16 mb-3 md:mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            ></path>
          </svg>
          <p class="text-xs md:text-sm tracking-wider">Carrito vacío</p>
        </div>
        } @else {
        <div class="space-y-3 md:space-y-4">
          @for (item of cartItems(); track item.idVariante) {
          <div class="flex gap-2 md:gap-3 pb-3 md:pb-4 border-b border-gray-100">
            <img
              [src]="resolveImageUrl(item.fotoUrl)"
              [alt]="item.nombreModelo"
              class="w-14 h-16 md:w-16 md:h-20 object-cover bg-gray-200 flex-shrink-0"
              onerror="this.onerror=null; this.src='/assets/images/placeholder-product.svg'"
            />
            <div class="flex-1 flex flex-col justify-between min-w-0">
              <div class="space-y-0.5 md:space-y-1">
                <h4 class="text-[11px] md:text-xs font-semibold text-gray-900 truncate">
                  {{ item.nombreModelo }}
                </h4>
                <p class="text-[10px] md:text-xs text-gray-500 line-clamp-1">
                  {{ item.nombreMarca }} / {{ item.nombreColor }} / {{ item.nombreTalla }}
                </p>
              </div>
              <div class="flex items-center justify-between gap-2 mt-2">
                <div class="flex items-center gap-1.5 md:gap-2">
                  <button
                    type="button"
                    class="w-7 h-7 md:w-6 md:h-6 flex items-center justify-center border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm"
                    (click)="decrementItem(item.idVariante)"
                  >
                    -
                  </button>
                  <span class="text-xs md:text-sm font-medium w-7 md:w-8 text-center">{{
                    item.cantidad
                  }}</span>
                  <button
                    type="button"
                    class="w-7 h-7 md:w-6 md:h-6 flex items-center justify-center border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm"
                    [disabled]="item.cantidad >= item.stockMaximo"
                    (click)="incrementItem(item.idVariante)"
                  >
                    +
                  </button>
                </div>
                <p class="text-xs md:text-sm font-semibold text-gray-900">
                  Bs. {{ item.subtotal.toFixed(2) }}
                </p>
              </div>
            </div>
          </div>
          }
        </div>
        }
      </div>

      <!-- Payment & Total Section -->
      @if (itemCount() > 0) {
      <div
        class="border-t border-gray-200 bg-white px-3 md:px-6 py-3 md:py-4 space-y-3 md:space-y-4"
      >
        <!-- Subtotal -->
        <div class="flex items-center justify-between text-xs md:text-sm">
          <span class="text-gray-600">Subtotal</span>
          <span class="font-semibold text-gray-900">Bs. {{ total().toFixed(2) }}</span>
        </div>

        <!-- Descuento (siempre 0 por ahora) -->
        <div class="flex items-center justify-between text-xs md:text-sm">
          <span class="text-gray-600">Descuento</span>
          <span class="text-gray-900">- Bs. 0</span>
        </div>

        <!-- Total -->
        <div class="flex items-center justify-between pt-2 border-t border-gray-200">
          <span class="text-xs md:text-sm font-bold tracking-wider text-gray-900">Total</span>
          <span class="text-lg md:text-xl font-bold text-gray-900"
            >Bs. {{ total().toFixed(2) }}</span
          >
        </div>

        <!-- Payment Method Buttons -->
        <div class="pt-3 md:pt-4 space-y-2 md:space-y-3">
          <div class="grid grid-cols-3 gap-1.5 md:gap-2">
            <button
              type="button"
              class="px-2 md:px-3 py-2 md:py-2 border text-[10px] md:text-xs font-semibold tracking-wider transition-colors"
              [class.bg-black]="!splitActive() || paymentAmounts().qr > 0"
              [class.text-white]="!splitActive() || paymentAmounts().qr > 0"
              [class.border-black]="!splitActive() || paymentAmounts().qr > 0"
              [class.bg-white]="splitActive() && paymentAmounts().qr === 0"
              [class.text-gray-600]="splitActive() && paymentAmounts().qr === 0"
              [class.border-gray-300]="splitActive() && paymentAmounts().qr === 0"
              (click)="onSelectPayment('QR')"
            >
              QR
            </button>
            <button
              type="button"
              class="px-1.5 md:px-3 py-2 md:py-2 border text-[10px] md:text-xs font-semibold tracking-wide md:tracking-wider transition-colors"
              [class.bg-black]="!splitActive() && paymentAmounts().efectivo === total()"
              [class.text-white]="!splitActive() && paymentAmounts().efectivo === total()"
              [class.border-black]="!splitActive() && paymentAmounts().efectivo === total()"
              [class.bg-white]="splitActive() || paymentAmounts().efectivo !== total()"
              [class.text-gray-600]="splitActive() || paymentAmounts().efectivo !== total()"
              [class.border-gray-300]="splitActive() || paymentAmounts().efectivo !== total()"
              (click)="onSelectPayment('EFECTIVO')"
            >
              EFECTIVO
            </button>
            <button
              type="button"
              class="px-2 md:px-3 py-2 md:py-2 border text-[10px] md:text-xs font-semibold tracking-wider transition-colors"
              [class.bg-black]="!splitActive() || paymentAmounts().tarjeta > 0"
              [class.text-white]="!splitActive() || paymentAmounts().tarjeta > 0"
              [class.border-black]="!splitActive() || paymentAmounts().tarjeta > 0"
              [class.bg-white]="splitActive() && paymentAmounts().tarjeta === 0"
              [class.text-gray-600]="splitActive() && paymentAmounts().tarjeta === 0"
              [class.border-gray-300]="splitActive() && paymentAmounts().tarjeta === 0"
              (click)="onSelectPayment('TARJETA')"
            >
              TARJETA
            </button>
          </div>

          <!-- Payment Split Info -->
          @if (splitActive()) {
          <div class="text-[10px] md:text-xs text-gray-600 text-center pt-1">
            @if (paymentAmounts().qr > 0) { Cobrando
            <span class="font-semibold">Bs. {{ paymentAmounts().qr.toFixed(2) }}</span> en QR y
            <span class="font-semibold">Bs. {{ paymentAmounts().efectivo.toFixed(2) }}</span> en
            Efectivo } @if (paymentAmounts().tarjeta > 0) { Cobrando
            <span class="font-semibold">Bs. {{ paymentAmounts().tarjeta.toFixed(2) }}</span> en
            TARJETA y
            <span class="font-semibold">Bs. {{ paymentAmounts().efectivo.toFixed(2) }}</span> en
            Efectivo }
          </div>
          }
        </div>

        <!-- Type Buttons (Local / Envío) -->
        <div class="grid grid-cols-2 gap-1.5 md:gap-2 pt-2">
          <button
            type="button"
            class="px-3 md:px-4 py-2.5 md:py-3 text-[10px] md:text-xs font-semibold tracking-[0.15em] md:tracking-[0.2em] flex items-center justify-center gap-1.5 md:gap-2 transition-colors"
            [class.bg-black]="tipoVenta() === 'LOCAL'"
            [class.text-white]="tipoVenta() === 'LOCAL'"
            [class.bg-white]="tipoVenta() !== 'LOCAL'"
            [class.text-gray-600]="tipoVenta() !== 'LOCAL'"
            [class.border]="tipoVenta() !== 'LOCAL'"
            [class.border-gray-300]="tipoVenta() !== 'LOCAL'"
            (click)="onSelectTipoVenta('LOCAL')"
          >
            <svg
              class="w-3.5 h-3.5 md:w-4 md:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              ></path>
            </svg>
            LOCAL
          </button>
          <button
            type="button"
            class="px-3 md:px-4 py-2.5 md:py-3 text-[10px] md:text-xs font-semibold tracking-[0.15em] md:tracking-[0.2em] flex items-center justify-center gap-1.5 md:gap-2 transition-colors"
            [class.bg-black]="tipoVenta() === 'ENVIO'"
            [class.text-white]="tipoVenta() === 'ENVIO'"
            [class.bg-white]="tipoVenta() !== 'ENVIO'"
            [class.text-gray-600]="tipoVenta() !== 'ENVIO'"
            [class.border]="tipoVenta() !== 'ENVIO'"
            [class.border-gray-300]="tipoVenta() !== 'ENVIO'"
            (click)="onSelectTipoVenta('ENVIO')"
          >
            <svg
              class="w-3.5 h-3.5 md:w-4 md:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              ></path>
            </svg>
            ENVÍO
          </button>
        </div>

        <!-- Confirm Sale Button -->
        <button
          type="button"
          class="w-full px-4 md:px-6 py-3 md:py-4 bg-black text-white text-xs md:text-sm font-bold tracking-[0.15em] md:tracking-[0.2em] hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 md:gap-3"
          [disabled]="processing()"
          (click)="onConfirmSale()"
        >
          @if (processing()) {
          <svg
            class="animate-spin h-4 w-4 md:h-5 md:w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          }
          <span class="hidden sm:inline">{{
            processing() ? 'PROCESANDO...' : 'CONFIRMAR VENTA'
          }}</span>
          <span class="sm:hidden">{{ processing() ? 'PROCESANDO...' : 'CONFIRMAR' }}</span>
        </button>
      </div>
      }
    </div>

    @if (showPaymentModal()) {
    <app-payment-split-modal
      [totalAmount]="total()"
      [paymentMethod]="selectedPaymentMethod()"
      (confirmed)="onPaymentConfirmed($event)"
      (cancelled)="onPaymentCancelled()"
    ></app-payment-split-modal>
    }
  `,
})
export class CartSummaryComponent {
  private ventasStore = inject(VentasStoreService);
  private ventasService = inject(VentasService);
  private platformId = inject(PLATFORM_ID);

  cartItems = this.ventasStore.cartItems;
  itemCount = this.ventasStore.cantidadTotalArticulos;
  total = this.ventasStore.totalVenta;
  paymentAmounts = this.ventasStore.paymentAmounts;
  splitActive = this.ventasStore.splitActive;
  selectedPaymentMethod = this.ventasStore.selectedPaymentMethod;
  tipoVenta = this.ventasStore.tipoVenta;
  processing = this.ventasStore.processing; // Usar el signal del store

  showPaymentModal = signal<boolean>(false);

  constructor() {
    effect(() => {
      const total = this.total();
      const isEditing = this.ventasStore.editingSaleId() !== null;

      // Solo resetear pagos si NO estamos en modo edición
      // (en modo edición, los pagos ya vienen cargados de la venta)
      if (total > 0 && !isEditing) {
        this.ventasStore.resetPayments();
      }
    });
  }

  onSelectPayment(method: 'EFECTIVO' | 'QR' | 'TARJETA') {
    if (method === 'EFECTIVO') {
      this.ventasStore.setPayment('EFECTIVO');
      this.selectedPaymentMethod.set('EFECTIVO');
      return;
    }

    this.selectedPaymentMethod.set(method);
    this.showPaymentModal.set(true);
  }

  onPaymentConfirmed(amount: number) {
    const method = this.selectedPaymentMethod() as 'QR' | 'TARJETA';
    this.ventasStore.setPayment(method, amount);
    this.showPaymentModal.set(false);
  }

  onPaymentCancelled() {
    this.showPaymentModal.set(false);
    this.selectedPaymentMethod.set('EFECTIVO');
  }

  incrementItem(idVariante: number) {
    const item = this.cartItems().find((i) => i.idVariante === idVariante);
    if (!item) return;
    this.ventasStore.updateQuantity(idVariante, item.cantidad + 1);
  }

  decrementItem(idVariante: number) {
    const item = this.cartItems().find((i) => i.idVariante === idVariante);
    if (!item) return;
    if (item.cantidad === 1) {
      this.ventasStore.removeItem(idVariante);
    } else {
      this.ventasStore.updateQuantity(idVariante, item.cantidad - 1);
    }
  }

  onClearCart() {
    if (confirm('¿Estás seguro de vaciar el carrito?')) {
      this.ventasStore.clearCart();
    }
  }

  onSelectTipoVenta(tipo: 'LOCAL' | 'ENVIO') {
    this.ventasStore.setTipoVenta(tipo);
  }

  onConfirmSale() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.processing()) return;

    const payload = this.ventasStore.ventaPayload();

    if (payload.detalle_venta.length === 0) {
      inject(ToastService).warning('El carrito está vacío');
      return;
    }

    // El store maneja el estado de processing internamente
    this.ventasStore.confirmSale();
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
