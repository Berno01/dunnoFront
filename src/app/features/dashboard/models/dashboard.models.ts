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
  categoria?: string;
  limit?: number;
}

export interface InventoryReportFilters {
  idSucursal: number | null;
  idCategoria: number | null;
  idMarca: number | null;
  idCorte: number | null;
  idColor: number | null;
  idTalla: number | null;
}

export interface InventoryReportRow {
  id_sucursal: number;
  nombre_sucursal: string;
  id_modelo: number;
  nombre_modelo: string;
  precio: number;
  id_categoria: number | null;
  categoria: string;
  id_marca: number | null;
  marca: string;
  id_corte: number | null;
  corte: string;
  id_modelo_color: number;
  id_color: number;
  color: string;
  codigo_hex: string | null;
  foto_url: string | null;
  id_variante: number;
  id_talla: number;
  talla: string;
  stock: number;
}

export interface InventoryReportOption {
  id: number;
  nombre: string;
  codigo_hex?: string | null;
}

export interface InventoryReportOptions {
  sucursales: InventoryReportOption[];
  categorias: InventoryReportOption[];
  marcas: InventoryReportOption[];
  cortes: InventoryReportOption[];
  colores: InventoryReportOption[];
  tallas: InventoryReportOption[];
}
