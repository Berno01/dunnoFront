export interface ResumenPrendaDTO {
  idModelo: number;
  nombreModelo: string;
  nombreMarca: string;
  nombreCategoria: string;
  fotoPortada: string;
  stockTotal: number;
  pocasUnidades: boolean;
}

export interface TallaDTO {
  idVariante: number;
  nombreTalla: string;
  stock: number;
}

export interface ColorDTO {
  nombreColor: string;
  codigoHex: string;
  fotoUrl: string;
  tallas: TallaDTO[];
}

export interface DetallePrendaDTO {
  idModelo: number;
  nombreModelo: string;
  nombreMarca: string;
  nombreCategoria: string;
  nombreCorte: string;
  stockTotalSucursal: number;
  colores: ColorDTO[];
}
