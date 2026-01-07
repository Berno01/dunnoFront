// Modelos para el módulo de Catálogo Administrativo

export interface MarcaDTO {
  id: number;
  nombre: string;
}

export interface CategoriaDTO {
  id: number;
  nombre: string;
}

export interface CorteDTO {
  id: number;
  nombre: string;
}

export interface TallaDTO {
  id: number;
  nombre: string;
}

export interface ColorDTO {
  id: number;
  nombre: string;
  codigoHex: string; // Cambiado de codigo_hex a codigoHex para coincidir con el backend
}

export interface OpcionesCatalogoDTO {
  marcas: MarcaDTO[];
  categorias: CategoriaDTO[];
  cortes: CorteDTO[];
  tallas: TallaDTO[];
  colores: ColorDTO[];
}

// Modelos para los Modelos de productos
export interface VarianteDTO {
  id: number;
  talla: TallaDTO;
}

export interface ColorModeloDTO {
  id: number;
  fotoUrl: string;
  color: ColorDTO;
  variantes?: VarianteDTO[]; // Opcional: solo viene en detalle, no en listado
}

export interface ModeloDTO {
  id: number;
  nombre: string;
  precio: number;
  marca: MarcaDTO;
  categoria: CategoriaDTO;
  corte: CorteDTO;
  colores: ColorModeloDTO[];
}

// Mapeo de snake_case a camelCase
export interface ApiColorModeloDTO {
  id: number;
  foto_url: string;
  color: ColorDTO;
  variantes?: VarianteDTO[]; // Opcional: solo viene en detalle
}

export interface ApiModeloDTO {
  id: number;
  nombre: string;
  precio: number;
  marca: MarcaDTO;
  categoria: CategoriaDTO;
  corte: CorteDTO;
  colores: ApiColorModeloDTO[];
}
