import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CartItem, VentaDTO } from '../models/venta.models';
import { SessionService } from './session.service';
import { VentasService } from './ventas.service';
import { ToastService } from './toast.service';
import { ColorDTO, DetallePrendaDTO, TallaDTO } from '../models/catalogo.models';
import { CatalogService } from '../../features/ventas/services/catalog.service';

@Injectable({
  providedIn: 'root',
})
export class VentasStoreService {
  private sessionService = inject(SessionService);
  private ventasService = inject(VentasService);
  private catalogService = inject(CatalogService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // --- Estado (Signals Writable) ---
  readonly cartItems = signal<CartItem[]>([]);
  readonly sucursalId = signal<number>(this.sessionService.sucursalId());
  readonly paymentAmounts = signal<{ efectivo: number; qr: number; tarjeta: number }>({
    efectivo: 0,
    qr: 0,
    tarjeta: 0,
  });
  readonly splitActive = signal<boolean>(false);
  readonly selectedPaymentMethod = signal<'EFECTIVO' | 'QR' | 'TARJETA' | ''>('EFECTIVO');
  readonly tipoVenta = signal<'LOCAL' | 'ENVIO'>('LOCAL');
  readonly editingSaleId = signal<number | null>(null);
  readonly isLoading = signal<boolean>(false);

  // --- Estado Derivado (Computed Signals) ---
  readonly totalVenta = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.subtotal, 0)
  );

  readonly cantidadTotalArticulos = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.cantidad, 0)
  );

  readonly ventaPayload = computed<VentaDTO>(() => {
    const total = this.totalVenta();
    const payments = this.paymentAmounts();
    const editingId = this.editingSaleId();
    // Siempre usar SessionService (que se actualiza tanto al crear como al editar)
    return {
      id_venta: editingId ?? undefined,
      id_sucursal: this.sessionService.sucursalId(),
      total: total,
      monto_efectivo: payments.efectivo,
      monto_qr: payments.qr,
      monto_tarjeta: payments.tarjeta,
      tipo_venta: this.tipoVenta(),
      detalle_venta: this.cartItems().map((item) => ({
        id_variante: item.idVariante,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
        total: item.subtotal,
      })),
    };
  });

  constructor() {
    // Sincronizar sucursal si cambia la sesión (opcional, pero buena práctica)
    // effect(() => this.sucursalId.set(this.sessionService.sucursalId()));
  }

  // --- Métodos (Actions) ---

  addItem(producto: DetallePrendaDTO, color: ColorDTO, talla: TallaDTO, precio: number) {
    this.cartItems.update((items) => {
      const existingItemIndex = items.findIndex((i) => i.idVariante === talla.idVariante);

      if (existingItemIndex !== -1) {
        // El item ya existe, actualizamos cantidad
        const existingItem = items[existingItemIndex];
        const nuevaCantidad = existingItem.cantidad + 1;

        if (nuevaCantidad > existingItem.stockMaximo) {
          // Aquí se podría emitir una notificación de error o simplemente no hacer nada
          console.warn('Stock máximo alcanzado para este item');
          return items;
        }

        const updatedItems = [...items];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * existingItem.precioUnitario,
        };
        return updatedItems;
      } else {
        // Nuevo item
        const newItem: CartItem = {
          idVariante: talla.idVariante,
          idModelo: producto.idModelo,
          nombreModelo: producto.nombreModelo,
          nombreMarca: producto.nombreMarca,
          nombreColor: color.nombreColor,
          nombreTalla: talla.nombreTalla,
          fotoUrl: color.fotoUrl, // Usamos la foto del color
          cantidad: 1,
          precioUnitario: precio,
          subtotal: precio * 1,
          stockMaximo: talla.stock, // El stock viene de la talla específica
        };
        return [...items, newItem];
      }
    });
  }

  removeItem(idVariante: number) {
    this.cartItems.update((items) => items.filter((i) => i.idVariante !== idVariante));
  }

  updateQuantity(idVariante: number, nuevaCantidad: number) {
    this.cartItems.update((items) => {
      return items.map((item) => {
        if (item.idVariante === idVariante) {
          if (nuevaCantidad <= 0) return item; // O eliminarlo? Por ahora mantenemos validación > 0
          if (nuevaCantidad > item.stockMaximo) {
            console.warn('Stock máximo excedido');
            return item;
          }
          return {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precioUnitario,
          };
        }
        return item;
      });
    });
  }

  updatePrice(idVariante: number, nuevoPrecio: number) {
    this.cartItems.update((items) => {
      return items.map((item) => {
        if (item.idVariante === idVariante) {
          if (nuevoPrecio < 0) return item;
          return {
            ...item,
            precioUnitario: nuevoPrecio,
            subtotal: item.cantidad * nuevoPrecio,
          };
        }
        return item;
      });
    });
  }

  clearCart() {
    this.cartItems.set([]);
    this.resetPayments();
    this.editingSaleId.set(null);
  }

  resetState() {
    this.cartItems.set([]);
    this.resetPayments();
    this.editingSaleId.set(null);
    this.tipoVenta.set('LOCAL');
    this.splitActive.set(false);
    this.selectedPaymentMethod.set('EFECTIVO');
  }

  setPayment(type: 'EFECTIVO' | 'QR' | 'TARJETA', amount?: number) {
    const total = this.totalVenta();

    if (type === 'EFECTIVO') {
      this.paymentAmounts.set({
        efectivo: total,
        qr: 0,
        tarjeta: 0,
      });
      this.splitActive.set(false);
      return;
    }

    if (!amount || amount <= 0 || amount > total) {
      console.warn('Monto inválido para pago mixto');
      return;
    }

    const remaining = total - amount;

    if (type === 'QR') {
      this.paymentAmounts.set({
        efectivo: remaining,
        qr: amount,
        tarjeta: 0,
      });
    } else if (type === 'TARJETA') {
      this.paymentAmounts.set({
        efectivo: remaining,
        qr: 0,
        tarjeta: amount,
      });
    }

    this.splitActive.set(true);
  }

  resetPayments() {
    const total = this.totalVenta();
    this.paymentAmounts.set({
      efectivo: total,
      qr: 0,
      tarjeta: 0,
    });
    this.splitActive.set(false);
  }

  setTipoVenta(tipo: 'LOCAL' | 'ENVIO') {
    this.tipoVenta.set(tipo);
  }

  private getBranchName(id: number): string {
    const branches: Record<number, string> = {
      1: 'Tarija',
      2: 'Cochabamba',
      3: 'Santa Cruz',
    };
    return branches[id] || `Sucursal ${id}`;
  }

  /**
   * HIDRATACIÓN DEL CARRITO - Carga una venta existente para edición
   * 1. Obtiene la venta del backend
   * 2. Consulta el catálogo por cada modelo único para obtener datos visuales
   * 3. Reconstruye los CartItems combinando datos de venta + catálogo
   */
  loadSaleForEdit(saleId: number): void {
    this.isLoading.set(true);
    this.editingSaleId.set(saleId);

    this.ventasService.getSaleById(saleId).subscribe({
      next: (venta) => {
        // 1. Establecer datos básicos de la venta
        this.sucursalId.set(venta.id_sucursal);

        // Actualizar SessionService para que toda la app use esta sucursal
        const sucursalNombre = this.getBranchName(venta.id_sucursal);
        this.sessionService.setSucursal(venta.id_sucursal, sucursalNombre);

        this.tipoVenta.set(venta.tipo_venta as 'LOCAL' | 'ENVIO');
        this.paymentAmounts.set({
          efectivo: venta.monto_efectivo,
          qr: venta.monto_qr,
          tarjeta: venta.monto_tarjeta,
        });

        // Detectar si hay split activo y establecer método de pago
        const hasSplit = venta.monto_qr > 0 || venta.monto_tarjeta > 0;
        this.splitActive.set(hasSplit);

        if (hasSplit) {
          // Determinar cuál es el método secundario (QR o Tarjeta)
          if (venta.monto_qr > 0) {
            this.selectedPaymentMethod.set('QR');
          } else if (venta.monto_tarjeta > 0) {
            this.selectedPaymentMethod.set('TARJETA');
          }
        } else {
          // Pago simple en efectivo
          this.selectedPaymentMethod.set('EFECTIVO');
        }

        // 2. Agrupar detalles por id_modelo único para evitar consultas duplicadas
        const modelosUnicos = new Set<number>();
        venta.detalle_venta.forEach((detalle) => {
          if (detalle.id_modelo) {
            modelosUnicos.add(detalle.id_modelo);
          }
        });

        // 3. Si no hay id_modelo en los detalles, no podemos hidratar
        if (modelosUnicos.size === 0) {
          console.error('No se encontraron id_modelo en los detalles de la venta');
          this.isLoading.set(false);
          return;
        }

        // 4. Consultar catálogo para cada modelo único (en paralelo)
        const catalogRequests = Array.from(modelosUnicos).map((idModelo) =>
          this.catalogService.getProductDetail(idModelo, venta.id_sucursal).pipe(
            map((detalle) => ({ idModelo, detalle })),
            catchError((err) => {
              console.error(`Error al cargar modelo ${idModelo}:`, err);
              return of(null);
            })
          )
        );

        forkJoin(catalogRequests).subscribe({
          next: (catalogResults) => {
            // 5. Crear mapa idModelo -> DetallePrendaDTO
            const catalogMap = new Map<number, DetallePrendaDTO>();
            catalogResults.forEach((result) => {
              if (result) {
                catalogMap.set(result.idModelo, result.detalle);
              }
            });

            // 6. Construir CartItems hidratados
            const hydrated: CartItem[] = [];

            venta.detalle_venta.forEach((detalleVenta) => {
              if (!detalleVenta.id_modelo) {
                console.warn('Detalle sin id_modelo, omitiendo:', detalleVenta);
                return;
              }

              const productDetail = catalogMap.get(detalleVenta.id_modelo);
              if (!productDetail) {
                console.warn(`No se encontró catálogo para modelo ${detalleVenta.id_modelo}`);
                return;
              }

              // Buscar la variante en el árbol de colores/tallas
              const varianteData = this.findVarianteInCatalog(
                productDetail,
                detalleVenta.id_variante
              );

              if (!varianteData) {
                console.warn(
                  `No se encontró variante ${detalleVenta.id_variante} en el catálogo del modelo ${detalleVenta.id_modelo}`
                );
                return;
              }

              // Construir CartItem completo
              const cartItem: CartItem = {
                idVariante: detalleVenta.id_variante,
                idModelo: detalleVenta.id_modelo,
                nombreModelo: productDetail.nombreModelo,
                nombreMarca: productDetail.nombreMarca,
                nombreColor: varianteData.color.nombreColor,
                nombreTalla: varianteData.talla.nombreTalla,
                fotoUrl: varianteData.color.fotoUrl,
                cantidad: detalleVenta.cantidad,
                precioUnitario: detalleVenta.precio_unitario,
                subtotal: detalleVenta.total,
                stockMaximo: varianteData.talla.stock,
              };

              hydrated.push(cartItem);
            });

            // 7. Actualizar estado del carrito
            this.cartItems.set(hydrated);
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Error al hidratar el carrito:', err);
            this.isLoading.set(false);
          },
        });
      },
      error: (err) => {
        console.error('Error al cargar la venta:', err);
        this.isLoading.set(false);
        this.router.navigate(['/ventas']);
      },
    });
  }

  /**
   * Busca recursivamente en el árbol de colores/tallas una variante específica
   * Retorna el color y la talla que contienen esa variante
   */
  private findVarianteInCatalog(
    producto: DetallePrendaDTO,
    idVariante: number
  ): { color: ColorDTO; talla: TallaDTO } | null {
    for (const color of producto.colores) {
      for (const talla of color.tallas) {
        if (talla.idVariante === idVariante) {
          return { color, talla };
        }
      }
    }
    return null;
  }

  /**
   * Confirmar venta: Crear nueva o actualizar existente
   */
  confirmSale(): void {
    const payload = this.ventaPayload();
    const editingId = this.editingSaleId();

    if (editingId) {
      // Modo edición
      this.ventasService.updateSale(editingId, payload).subscribe({
        next: () => {
          this.toastService.success(`Venta #${editingId} actualizada correctamente`, 4000);
          this.resetState();
          this.router.navigate(['/ventas']);
        },
        error: (err) => {
          console.error('Error al actualizar la venta:', err);
          this.toastService.error('Error al actualizar la venta. Intente nuevamente.', 4000);
        },
      });
    } else {
      // Modo creación
      this.ventasService.createSale(payload).subscribe({
        next: (response) => {
          this.toastService.success(`Venta creada exitosamente. ${response.mensaje}`, 4000);
          this.resetState();
          this.router.navigate(['/ventas']);
        },
        error: (err) => {
          console.error('Error al crear la venta:', err);
          this.toastService.error('Error al crear la venta. Intente nuevamente.', 4000);
        },
      });
    }
  }
}
