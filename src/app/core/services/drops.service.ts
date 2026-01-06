import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';
import {
  Drop,
  DropRequest,
  CatalogoItemDrop,
  ModeloDetalleDrop,
  ColorDropDetalle,
  TallaDropDetalle,
} from '../models/drops.models';

@Injectable({
  providedIn: 'root',
})
export class DropsService {
  private http = inject(HttpClient);
  private sessionService = inject(SessionService);
  private apiUrl = environment.apiUrl;

  /**
   * Obtiene el header con el idUsuario de la sesión
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      idUsuario: this.sessionService.userId().toString(),
    });
  }

  /**
   * Obtiene todas las recepciones con filtros opcionales
   * @param filters - Filtros opcionales (fecha, idSucursal)
   */
  getDrops(filters?: {
    fecha?: string;
    fecha_fin?: string;
    idSucursal?: number;
  }): Observable<Drop[]> {
    let params: any = {};
    if (filters?.fecha) {
      params.fecha = filters.fecha;
    }
    if (filters?.fecha_fin) {
      params.fecha_fin = filters.fecha_fin;
    }
    if (filters?.idSucursal !== undefined && filters?.idSucursal !== null) {
      params.idSucursal = filters.idSucursal.toString();
    }

    return this.http
      .get<any[]>(`${this.apiUrl}/drops`, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(map((drops) => drops.map((drop) => this.mapDropFromApi(drop))));
  }

  /**
   * Obtiene una recepción por ID
   * @param id - ID de la recepción
   */
  getDropById(id: number): Observable<Drop> {
    return this.http
      .get<any>(`${this.apiUrl}/drops/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(map((drop) => this.mapDropFromApi(drop)));
  }

  /**
   * Crea una nueva recepción
   * @param drop - Datos de la recepción a crear
   */
  createDrop(drop: DropRequest): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/drops`, drop, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Actualiza una recepción existente
   * @param id - ID de la recepción
   * @param drop - Datos actualizados
   */
  updateDrop(id: number, drop: DropRequest): Observable<Drop> {
    return this.http
      .put<any>(`${this.apiUrl}/drops/${id}`, drop, {
        headers: this.getHeaders(),
      })
      .pipe(map((drop) => this.mapDropFromApi(drop)));
  }

  /**
   * Elimina una recepción
   * @param id - ID de la recepción a eliminar
   */
  deleteDrop(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/drops/${id}`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Obtiene el catálogo completo de modelos para el selector
   */
  getCatalogoParaSelector(): Observable<CatalogoItemDrop[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/drops/catalogo`, {
        headers: this.getHeaders(),
      })
      .pipe(map((items) => items.map((item) => this.mapCatalogoItemFromApi(item))));
  }

  /**
   * Obtiene el detalle de un modelo específico
   * @param idModelo - ID del modelo
   */
  getDetalleModelo(idModelo: number): Observable<ModeloDetalleDrop> {
    return this.http
      .get<any>(`${this.apiUrl}/drops/catalogo/${idModelo}`, {
        headers: this.getHeaders(),
      })
      .pipe(map((modelo) => this.mapModeloDetalleFromApi(modelo)));
  }

  // ==================== Mappers ====================

  /**
   * Mapea una recepción de la API (snake_case) a camelCase
   */
  private mapDropFromApi(drop: any): Drop {
    return {
      idRecepcion: drop.idRecepcion ?? drop.id_recepcion,
      fecha: drop.fecha,
      idSucursal: drop.idSucursal ?? drop.id_sucursal,
      estado: drop.estado ?? true,
      totalItems: drop.totalItems ?? drop.total_items, // Viene del backend (solo en listado)
      detalles: drop.detalles
        ? drop.detalles.map((detalle: any) => ({
            idDetalleRecepcion: detalle.idDetalleRecepcion ?? detalle.id_detalle_recepcion,
            idVariante: detalle.idVariante ?? detalle.id_variante,
            cantidad: detalle.cantidad,
            idModelo: detalle.idModelo ?? detalle.id_modelo,
          }))
        : undefined, // Solo mapear si existen (getById)
    };
  }

  /**
   * Mapea un item del catálogo de la API a camelCase
   */
  private mapCatalogoItemFromApi(item: any): CatalogoItemDrop {
    return {
      idModelo: item.idModelo ?? item.id_modelo ?? 0,
      nombreModelo: item.nombreModelo ?? item.nombre_modelo ?? '',
      nombreMarca: item.nombreMarca ?? item.nombre_marca ?? '',
      nombreCategoria: item.nombreCategoria ?? item.nombre_categoria ?? '',
      fotoPortada: item.fotoPortada ?? item.foto_portada ?? '',
    };
  }

  /**
   * Mapea el detalle de un modelo de la API a camelCase
   */
  private mapModeloDetalleFromApi(modelo: any): ModeloDetalleDrop {
    return {
      idModelo: modelo.idModelo ?? modelo.id_modelo ?? 0,
      nombreModelo: modelo.nombreModelo ?? modelo.nombre_modelo ?? '',
      nombreMarca: modelo.nombreMarca ?? modelo.nombre_marca ?? '',
      nombreCategoria: modelo.nombreCategoria ?? modelo.nombre_categoria ?? '',
      nombreCorte: modelo.nombreCorte ?? modelo.nombre_corte ?? '',
      colores: (modelo.colores ?? []).map((color: any) => this.mapColorFromApi(color)),
    };
  }

  /**
   * Mapea un color del detalle de modelo
   */
  private mapColorFromApi(color: any): ColorDropDetalle {
    return {
      nombreColor: color.nombreColor ?? color.nombre_color ?? '',
      codigoHex: color.codigoHex ?? color.codigo_hex ?? '#000000',
      fotoUrl: color.fotoUrl ?? color.foto_url ?? '',
      tallas: (color.tallas ?? []).map((talla: any) => this.mapTallaFromApi(talla)),
    };
  }

  /**
   * Mapea una talla del detalle de modelo
   */
  private mapTallaFromApi(talla: any): TallaDropDetalle {
    return {
      idVariante: talla.idVariante ?? talla.id_variante ?? 0,
      nombreTalla: talla.nombreTalla ?? talla.nombre_talla ?? '',
    };
  }
}
