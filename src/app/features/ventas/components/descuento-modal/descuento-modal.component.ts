import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-descuento-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      (click)="onCancel()"
    >
      <div
        class="relative w-full max-w-md bg-white shadow-2xl p-8"
        (click)="$event.stopPropagation()"
      >
        <button
          type="button"
          class="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl"
          (click)="onCancel()"
        >
          ×
        </button>

        <div class="flex flex-col gap-6">
          <div class="space-y-2">
            <h3 class="text-xl font-semibold text-gray-900">Aplicar Descuento</h3>
            <p class="text-sm text-gray-500">Configure el descuento para esta venta</p>
          </div>

          <div class="space-y-4">
            <!-- Tipo de Descuento -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">Tipo de Descuento</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="px-4 py-2 border text-sm font-semibold tracking-wider transition-colors"
                  [class.bg-black]="tipoDescuento() === 'DESCUENTO'"
                  [class.text-white]="tipoDescuento() === 'DESCUENTO'"
                  [class.border-black]="tipoDescuento() === 'DESCUENTO'"
                  [class.bg-white]="tipoDescuento() !== 'DESCUENTO'"
                  [class.text-gray-600]="tipoDescuento() !== 'DESCUENTO'"
                  [class.border-gray-300]="tipoDescuento() !== 'DESCUENTO'"
                  (click)="tipoDescuento.set('DESCUENTO')"
                >
                  DESCUENTO
                </button>
                <button
                  type="button"
                  class="px-4 py-2 border text-sm font-semibold tracking-wider transition-colors"
                  [class.bg-black]="tipoDescuento() === 'PROMOCION'"
                  [class.text-white]="tipoDescuento() === 'PROMOCION'"
                  [class.border-black]="tipoDescuento() === 'PROMOCION'"
                  [class.bg-white]="tipoDescuento() !== 'PROMOCION'"
                  [class.text-gray-600]="tipoDescuento() !== 'PROMOCION'"
                  [class.border-gray-300]="tipoDescuento() !== 'PROMOCION'"
                  (click)="tipoDescuento.set('PROMOCION')"
                >
                  PROMOCIÓN
                </button>
              </div>
            </div>

            <!-- Monto del Descuento -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">Monto del Descuento</label>
              <div class="flex items-baseline gap-2">
                <span class="font-serif text-4xl text-gray-900">Bs.</span>
                <input
                  #amountInput
                  type="number"
                  min="0"
                  [max]="maxDescuento"
                  step="0.01"
                  class="w-full font-serif text-4xl text-gray-900 outline-none border-b-2 border-gray-200 focus:border-black transition-colors pb-1"
                  [ngModel]="montoDescuento()"
                  (ngModelChange)="onMontoChange($event)"
                  placeholder="0"
                  autofocus
                />
              </div>
              <div class="text-xs text-gray-500">Máximo: Bs. {{ maxDescuento.toFixed(2) }}</div>
            </div>

            <!-- Total Después del Descuento -->
            <div class="pt-2 border-t border-gray-200">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Total después del descuento:</span>
                <span class="font-bold text-lg text-gray-900"
                  >Bs. {{ totalConDescuento().toFixed(2) }}</span
                >
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              class="text-sm font-medium tracking-[0.2em] text-gray-500 hover:text-black"
              (click)="onCancel()"
            >
              CANCELAR
            </button>
            <button
              type="button"
              class="px-8 py-3 bg-black text-white text-sm font-semibold tracking-[0.2em] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              [disabled]="!isValid()"
              (click)="onConfirm()"
            >
              APLICAR
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DescuentoModalComponent {
  @Input({ required: true }) maxDescuento!: number;
  @Input() descuentoInicial: number = 0;
  @Input() tipoInicial: 'DESCUENTO' | 'PROMOCION' = 'DESCUENTO';
  @Output() confirmed = new EventEmitter<{ monto: number; tipo: 'DESCUENTO' | 'PROMOCION' }>();
  @Output() cancelled = new EventEmitter<void>();

  montoDescuento = signal<string>('0');
  tipoDescuento = signal<'DESCUENTO' | 'PROMOCION'>('DESCUENTO');

  totalConDescuento = computed(() => {
    const monto = parseFloat(this.montoDescuento()) || 0;
    return Math.max(0, this.maxDescuento - monto);
  });

  isValid = computed(() => {
    const monto = parseFloat(this.montoDescuento());
    return !isNaN(monto) && monto >= 0 && monto <= this.maxDescuento;
  });

  ngOnInit() {
    this.montoDescuento.set(this.descuentoInicial.toString());
    this.tipoDescuento.set(this.tipoInicial);
  }

  onMontoChange(value: string) {
    this.montoDescuento.set(value);
  }

  onConfirm() {
    if (!this.isValid()) return;
    const monto = parseFloat(this.montoDescuento());
    this.confirmed.emit({
      monto: monto,
      tipo: this.tipoDescuento(),
    });
  }

  onCancel() {
    this.cancelled.emit();
  }
}
