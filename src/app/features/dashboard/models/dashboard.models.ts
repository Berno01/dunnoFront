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

export interface DashboardFilters {
  idSucursal?: number;
  fechaInicio?: string;
  fechaFin?: string;
}
