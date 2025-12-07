import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
      <div
        class="pointer-events-auto min-w-[320px] max-w-md bg-white rounded-lg shadow-2xl border overflow-hidden animate-slide-in"
        [class.border-green-500]="toast.type === 'success'"
        [class.border-red-500]="toast.type === 'error'"
        [class.border-blue-500]="toast.type === 'info'"
        [class.border-yellow-500]="toast.type === 'warning'"
      >
        <div class="flex items-start gap-3 p-4">
          <!-- Icon -->
          <div class="flex-shrink-0 pt-0.5">
            @if (toast.type === 'success') {
            <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                class="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            } @if (toast.type === 'error') {
            <div class="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                class="w-4 h-4 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </div>
            } @if (toast.type === 'info') {
            <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                class="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            } @if (toast.type === 'warning') {
            <div class="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg
                class="w-4 h-4 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                ></path>
              </svg>
            </div>
            }
          </div>

          <!-- Message -->
          <div class="flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900 leading-relaxed">{{ toast.message }}</p>
          </div>

          <!-- Close Button -->
          <button
            type="button"
            class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            (click)="toastService.remove(toast.id)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <!-- Progress Bar -->
        @if (toast.duration && toast.duration > 2000) {
        <div class="h-1 bg-gray-100">
          <div
            class="h-full transition-all ease-linear"
            [class.bg-green-500]="toast.type === 'success'"
            [class.bg-red-500]="toast.type === 'error'"
            [class.bg-blue-500]="toast.type === 'info'"
            [class.bg-yellow-500]="toast.type === 'warning'"
            [style.animation]="'shrink ' + toast.duration + 'ms linear'"
          ></div>
        </div>
        }
      </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes shrink {
        from {
          width: 100%;
        }
        to {
          width: 0%;
        }
      }

      @keyframes slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .animate-slide-in {
        animation: slide-in 300ms ease-out;
      }
    `,
  ],
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
