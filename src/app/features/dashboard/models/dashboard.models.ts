export interface DashboardKPIs {
  total_ventas: number;
  cantidad_ventas: number;
  ticket_promedio: number;
  unidades_vendidas: number;
}

export interface VentasPorHora {
  hora: number;
  cantidad: number;
}

export interface VentasPorCategoria {
  categoria: string;
  cantidad: number;
}

export interface MetodoPago {
  metodo: string;
  cantidad: number;
  porcentaje?: number; // Agregado para UI
}

export interface DistribucionTalla {
  talla: string;
  cantidad: number;
}

export interface TopProducto {
  nombre_modelo: string;
  subtitulo: string;
  cantidad_vendida: number;
  stock_actual: number;
  foto_url: string;
}

export interface VentaExportRow {
  fecha_venta: string;
  cantidad: number;
  nombre_modelo: string;
  categoria: string;
  marca: string;
  corte: string;
  precio_unitario: number;
  total_detalle: number;
  id_venta: number;
  monto_efectivo: number;
  monto_qr: number;
  monto_tarjeta: number;
  monto_giftcard: number;
  total_venta: number;
  descuento: number;
  id_sucursal: number;
  nombre_sucursal: string;
}

export interface DashboardFilters {
  idSucursal?: number;
  fechaInicio?: string;
  fechaFin?: string;
}
