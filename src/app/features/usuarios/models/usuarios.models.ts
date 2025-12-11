export interface VendedorRanking {
  id_usuario: number;
  nombre_completo: string;
  username: string;
  total_vendido: number;
  cantidad_ventas: number;
  posicion: number;
}

export interface AnalisisDescuentos {
  total_descontado: number;
  cantidad_descuentos: number;
  promedio_por_descuento: number;
  porcentaje_sobre_ventas_brutas: number;
}

export interface TopItemAPI {
  id: number;
  nombre: string;
  cantidad: number;
  porcentaje: number;
  posicion: number;
  codigo_hex?: string; // Solo para colores
}

export interface DashboardUsuariosResponse {
  ranking_vendedores: VendedorRanking[];
  analisis_descuentos: AnalisisDescuentos;
  top_categorias: TopItemAPI[];
  top_modelos: TopItemAPI[];
  top_colores: TopItemAPI[];
  distribucion_tallas: TopItemAPI[];
}

export interface UsuariosFilters {
  startDate: string;
  endDate: string;
  salesRepId?: number;
}
