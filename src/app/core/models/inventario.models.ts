// Modelos para el módulo de Inventario

/**
 * Detalle de una variante específica (Color + Talla)
 */
export interface DetalleVariante {
  id_variante: number;
  stock: number;
  codigo_hex_color: string;
}

/**
 * Matriz de inventario por Color y Talla
 * Es un objeto dinámico donde:
 * - Primera clave: Nombre del Color
 * - Segunda clave: Nombre de la Talla
 * - Valor: DetalleVariante (o undefined si no existe esa combinación)
 */
export interface MatrizColorTalla {
  [color: string]: {
    [talla: string]: DetalleVariante | undefined;
  };
}

/**
 * Inventario de una sucursal específica
 */
export interface SucursalInventario {
  id_sucursal: number; // 0 = Global
  nombre_sucursal: string;
  matriz_color_talla: MatrizColorTalla;
}

/**
 * Item de resumen del inventario (lista)
 */
export interface InventarioItem {
  id_modelo: number;
  nombre_modelo: string;
  foto_portada: string;
  categoria: string;
  marca: string;
  corte: string;
  total_stock_global: number;
}

/**
 * Detalle completo del inventario de un modelo
 * Incluye matriz por sucursales
 */
export interface InventarioDetalle {
  id_modelo: number;
  colores_disponibles: string[];
  tallas_disponibles: string[];
  sucursales: SucursalInventario[];
}

/**
 * Helper: Obtener detalle de variante de forma segura
 * Retorna stock 0 si no existe la combinación
 */
export function getDetalleVariante(
  matriz: MatrizColorTalla,
  color: string,
  talla: string
): DetalleVariante {
  const defaultVariante: DetalleVariante = {
    id_variante: 0,
    stock: 0,
    codigo_hex_color: '#000000',
  };

  if (!matriz || !matriz[color] || !matriz[color][talla]) {
    return defaultVariante;
  }

  return matriz[color][talla] || defaultVariante;
}

/**
 * Helper: Obtener stock de forma segura
 */
export function getStock(matriz: MatrizColorTalla, color: string, talla: string): number {
  return getDetalleVariante(matriz, color, talla).stock;
}
