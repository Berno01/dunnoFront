import {
  Component,
  signal,
  computed,
  inject,
  output,
  input,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoAdminService } from '../../services/catalogo-admin.service';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { ToastService } from '../../../../core/services/toast.service';
import { forkJoin } from 'rxjs';
import {
  OpcionesCatalogoDTO,
  MarcaDTO,
  CategoriaDTO,
  CorteDTO,
  TallaDTO,
  ColorDTO,
} from '../../models/catalogo-admin.models';
import { ColorDraftDTO, FormDraftState } from '../../models/create-modelo.models';

@Component({
  selector: 'app-nuevo-modelo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop con blur -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 md:p-0"
      (click)="onBackdropClick($event)"
    >
      <!-- Modal Container -->
      <div
        class="relative bg-white w-full h-full md:w-[90vw] md:h-[90vh] shadow-2xl flex flex-col md:flex-row overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <!-- Botón Cerrar (X) -->
        <button
          class="absolute top-3 right-3 md:top-6 md:right-6 text-gray-400 hover:text-black transition-colors z-10 bg-white rounded-full p-1 md:p-0"
          (click)="onClose()"
        >
          <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>

        <!-- Columna Izquierda: Uploader de Foto -->
        <div class="w-full md:w-1/2 bg-gray-50 p-6 md:p-12 flex flex-col order-1 md:order-1">
          <div class="flex-1 flex flex-col justify-center items-center">
            <!-- Área de Preview Grande -->
            @if (activeColorPreview()) {
            <div class="w-48 md:w-64 aspect-[3/4] bg-white border-2 border-gray-200 mb-4 md:mb-6 overflow-hidden relative group">
              <img [src]="activeColorPreview()!" alt="Preview" class="w-full h-full object-cover" />
              
              <!-- Botón eliminar foto (aparece al hover) -->
              <button
                type="button"
                class="absolute top-4 right-4 bg-red-500 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 hover:scale-110 shadow-lg"
                (click)="removeActivePhoto()"
                title="Eliminar foto"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  ></path>
                </svg>
              </button>
            </div>
            } @else {
            <!-- Drag & Drop Area -->
            <div
              class="w-48 md:w-64 aspect-[3/4] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mb-4 md:mb-6 cursor-pointer hover:border-black transition-colors relative"
              [class.border-black]="isDragging()"
              (click)="fileInput.click()"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)"
            >
              <svg
                class="w-12 h-12 md:w-16 md:h-16 text-gray-300 mb-3 md:mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
              <p class="text-xs md:text-sm font-bold text-gray-400 mb-2 tracking-wider text-center px-2">
                ARRASTRA PARA GUARDAR TU FOTO
              </p>
              <p class="text-xs text-gray-300">JPG, PNG, WEBP (MAX 10MB)</p>

              @if (activeColorName()) {
              <div class="absolute bottom-4 left-0 right-0 text-center">
                <p class="text-xs text-gray-500">
                  Subiendo foto para:
                  <span class="font-bold text-black">{{ activeColorName() }}</span>
                </p>
              </div>
              }
            </div>
            }

            <!-- Input oculto para seleccionar archivo -->
            <input
              #fileInput
              type="file"
              class="hidden"
              accept="image/jpeg,image/png,image/webp"
              (change)="onFileSelected($event)"
            />

            <!-- Miniaturas de Colores (Navegación entre fotos) -->
            <div class="flex gap-2 md:gap-3 flex-wrap justify-center">
              @for (colorDraft of formDraft().coloresDraft; track colorDraft.idColor) {
              <button
                class="relative w-12 h-12 md:w-16 md:h-16 rounded border-2 transition-all duration-300 ease-out"
                [class.border-black]="formDraft().activeColorIdForUpload === colorDraft.idColor"
                [class.border-gray-200]="formDraft().activeColorIdForUpload !== colorDraft.idColor"
                [class.scale-125]="formDraft().activeColorIdForUpload === colorDraft.idColor"
                [class.shadow-xl]="formDraft().activeColorIdForUpload === colorDraft.idColor"
                [class.ring-4]="formDraft().activeColorIdForUpload === colorDraft.idColor"
                [class.ring-black/20]="formDraft().activeColorIdForUpload === colorDraft.idColor"
                [class.z-10]="formDraft().activeColorIdForUpload === colorDraft.idColor"
                (click)="setActiveColorForUpload(colorDraft.idColor)"
                [title]="colorDraft.nombreColor + (colorDraft.previewUrl ? ' - Foto cargada' : ' - Sin foto')"
              >
                @if (colorDraft.previewUrl) {
                <img
                  [src]="colorDraft.previewUrl"
                  alt="Preview"
                  class="w-full h-full object-cover"
                />
                <!-- Badge checkmark en fotos existentes -->
                <div class="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                } @else {
                <div class="w-full h-full" [style.background-color]="colorDraft.codigoHex"></div>
                }
              </button>
              }
            </div>

            <!-- Indicador del color activo -->
            @if (activeColorName()) {
            <div class="mt-6 text-center animate-fade-in">
              <p class="text-xs text-gray-400 tracking-wider">COLOR SELECCIONADO</p>
              <p class="text-lg font-bold text-black mt-1">{{ activeColorName() }}</p>
            </div>
            }
          </div>
        </div>

        <!-- Columna Derecha: Formulario -->
        <div class="w-full md:w-1/2 p-6 md:p-12 overflow-y-auto order-2 md:order-2">
          <h1 class="text-2xl md:text-4xl font-serif mb-6 md:mb-8" style="font-family: 'Playfair Display', serif">
            {{ modeloId() !== null ? 'EDITAR MODELO' : 'NUEVO MODELO' }}
          </h1>

          <form class="space-y-4 md:space-y-6">
            <!-- Nombre del Modelo -->
            <div>
              <label class="block text-xs font-semibold tracking-[0.15em] text-gray-400 mb-2">
                NOMBRE DEL MODELO
              </label>
              <input
                type="text"
                class="w-full border-b-2 border-gray-200 focus:border-black outline-none py-2 text-sm transition-colors"
                placeholder="Ingresa el nombre"
                [(ngModel)]="formDraft().nombreModelo"
                name="nombreModelo"
              />
            </div>

            <!-- Marca -->
            <div>
              <label class="block text-xs font-semibold tracking-[0.15em] text-gray-400 mb-2">
                MARCA
              </label>
              <select
                class="w-full border-b-2 border-gray-200 focus:border-black outline-none py-2 text-sm bg-transparent transition-colors"
                [(ngModel)]="formDraft().idMarca"
                name="idMarca"
                (change)="onMarcaChange($event)"
              >
                <option [value]="null" disabled>SELECCIONA UNA MARCA</option>
                <option value="CREATE_NEW" class="font-bold">+ CREAR NUEVA MARCA...</option>
                @for (marca of opciones().marcas; track marca.id) {
                <option [value]="marca.id">{{ marca.nombre }}</option>
                }
              </select>
            </div>

            <!-- Categoría -->
            <div>
              <label class="block text-xs font-semibold tracking-[0.15em] text-gray-400 mb-2">
                CATEGORÍA
              </label>
              <select
                class="w-full border-b-2 border-gray-200 focus:border-black outline-none py-2 text-sm bg-transparent transition-colors"
                [(ngModel)]="formDraft().idCategoria"
                name="idCategoria"
                (change)="onCategoriaChange($event)"
              >
                <option [value]="null" disabled>SELECCIONA UNA CATEGORÍA</option>
                <option value="CREATE_NEW" class="font-bold">+ CREAR NUEVA CATEGORÍA...</option>
                @for (cat of opciones().categorias; track cat.id) {
                <option [value]="cat.id">{{ cat.nombre }}</option>
                }
              </select>
            </div>

            <!-- Corte / Fit -->
            <div>
              <label class="block text-xs font-semibold tracking-[0.15em] text-gray-400 mb-3">
                CORTE / FIT
              </label>
              <div class="flex gap-3 items-center flex-wrap">
                @for (corte of opciones().cortes; track corte.id) {
                <button
                  type="button"
                  class="px-6 py-2 text-xs font-bold tracking-wider transition-all"
                  [class.bg-black]="formDraft().idCorte === corte.id"
                  [class.text-white]="formDraft().idCorte === corte.id"
                  [class.bg-white]="formDraft().idCorte !== corte.id"
                  [class.text-black]="formDraft().idCorte !== corte.id"
                  [class.border]="formDraft().idCorte !== corte.id"
                  [class.border-gray-300]="formDraft().idCorte !== corte.id"
                  (click)="selectCorte(corte.id)"
                >
                  {{ corte.nombre.toUpperCase() }}
                </button>
                }

                <!-- Botón + para crear nuevo corte -->
                <button
                  type="button"
                  class="w-12 h-12 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-black hover:text-black transition-all"
                  (click)="openMiniModalCorte()"
                  title="Crear nuevo corte"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Colores Disponibles -->
            <div>
              <label class="block text-xs font-semibold tracking-[0.15em] text-gray-400 mb-3">
                COLORES DISPONIBLES
              </label>
              <div class="flex gap-3 items-center flex-wrap">
                @for (color of opciones().colores; track color.id) {
                <button
                  type="button"
                  class="w-10 h-10 rounded-full border-4 transition-all relative"
                  [style.background-color]="color.codigoHex"
                  [class.border-black]="isColorSelected(color.id)"
                  [class.border-transparent]="!isColorSelected(color.id)"
                  (click)="toggleColor(color)"
                  [title]="color.nombre + ' (' + color.codigoHex + ')'"
                >
                  @if (isColorSelected(color.id)) {
                  <svg
                    class="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow-md"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  }
                </button>
                }

                <!-- Botón + para agregar color -->
                <button
                  type="button"
                  class="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-black hover:text-black transition-all"
                  (click)="onCreateColor()"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Tallas Disponibles -->
            <div>
              <label class="block text-xs font-semibold tracking-[0.15em] text-gray-400 mb-3">
                TALLAS DISPONIBLES
              </label>
              <div class="flex gap-3 items-center flex-wrap">
                @for (talla of opciones().tallas; track talla.id) {
                <button
                  type="button"
                  class="w-12 h-12 text-sm font-bold transition-all"
                  [class.bg-black]="isTallaSelected(talla.id)"
                  [class.text-white]="isTallaSelected(talla.id)"
                  [class.bg-white]="!isTallaSelected(talla.id)"
                  [class.text-black]="!isTallaSelected(talla.id)"
                  [class.border]="!isTallaSelected(talla.id)"
                  [class.border-gray-300]="!isTallaSelected(talla.id)"
                  (click)="toggleTalla(talla.id)"
                >
                  {{ talla.nombre }}
                </button>
                }

                <!-- Botón + para agregar talla -->
                <button
                  type="button"
                  class="w-12 h-12 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-black hover:text-black transition-all"
                  (click)="onCreateTalla()"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
          </form>

          <!-- Botones de Acción -->
          <div class="flex justify-end gap-4 mt-12 pt-6 border-t border-gray-100">
            <button
              type="button"
              class="px-8 py-3 text-sm font-medium text-gray-600 hover:text-black transition-colors tracking-wider"
              (click)="onClose()"
            >
              CANCELAR
            </button>
            <button
              type="button"
              class="px-8 py-3 bg-black text-white text-sm font-bold tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="!isFormValid() || saving()"
              (click)="onSave()"
            >
              {{ saving() ? 'GUARDANDO...' : 'GUARDAR MODELO' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación para eliminar color con foto -->
    @if (showConfirmDeleteModal()) {
    <div
      class="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      (click)="closeConfirmDeleteModal()"
    >
      <div class="bg-white p-10 max-w-md shadow-2xl" (click)="$event.stopPropagation()">
        <div class="text-center mb-6">
          <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-serif mb-3" style="font-family: 'Playfair Display', serif">
            ¿Eliminar foto?
          </h3>
          
          <!-- Preview de la foto y color a eliminar -->
          @if (colorToDelete()) {
          <div class="mb-4 flex justify-center">
            <div class="relative">
              <img 
                [src]="getColorPreviewUrl(colorToDelete()!.id)" 
                alt="Preview" 
                class="w-32 h-40 object-cover border-2 border-gray-200 rounded"
              />
              <div 
                class="absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-2 border-white shadow-lg"
                [style.background-color]="colorToDelete()!.codigoHex"
              ></div>
            </div>
          </div>
          }
          
          <p class="text-gray-600 text-sm leading-relaxed">
            El color <span class="font-bold text-black">"{{ colorToDelete()?.nombre }}"</span> tiene una foto cargada.
            <br>
            ¿Estás seguro de eliminar este color y su foto?
          </p>
        </div>

        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 text-sm font-medium hover:border-black hover:text-black transition-colors"
            (click)="cancelDeleteColorWithPhoto()"
          >
            NO, MANTENER
          </button>
          <button
            type="button"
            class="flex-1 px-6 py-3 bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
            (click)="confirmDeleteColorWithPhoto()"
          >
            SÍ, ELIMINAR
          </button>
        </div>
      </div>
    </div>
    }

    <!-- Mini-Modal para crear nueva opción -->
    @if (showMiniModal()) {
    <div
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
      (click)="closeMiniModal()"
    >
      <div class="bg-white p-8 w-96 shadow-2xl" (click)="$event.stopPropagation()">
        <h3 class="text-xl font-serif mb-6" style="font-family: 'Playfair Display', serif">
          {{ miniModalTitle() }}
        </h3>

        <!-- Input para nombre -->
        <input
          type="text"
          class="w-full border-b-2 border-gray-200 focus:border-black outline-none py-2 text-sm mb-6"
          [placeholder]="miniModalPlaceholder()"
          [(ngModel)]="miniModalValue"
          (keyup.enter)="saveMiniModal()"
        />

        <!-- Selector de color (solo visible cuando es tipo 'color') -->
        @if (miniModalType() === 'color') {
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <div class="flex items-center gap-3">
            <input
              type="color"
              class="h-12 w-20 rounded border border-gray-300 cursor-pointer"
              [(ngModel)]="miniModalColorHex"
            />
            <input
              type="text"
              class="flex-1 border-b-2 border-gray-200 focus:border-black outline-none py-2 text-sm font-mono"
              placeholder="#000000"
              [(ngModel)]="miniModalColorHex"
              maxlength="7"
            />
          </div>
        </div>
        }

        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="px-6 py-2 text-sm text-gray-600 hover:text-black transition-colors"
            (click)="closeMiniModal()"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="px-6 py-2 bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors"
            (click)="saveMiniModal()"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
    }
  `,
})
export class NuevoModeloModalComponent {
  private catalogoService = inject(CatalogoAdminService);
  private cloudinaryService = inject(CloudinaryService);
  private toastService = inject(ToastService);

  // Inputs
  opciones = input.required<OpcionesCatalogoDTO>();
  modeloId = input<number | null>(null); // Si es null, es modo crear; si tiene ID, es modo editar

  // Outputs
  closed = output<void>();
  modeloCreated = output<void>();
  opcionesUpdated = output<void>(); // Para notificar al padre que recargue opciones

  constructor() {
    // Debug: Imprimir colores cada vez que cambien las opciones
    effect(() => {
      const colores = this.opciones().colores;
      console.log('🎨 Colores recibidos en modal:', colores);
      colores.forEach((color) => {
        console.log(`  - ${color.nombre}: codigoHex=${color.codigoHex}`);
      });
    });

    // Cargar datos cuando se recibe un modeloId para editar
    effect(() => {
      const id = this.modeloId();
      if (id !== null) {
        console.log('📝 Cargando modelo para editar, ID:', id);
        this.loadModeloForEdit(id);
      }
    });
  }

  /**
   * Carga un modelo existente para editarlo
   */
  loadModeloForEdit(id: number): void {
    this.catalogoService.getModeloById(id).subscribe({
      next: (modelo) => {
        console.log('📦 Modelo cargado:', modelo);

        // Extraer IDs de tallas desde las variantes de los colores
        const tallasIds = new Set<number>();
        modelo.colores.forEach((colorModelo) => {
          colorModelo.variantes.forEach((variante) => {
            tallasIds.add(variante.talla.id);
          });
        });

        // Preparar colores con sus fotos
        const coloresDraft: ColorDraftDTO[] = modelo.colores.map((colorModelo) => ({
          idColor: colorModelo.color.id,
          nombreColor: colorModelo.color.nombre,
          codigoHex: colorModelo.color.codigoHex,
          photoFile: null,
          previewUrl: colorModelo.fotoUrl, // URL de Cloudinary existente
          isSelected: true,
        }));

        // Actualizar el formulario con los datos del modelo
        this.formDraft.set({
          nombreModelo: modelo.nombre,
          idMarca: modelo.marca.id,
          idCategoria: modelo.categoria.id,
          idCorte: modelo.corte.id,
          idsTallasSelected: Array.from(tallasIds),
          coloresDraft: coloresDraft,
          activeColorIdForUpload: coloresDraft.length > 0 ? coloresDraft[0].idColor : null,
        });
      },
      error: (err) => {
        console.error('Error cargando modelo:', err);
        this.toastService.error('Error al cargar el modelo', 4000);
      },
    });
  }

  // Estado del formulario
  formDraft = signal<FormDraftState>({
    nombreModelo: '',
    idMarca: null,
    idCategoria: null,
    idCorte: null,
    idsTallasSelected: [],
    coloresDraft: [],
    activeColorIdForUpload: null,
  });

  // Estado del drag & drop
  isDragging = signal<boolean>(false);
  saving = signal<boolean>(false);

  // Modal de confirmación para eliminar color con foto
  showConfirmDeleteModal = signal<boolean>(false);
  colorToDelete = signal<ColorDTO | null>(null);

  // Mini-modal state
  showMiniModal = signal<boolean>(false);
  miniModalType = signal<'marca' | 'categoria' | 'corte' | 'talla' | 'color' | null>(null);
  miniModalTitle = signal<string>('');
  miniModalPlaceholder = signal<string>('');
  miniModalValue = ''; // Propiedad normal para ngModel
  miniModalColorHex = '#000000'; // Para el color hex (solo en tipo 'color')

  // Computed
  activeColorPreview = computed(() => {
    const activeId = this.formDraft().activeColorIdForUpload;
    if (!activeId) return null;
    const color = this.formDraft().coloresDraft.find((c) => c.idColor === activeId);
    return color?.previewUrl || null;
  });

  activeColorName = computed(() => {
    const activeId = this.formDraft().activeColorIdForUpload;
    if (!activeId) return null;
    const color = this.formDraft().coloresDraft.find((c) => c.idColor === activeId);
    return color?.nombreColor || null;
  });

  isFormValid = computed(() => {
    const draft = this.formDraft();
    return (
      draft.nombreModelo.trim() !== '' &&
      draft.idMarca !== null &&
      draft.idCategoria !== null &&
      draft.idCorte !== null &&
      draft.idsTallasSelected.length > 0 &&
      draft.coloresDraft.filter((c) => c.isSelected && c.photoFile).length > 0
    );
  });

  // Métodos de Drag & Drop
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File) {
    const activeId = this.formDraft().activeColorIdForUpload;
    if (!activeId) {
      this.toastService.error('Selecciona un color primero', 3000);
      return;
    }

    // Validar tipo y tamaño
    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      this.toastService.error('Solo se permiten JPG, PNG o WEBP', 3000);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.error('El archivo no debe superar 10MB', 3000);
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const draft = this.formDraft();
      const updatedColors = draft.coloresDraft.map((c) => {
        if (c.idColor === activeId) {
          return {
            ...c,
            photoFile: file,
            previewUrl: e.target?.result as string,
          };
        }
        return c;
      });

      this.formDraft.update((d) => ({ ...d, coloresDraft: updatedColors }));
    };

    reader.readAsDataURL(file);
  }

  // Métodos de selección
  selectCorte(id: number) {
    this.formDraft.update((d) => ({ ...d, idCorte: id }));
  }

  toggleColor(color: ColorDTO) {
    const draft = this.formDraft();
    const existing = draft.coloresDraft.find((c) => c.idColor === color.id);

    if (existing) {
      // Si está seleccionado y tiene foto, pedir confirmación
      if (existing.isSelected && existing.previewUrl) {
        this.colorToDelete.set(color);
        this.showConfirmDeleteModal.set(true);
        return;
      }

      // Si no tiene foto o ya está deseleccionado, toggle normal
      const updated = draft.coloresDraft.map((c) =>
        c.idColor === color.id ? { ...c, isSelected: !c.isSelected } : c
      );
      this.formDraft.update((d) => ({ ...d, coloresDraft: updated }));

      // Si deseleccionamos y no tiene foto, removerlo de la lista
      if (existing.isSelected && !existing.previewUrl) {
        this.formDraft.update((d) => ({
          ...d,
          coloresDraft: d.coloresDraft.filter((c) => c.idColor !== color.id),
        }));
        this.toastService.success(`Color "${color.nombre}" removido`, 2000);
      }
    } else {
      // Agregar y seleccionar
      const newColor: ColorDraftDTO = {
        idColor: color.id,
        nombreColor: color.nombre,
        codigoHex: color.codigoHex,
        photoFile: null,
        previewUrl: null,
        isSelected: true,
      };
      this.formDraft.update((d) => ({
        ...d,
        coloresDraft: [...d.coloresDraft, newColor],
        activeColorIdForUpload: color.id,
      }));
    }
  }

  confirmDeleteColorWithPhoto() {
    const color = this.colorToDelete();
    if (!color) return;

    const draft = this.formDraft();

    // Remover el color de la lista
    const updatedColors = draft.coloresDraft.filter((c) => c.idColor !== color.id);

    // Si el color activo era el que eliminamos, limpiar activeColorIdForUpload
    const newActiveId =
      draft.activeColorIdForUpload === color.id ? null : draft.activeColorIdForUpload;

    this.formDraft.update((d) => ({
      ...d,
      coloresDraft: updatedColors,
      activeColorIdForUpload: newActiveId,
    }));

    this.toastService.success(`Color "${color.nombre}" y su foto eliminados`, 3000);
    this.closeConfirmDeleteModal();
  }

  cancelDeleteColorWithPhoto() {
    this.closeConfirmDeleteModal();
  }

  closeConfirmDeleteModal() {
    this.showConfirmDeleteModal.set(false);
    this.colorToDelete.set(null);
  }

  getColorPreviewUrl(colorId: number): string | null {
    const color = this.formDraft().coloresDraft.find((c) => c.idColor === colorId);
    return color?.previewUrl || null;
  }

  isColorSelected(id: number): boolean {
    return this.formDraft().coloresDraft.some((c) => c.idColor === id && c.isSelected);
  }

  setActiveColorForUpload(id: number) {
    this.formDraft.update((d) => ({ ...d, activeColorIdForUpload: id }));
  }

  removeActivePhoto() {
    const activeId = this.formDraft().activeColorIdForUpload;
    if (!activeId) return;

    const draft = this.formDraft();
    const updatedColors = draft.coloresDraft.map((c) => {
      if (c.idColor === activeId) {
        return {
          ...c,
          photoFile: null,
          previewUrl: null,
        };
      }
      return c;
    });

    this.formDraft.update((d) => ({ ...d, coloresDraft: updatedColors }));
    this.toastService.success('Foto eliminada. Puedes subir una nueva', 3000);
  }

  toggleTalla(id: number) {
    const draft = this.formDraft();
    const isSelected = draft.idsTallasSelected.includes(id);

    if (isSelected) {
      this.formDraft.update((d) => ({
        ...d,
        idsTallasSelected: d.idsTallasSelected.filter((t) => t !== id),
      }));
    } else {
      this.formDraft.update((d) => ({
        ...d,
        idsTallasSelected: [...d.idsTallasSelected, id],
      }));
    }
  }

  isTallaSelected(id: number): boolean {
    return this.formDraft().idsTallasSelected.includes(id);
  }

  // Manejar cambio en select de Marca
  onMarcaChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select.value === 'CREATE_NEW') {
      this.formDraft.update((d) => ({ ...d, idMarca: null }));
      this.openMiniModalMarca();
    }
  }

  // Manejar cambio en select de Categoría
  onCategoriaChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select.value === 'CREATE_NEW') {
      this.formDraft.update((d) => ({ ...d, idCategoria: null }));
      this.openMiniModalCategoria();
    }
  }

  // Mini-modales para crear opciones
  openMiniModalMarca() {
    this.miniModalType.set('marca');
    this.miniModalTitle.set('Nueva Marca');
    this.miniModalPlaceholder.set('Nombre de la marca');
    this.miniModalValue = '';
    this.showMiniModal.set(true);
  }

  openMiniModalCategoria() {
    this.miniModalType.set('categoria');
    this.miniModalTitle.set('Nueva Categoría');
    this.miniModalPlaceholder.set('Nombre de la categoría');
    this.miniModalValue = '';
    this.showMiniModal.set(true);
  }

  openMiniModalCorte() {
    this.miniModalType.set('corte');
    this.miniModalTitle.set('Nuevo Corte');
    this.miniModalPlaceholder.set('Nombre del corte');
    this.miniModalValue = '';
    this.showMiniModal.set(true);
  }

  onCreateColor() {
    this.miniModalType.set('color');
    this.miniModalTitle.set('Nuevo Color');
    this.miniModalPlaceholder.set('Nombre del color');
    this.miniModalValue = '';
    this.miniModalColorHex = '#000000';
    this.showMiniModal.set(true);
  }

  onCreateTalla() {
    this.miniModalType.set('talla');
    this.miniModalTitle.set('Nueva Talla');
    this.miniModalPlaceholder.set('Nombre de la talla (ej: XL)');
    this.miniModalValue = '';
    this.showMiniModal.set(true);
  }

  closeMiniModal() {
    this.showMiniModal.set(false);
    this.miniModalType.set(null);
    this.miniModalValue = '';
    this.miniModalColorHex = '#000000';
  }

  saveMiniModal() {
    const value = this.miniModalValue.trim();
    if (!value) return;

    const type = this.miniModalType();
    this.saving.set(true);

    switch (type) {
      case 'marca':
        this.catalogoService.createMarca(value).subscribe({
          next: (nuevaMarca) => {
            // Agregar la nueva marca a las opciones sin perder el estado del formulario
            const currentOpciones = this.opciones();
            const updatedOpciones = {
              ...currentOpciones,
              marcas: [...currentOpciones.marcas, nuevaMarca],
            };
            // Actualizar las opciones (requiere que opciones sea un signal writable)
            // Por ahora, recargaremos las opciones
            this.catalogoService.getOpciones().subscribe({
              next: (opciones) => {
                // Aquí necesitarías actualizar el input opciones desde el componente padre
                this.toastService.success(`Marca "${nuevaMarca.nombre}" creada`, 4000);
                this.formDraft.update((d) => ({ ...d, idMarca: nuevaMarca.id }));
                this.saving.set(false);
                this.closeMiniModal();
                // Emitir evento para que el padre recargue opciones
                this.opcionesUpdated.emit();
              },
            });
          },
          error: (err) => {
            console.error('Error creando marca:', err);
            this.toastService.error('Error al crear la marca', 4000);
            this.saving.set(false);
          },
        });
        break;

      case 'categoria':
        this.catalogoService.createCategoria(value).subscribe({
          next: (nuevaCategoria) => {
            this.catalogoService.getOpciones().subscribe({
              next: () => {
                this.toastService.success(`Categoría "${nuevaCategoria.nombre}" creada`, 4000);
                this.formDraft.update((d) => ({ ...d, idCategoria: nuevaCategoria.id }));
                this.saving.set(false);
                this.closeMiniModal();
                this.opcionesUpdated.emit();
              },
            });
          },
          error: (err) => {
            console.error('Error creando categoría:', err);
            this.toastService.error('Error al crear la categoría', 4000);
            this.saving.set(false);
          },
        });
        break;

      case 'corte':
        this.catalogoService.createCorte(value).subscribe({
          next: (nuevoCorte) => {
            this.catalogoService.getOpciones().subscribe({
              next: () => {
                this.toastService.success(`Corte "${nuevoCorte.nombre}" creado`, 4000);
                this.formDraft.update((d) => ({ ...d, idCorte: nuevoCorte.id }));
                this.saving.set(false);
                this.closeMiniModal();
                this.opcionesUpdated.emit();
              },
            });
          },
          error: (err) => {
            console.error('Error creando corte:', err);
            this.toastService.error('Error al crear el corte', 4000);
            this.saving.set(false);
          },
        });
        break;

      case 'talla':
        this.catalogoService.createTalla(value).subscribe({
          next: (nuevaTalla) => {
            this.catalogoService.getOpciones().subscribe({
              next: () => {
                this.toastService.success(`Talla "${nuevaTalla.nombre}" creada`, 4000);
                // Agregar la talla a las seleccionadas
                this.formDraft.update((d) => ({
                  ...d,
                  idsTallasSelected: [...d.idsTallasSelected, nuevaTalla.id],
                }));
                this.saving.set(false);
                this.closeMiniModal();
                this.opcionesUpdated.emit();
              },
            });
          },
          error: (err) => {
            console.error('Error creando talla:', err);
            this.toastService.error('Error al crear la talla', 4000);
            this.saving.set(false);
          },
        });
        break;

      case 'color':
        this.catalogoService.createColor(value, this.miniModalColorHex).subscribe({
          next: (nuevoColor) => {
            console.log('Color creado desde backend:', nuevoColor);
            this.catalogoService.getOpciones().subscribe({
              next: (opciones) => {
                console.log('Opciones recargadas:', opciones.colores);
                this.toastService.success(`Color "${nuevoColor.nombre}" creado`, 4000);
                // Agregar el color a coloresDraft y seleccionarlo
                // Agregar el color a coloresDraft y seleccionarlo
                const newColorDraft: ColorDraftDTO = {
                  idColor: nuevoColor.id,
                  nombreColor: nuevoColor.nombre,
                  codigoHex: nuevoColor.codigoHex,
                  photoFile: null,
                  previewUrl: null,
                  isSelected: true,
                };
                this.formDraft.update((d) => ({
                  ...d,
                  coloresDraft: [...d.coloresDraft, newColorDraft],
                  activeColorIdForUpload: nuevoColor.id,
                }));
                this.saving.set(false);
                this.closeMiniModal();
                this.opcionesUpdated.emit();
              },
            });
          },
          error: (err) => {
            console.error('Error creando color:', err);
            this.toastService.error('Error al crear el color', 4000);
            this.saving.set(false);
          },
        });
        break;
    }

    this.closeMiniModal();
  }

  // Guardar modelo
  onSave() {
    if (!this.isFormValid()) return;

    this.saving.set(true);

    const draft = this.formDraft();
    const idCategoria = draft.idCategoria!;
    const isEditMode = this.modeloId() !== null;

    // Separar colores en dos grupos: los que necesitan subir foto nueva y los que ya tienen foto en Cloudinary
    const coloresConFotoNueva = draft.coloresDraft.filter(
      (c) => c.isSelected && c.photoFile !== null
    );
    const coloresConFotoExistente = draft.coloresDraft.filter(
      (c) => c.isSelected && c.photoFile === null && c.previewUrl
    );

    // Verificar que hay al menos un color con foto (nueva o existente)
    if (coloresConFotoNueva.length === 0 && coloresConFotoExistente.length === 0) {
      this.saving.set(false);
      this.toastService.error('Debes subir al menos una foto', 4000);
      return;
    }

    // Si hay fotos nuevas, subirlas a Cloudinary
    if (coloresConFotoNueva.length > 0) {
      const uploadObservables = coloresConFotoNueva.map((color) =>
        this.cloudinaryService.uploadImage(color.photoFile!, idCategoria.toString())
      );

      forkJoin(uploadObservables).subscribe({
        next: (cloudinaryUrls) => {
          // Mapear las URLs de Cloudinary recién subidas
          const coloresNuevosPayload = coloresConFotoNueva.map((color, index) => ({
            idColor: color.idColor,
            fotoUrl: cloudinaryUrls[index],
          }));

          // Mapear los colores con fotos existentes (usar previewUrl que ya es Cloudinary URL)
          const coloresExistentesPayload = coloresConFotoExistente.map((color) => ({
            idColor: color.idColor,
            fotoUrl: color.previewUrl!,
          }));

          // Combinar ambos grupos
          const coloresPayload = [...coloresNuevosPayload, ...coloresExistentesPayload];

          this.saveModeloToBackend(coloresPayload, draft, isEditMode);
        },
        error: (err) => {
          this.saving.set(false);
          console.error('Error al subir imágenes a Cloudinary:', err);
          this.toastService.error('Error al subir las imágenes', 4000);
        },
      });
    } else {
      // No hay fotos nuevas, solo usar las existentes
      const coloresPayload = coloresConFotoExistente.map((color) => ({
        idColor: color.idColor,
        fotoUrl: color.previewUrl!,
      }));

      this.saveModeloToBackend(coloresPayload, draft, isEditMode);
    }
  }

  private saveModeloToBackend(
    coloresPayload: { idColor: number; fotoUrl: string }[],
    draft: FormDraftState,
    isEditMode: boolean
  ) {
    const payload = {
      nombreModelo: draft.nombreModelo,
      idMarca: draft.idMarca!,
      idCategoria: draft.idCategoria!,
      idCorte: draft.idCorte!,
      colores: coloresPayload,
      idsTallas: draft.idsTallasSelected,
    };

    const saveObservable = isEditMode
      ? this.catalogoService.updateModelo(this.modeloId()!, payload)
      : this.catalogoService.createModelo(payload);

    saveObservable.subscribe({
      next: () => {
        this.saving.set(false);
        this.toastService.success(
          isEditMode ? 'Modelo actualizado exitosamente' : 'Modelo creado exitosamente',
          4000
        );
        this.modeloCreated.emit();
        this.onClose();
      },
      error: (err) => {
        this.saving.set(false);
        console.error(isEditMode ? 'Error al actualizar modelo:' : 'Error al crear modelo:', err);
        this.toastService.error(
          isEditMode ? 'Error al actualizar el modelo' : 'Error al crear el modelo',
          4000
        );
      },
    });
  }

  onClose() {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
