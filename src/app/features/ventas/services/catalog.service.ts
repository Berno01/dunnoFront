import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ColorDTO,
  DetallePrendaDTO,
  ResumenPrendaDTO,
  TallaDTO,
} from '../../../core/models/catalogo.models';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getCatalog(idSucursal: number): Observable<ResumenPrendaDTO[]> {
    return this.http
      .get<ApiResumenPrendaDTO[]>(`${this.apiUrl}/inventario/catalogo`, {
        params: { idSucursal: idSucursal.toString() },
      })
      .pipe(map((items) => items.map((item) => this.mapToResumenPrenda(item))));
  }

  getProductDetail(idModelo: number, idSucursal: number): Observable<DetallePrendaDTO> {
    return this.http
      .get<ApiDetallePrendaDTO>(`${this.apiUrl}/inventario/catalogo/${idModelo}`, {
        params: { idSucursal: idSucursal.toString() },
      })
      .pipe(map((item) => this.mapToDetallePrenda(item)));
  }

  private mapToResumenPrenda(item: ApiResumenPrendaDTO): ResumenPrendaDTO {
    return {
      idModelo: item.idModelo ?? item.id_modelo ?? 0,
      nombreModelo: item.nombreModelo ?? item.nombre_modelo ?? '',
      nombreMarca: item.nombreMarca ?? item.nombre_marca ?? '',
      nombreCategoria: item.nombreCategoria ?? item.nombre_categoria ?? '',
      fotoPortada: item.fotoPortada ?? item.foto_portada ?? '',
      stockTotal: item.stockTotal ?? item.stock_total ?? 0,
      pocasUnidades: item.pocasUnidades ?? item.pocas_unidades ?? false,
    };
  }

  private mapToDetallePrenda(item: ApiDetallePrendaDTO): DetallePrendaDTO {
    return {
      idModelo: item.idModelo ?? item.id_modelo ?? 0,
      nombreModelo: item.nombreModelo ?? item.nombre_modelo ?? '',
      nombreMarca: item.nombreMarca ?? item.nombre_marca ?? '',
      nombreCategoria: item.nombreCategoria ?? item.nombre_categoria ?? '',
      nombreCorte: item.nombreCorte ?? item.nombre_corte ?? '',
      stockTotalSucursal: item.stockTotalSucursal ?? item.stock_total_sucursal ?? 0,
      colores: (item.colores ?? []).map((color) => this.mapToColor(color)),
    };
  }

  private mapToColor(color: ApiColorDTO): ColorDTO {
    return {
      nombreColor: color.nombreColor ?? color.nombre_color ?? '',
      codigoHex: color.codigoHex ?? color.codigo_hex ?? '#000000',
      fotoUrl: color.fotoUrl ?? color.foto_url ?? '',
      tallas: (color.tallas ?? []).map((talla) => this.mapToTalla(talla)),
    };
  }

  private mapToTalla(talla: ApiTallaDTO): TallaDTO {
    return {
      idVariante: talla.idVariante ?? talla.id_variante ?? 0,
      nombreTalla: talla.nombreTalla ?? talla.nombre_talla ?? '',
      stock: talla.stock ?? 0,
    };
  }
}

type ApiResumenPrendaDTO = {
  idModelo?: number;
  id_modelo?: number;
  nombreModelo?: string;
  nombre_modelo?: string;
  nombreMarca?: string;
  nombre_marca?: string;
  nombreCategoria?: string;
  nombre_categoria?: string;
  fotoPortada?: string;
  foto_portada?: string;
  stockTotal?: number;
  stock_total?: number;
  pocasUnidades?: boolean;
  pocas_unidades?: boolean;
};

type ApiDetallePrendaDTO = {
  idModelo?: number;
  id_modelo?: number;
  nombreModelo?: string;
  nombre_modelo?: string;
  nombreMarca?: string;
  nombre_marca?: string;
  nombreCategoria?: string;
  nombre_categoria?: string;
  nombreCorte?: string;
  nombre_corte?: string;
  stockTotalSucursal?: number;
  stock_total_sucursal?: number;
  colores?: ApiColorDTO[];
};

type ApiColorDTO = {
  nombreColor?: string;
  nombre_color?: string;
  codigoHex?: string;
  codigo_hex?: string;
  fotoUrl?: string;
  foto_url?: string;
  tallas?: ApiTallaDTO[];
};

type ApiTallaDTO = {
  idVariante?: number;
  id_variante?: number;
  nombreTalla?: string;
  nombre_talla?: string;
  stock?: number;
};
