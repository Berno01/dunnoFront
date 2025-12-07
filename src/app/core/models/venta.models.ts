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
  total: number; // calculado
  monto_efectivo: number;
  monto_qr: number;
  monto_tarjeta: number;
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
}
