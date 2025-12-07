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
  selector: 'app-payment-split-modal',
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
            <h3 class="text-xl font-semibold text-gray-900">
              Monto a cobrar en {{ paymentMethod }}
            </h3>
            <p class="text-sm text-gray-500">Ingrese el monto que se cobrará con este método</p>
          </div>

          <div class="space-y-4">
            <div class="flex items-baseline gap-2">
              <span class="font-serif text-4xl text-gray-900">Bs.</span>
              <input
                #amountInput
                type="number"
                min="0"
                [max]="totalAmount"
                step="0.01"
                class="w-full font-serif text-4xl text-gray-900 outline-none border-b-2 border-gray-200 focus:border-black transition-colors pb-1"
                [ngModel]="inputAmount()"
                (ngModelChange)="onAmountChange($event)"
                placeholder="0"
                autofocus
              />
            </div>

            <div class="text-sm text-gray-600 pt-2">
              Restante en Efectivo: <span class="font-semibold">Bs. {{ remainingAmount() }}</span>
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
              CONFIRMAR
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PaymentSplitModalComponent {
  @Input({ required: true }) totalAmount!: number;
  @Input({ required: true }) paymentMethod!: string;
  @Output() confirmed = new EventEmitter<number>();
  @Output() cancelled = new EventEmitter<void>();

  inputAmount = signal<string>('');

  remainingAmount = computed(() => {
    const amount = parseFloat(this.inputAmount());
    if (isNaN(amount) || amount <= 0) {
      return this.totalAmount;
    }
    return Math.max(0, this.totalAmount - amount);
  });

  isValid = computed(() => {
    const amount = parseFloat(this.inputAmount());
    return !isNaN(amount) && amount > 0 && amount <= this.totalAmount;
  });

  ngOnInit() {
    this.inputAmount.set(this.totalAmount.toString());
  }

  onAmountChange(value: string) {
    this.inputAmount.set(value);
  }

  onConfirm() {
    if (!this.isValid()) return;
    const amount = parseFloat(this.inputAmount());
    this.confirmed.emit(amount);
  }

  onCancel() {
    this.cancelled.emit();
  }
}
