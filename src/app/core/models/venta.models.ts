export interface DetalleVentaDTO {
  id_variante: number;
  id_modelo?: number; // Viene del backend al consultar una venta
  cantidad: number;
  precio_unitario: number;
  total: number;
}

export interface VentaDTO {
  id_venta?: number; // para creación mandamos su valor en null
  id_sucursal: number;
  id_usuario?: number; // ID del usuario que realiza la venta
  username?: string; // Nombre del usuario que realiza la venta (viene del back)
  total: number; // calculado
  descuento: number; // Descuento opcional aplicado a la venta
  tipo_descuento: 'SIN DESCUENTO' | 'PROMOCION' | 'DESCUENTO'; // Tipo de descuento aplicado
  monto_efectivo: number;
  monto_qr: number;
  monto_tarjeta: number;
  monto_giftcard: number; // Nuevo método de pago
  tipo_venta: string; // 'LOCAL' | 'ENVIO'
  fecha_venta?: string; // Viene del back
  estado_venta?: boolean; // Viene del back (true=activa, false=anulada)
  detalle_venta: DetalleVentaDTO[];
}

export interface CartItem {
  idVariante: number;
  idModelo: number;
  nombreModelo: string;
  nombreMarca: string;
  nombreColor: string;
  nombreTalla: string;
  fotoUrl: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  stockMaximo: number;
  cantidadOriginal?: number; // Cantidad original de la venta (solo en modo edición)
}
