// Modelos para el módulo de Recepciones (Drops)

export interface DetalleDrop {
  idDetalleRecepcion?: number;
  idVariante: number;
  cantidad: number;
  idModelo?: number; // Opcional para visualización al consultar
}

export interface Drop {
  idRecepcion?: number;
  fecha: Date | string;
  idSucursal: number;
  estado?: boolean; // true=activa, false=anulada
  detalles?: DetalleDrop[]; // Opcional: solo viene en getById, no en listado
  totalItems?: number; // Total calculado en backend (solo en listado)
}

export interface DropRequest {
  idSucursal: number;
  detalles: {
    idVariante: number;
    cantidad: number;
    idModelo?: number; // Requerido para actualización
  }[];
}

// Modelos para el catálogo del selector
export interface CatalogoItemDrop {
  idModelo: number;
  nombreModelo: string;
  nombreMarca: string;
  nombreCategoria: string;
  fotoPortada: string;
}

export interface TallaDropDetalle {
  idVariante: number;
  nombreTalla: string;
}

export interface ColorDropDetalle {
  nombreColor: string;
  codigoHex: string;
  fotoUrl: string;
  tallas: TallaDropDetalle[];
}

export interface ModeloDetalleDrop {
  idModelo: number;
  nombreModelo: string;
  nombreMarca: string;
  nombreCategoria: string;
  nombreCorte: string;
  colores: ColorDropDetalle[];
}

// Item del carrito para drops
export interface DropCartItem {
  idVariante: number;
  idModelo: number;
  nombreModelo: string;
  nombreMarca: string;
  nombreColor: string;
  nombreTalla: string;
  fotoUrl: string;
  cantidad: number;
}
