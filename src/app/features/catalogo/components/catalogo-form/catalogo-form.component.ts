import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-catalogo-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-white p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-serif mb-8" style="font-family: 'Playfair Display', serif">
          Formulario de Modelo
        </h1>
        <p class="text-gray-500">
          Este componente se implementará en la siguiente fase cuando necesites crear/editar
          modelos.
        </p>
      </div>
    </div>
  `,
})
export class CatalogoFormComponent {}
