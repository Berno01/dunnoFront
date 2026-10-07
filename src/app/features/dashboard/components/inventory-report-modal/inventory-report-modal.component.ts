import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  InventoryReportFilters,
  InventoryReportOptions,
} from '../../models/dashboard.models';

@Component({
  selector: 'app-inventory-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-report-modal.component.html',
  styles: [
    `
      .report-select {
        display: block;
        width: 100%;
        min-height: 42px;
        border: 1px solid #d1d5db;
        border-radius: 0.625rem;
        background-color: #fff;
        padding: 0.55rem 2.25rem 0.55rem 0.75rem;
        color: #1f2937;
        font-size: 0.875rem;
        line-height: 1.25rem;
        transition: border-color 150ms ease, box-shadow 150ms ease;
      }
      .report-select:hover { border-color: #9ca3af; }
      .report-select:focus {
        outline: none;
        border-color: #111827;
        box-shadow: 0 0 0 3px rgb(17 24 39 / 10%);
      }
      .report-select:disabled { cursor: not-allowed; background-color: #f9fafb; opacity: 0.65; }
    `,
  ],
})
export class InventoryReportModalComponent {
  options = input.required<InventoryReportOptions>();
  optionsLoading = input(false);
  isGenerating = input(false);
  progress = input('');
  dismiss = output<void>();
  exportRequested = output<{ filters: InventoryReportFilters; includePhotos: boolean }>();

  selectedBranch: number | null = null;
  selectedCategory: number | null = null;
  selectedBrand: number | null = null;
  selectedCut: number | null = null;
  selectedColor: number | null = null;
  selectedSize: number | null = null;
  includePhotos = true;

  resetFilters(): void {
    this.selectedBranch = null;
    this.selectedCategory = null;
    this.selectedBrand = null;
    this.selectedCut = null;
    this.selectedColor = null;
    this.selectedSize = null;
    this.includePhotos = true;
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.isGenerating()) this.dismiss.emit();
  }

  onEscape(): void {
    if (!this.isGenerating()) this.dismiss.emit();
  }

  submit(): void {
    if (this.optionsLoading() || this.isGenerating()) return;
    this.exportRequested.emit({
      filters: {
        idSucursal: this.selectedBranch,
        idCategoria: this.selectedCategory,
        idMarca: this.selectedBrand,
        idCorte: this.selectedCut,
        idColor: this.selectedColor,
        idTalla: this.selectedSize,
      },
      includePhotos: this.includePhotos,
    });
  }
}
