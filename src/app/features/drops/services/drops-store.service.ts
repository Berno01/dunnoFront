import { Injectable, signal, computed, inject } from '@angular/core';
import { DropCartItem, ModeloDetalleDrop } from '../../../core/models/drops.models';
import { DropsService } from '../../../core/services/drops.service';
import { SessionService } from '../../../core/services/session.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DropsStoreService {
  private dropsService = inject(DropsService);
  private sessionService = inject(SessionService);

  // Estado del carrito de ingreso
  private items = signal<DropCartItem[]>([]);

  // Signals de carga
  isLoading = signal<boolean>(false);

  // Modo edición
  private editingDropId = signal<number | null>(null);

  // Computed
  cartItems = computed(() => this.items());
  itemCount = computed(() => {
    return this.items().reduce((sum, item) => sum + item.cantidad, 0);
  });

  /**
   * Agrega un item al drop o incrementa la cantidad si ya existe
   */
  addItem(item: DropCartItem): void {
    const existingIndex = this.items().findIndex((i) => i.idVariante === item.idVariante);

    if (existingIndex !== -1) {
      // Si ya existe, incrementar cantidad
      const updated = [...this.items()];
      updated[existingIndex] = {
        ...updated[existingIndex],
        cantidad: updated[existingIndex].cantidad + item.cantidad,
      };
      this.items.set(updated);
    } else {
      // Agregar nuevo item
      this.items.set([...this.items(), item]);
    }
  }

  /**
   * Incrementa la cantidad de un item
   */
  incrementItem(idVariante: number): void {
    const updated = this.items().map((item) =>
      item.idVariante === idVariante ? { ...item, cantidad: item.cantidad + 1 } : item
    );
    this.items.set(updated);
  }

  /**
   * Decrementa la cantidad de un item (mínimo 1)
   */
  decrementItem(idVariante: number): void {
    const updated = this.items()
      .map((item) => {
        if (item.idVariante === idVariante) {
          const newQuantity = item.cantidad - 1;
          return newQuantity > 0 ? { ...item, cantidad: newQuantity } : null;
        }
        return item;
      })
      .filter((item): item is DropCartItem => item !== null);

    this.items.set(updated);
  }

  /**
   * Elimina un item del carrito
   */
  removeItem(idVariante: number): void {
    this.items.set(this.items().filter((item) => item.idVariante !== idVariante));
  }

  /**
   * Limpia todo el carrito
   */
  clearCart(): void {
    this.items.set([]);
    this.editingDropId.set(null);
  }

  /**
   * Carga items para edición
   */
  loadItemsForEdit(items: DropCartItem[], dropId: number): void {
    this.items.set(items);
    this.editingDropId.set(dropId);
  }

  /**
   * Obtiene el ID del drop en edición
   */
  getEditingDropId(): number | null {
    return this.editingDropId();
  }

  /**
   * Indica si está en modo edición
   */
  isEditMode(): boolean {
    return this.editingDropId() !== null;
  }

  /**
   * Carga un drop existente para edición
   * Similar a loadSaleForEdit de ventas
   */
  loadDropForEdit(dropId: number): void {
    this.isLoading.set(true);
    this.editingDropId.set(dropId);

    this.dropsService.getDropById(dropId).subscribe({
      next: (drop) => {
        // 1. Actualizar sucursal en SessionService
        const sucursalNombre = this.getBranchName(drop.idSucursal);
        this.sessionService.setSucursal(drop.idSucursal, sucursalNombre);

        // 2. Validar que existan detalles
        if (!drop.detalles || drop.detalles.length === 0) {
          console.error('No se encontraron detalles en el drop');
          this.isLoading.set(false);
          return;
        }

        // 3. Agrupar detalles por id_modelo único
        const modelosUnicos = new Set<number>();
        drop.detalles.forEach((detalle) => {
          if (detalle.idModelo) {
            modelosUnicos.add(detalle.idModelo);
          }
        });

        if (modelosUnicos.size === 0) {
          console.error('No se encontraron id_modelo en los detalles del drop');
          this.isLoading.set(false);
          return;
        }

        // 3. Consultar catálogo para cada modelo único (en paralelo)
        const catalogRequests = Array.from(modelosUnicos).map((idModelo) =>
          this.dropsService.getDetalleModelo(idModelo).pipe(
            map((detalle) => ({ idModelo, detalle })),
            catchError((err) => {
              console.error(`Error al cargar modelo ${idModelo}:`, err);
              return of(null);
            })
          )
        );

        forkJoin(catalogRequests).subscribe({
          next: (catalogResults) => {
            // 4. Crear mapa idModelo -> ModeloDetalleDrop
            const catalogMap = new Map<number, ModeloDetalleDrop>();
            catalogResults.forEach((result) => {
              if (result) {
                catalogMap.set(result.idModelo, result.detalle);
              }
            });

            // 5. Construir DropCartItems hidratados
            const hydrated: DropCartItem[] = [];

            // Validar nuevamente que existan detalles (TypeScript safety)
            if (drop.detalles) {
              drop.detalles.forEach((detalleDrop) => {
                if (!detalleDrop.idModelo) {
                  console.warn('Detalle sin idModelo, omitiendo:', detalleDrop);
                  return;
                }

                const productDetail = catalogMap.get(detalleDrop.idModelo);
                if (!productDetail) {
                  console.warn(`No se encontró catálogo para modelo ${detalleDrop.idModelo}`);
                  return;
                }

                // Buscar la variante en el árbol de colores/tallas
                const varianteData = this.findVarianteInCatalog(
                  productDetail,
                  detalleDrop.idVariante
                );

                if (!varianteData) {
                  console.warn(
                    `No se encontró variante ${detalleDrop.idVariante} en el catálogo del modelo ${detalleDrop.idModelo}`
                  );
                  return;
                }

                // Construir DropCartItem completo
                const cartItem: DropCartItem = {
                  idVariante: detalleDrop.idVariante,
                  idModelo: detalleDrop.idModelo,
                  nombreModelo: productDetail.nombreModelo,
                  nombreMarca: productDetail.nombreMarca,
                  nombreColor: varianteData.color.nombreColor,
                  nombreTalla: varianteData.talla.nombreTalla,
                  fotoUrl: varianteData.color.fotoUrl,
                  cantidad: detalleDrop.cantidad,
                };

                hydrated.push(cartItem);
              });
            }

            // 6. Setear items hidratados
            this.items.set(hydrated);
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Error al hidratar drop:', err);
            this.isLoading.set(false);
          },
        });
      },
      error: (err) => {
        console.error('Error al cargar drop:', err);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Busca una variante específica en el catálogo del modelo
   */
  private findVarianteInCatalog(
    producto: ModeloDetalleDrop,
    idVariante: number
  ): { color: any; talla: any } | null {
    for (const color of producto.colores) {
      for (const talla of color.tallas) {
        if (talla.idVariante === idVariante) {
          return { color, talla };
        }
      }
    }
    return null;
  }

  private getBranchName(id: number): string {
    const branches: Record<number, string> = {
      1: 'Tarija',
      2: 'Cochabamba',
      3: 'Santa Cruz',
    };
    return branches[id] || `Sucursal ${id}`;
  }
}
