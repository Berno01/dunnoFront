import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';
import {
  InventarioItem,
  InventarioDetalle,
  SucursalInventario,
  MatrizColorTalla,
} from '../models/inventario.models';

@Injectable({
  providedIn: 'root',
})
export class InventarioService {
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
   * Obtiene el inventario (resumen) con filtros opcionales
   * @param filters - Filtros opcionales (categoria, marca, etc)
   */
  getInventario(filters?: any): Observable<InventarioItem[]> {
    let params: any = {};

    // Agregar filtros si existen
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params[key] = filters[key].toString();
        }
      });
    }

    return this.http
      .get<any[]>(`${this.apiUrl}/inventario`, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(map((items) => items.map((item) => this.mapInventarioItemFromApi(item))));
  }

  /**
   * Obtiene el detalle completo del inventario de un modelo
   * Incluye matriz por sucursales con colores y tallas
   * @param idModelo - ID del modelo
   */
  getInventarioDetalle(idModelo: number): Observable<InventarioDetalle> {
    return this.http
      .get<any>(`${this.apiUrl}/inventario/${idModelo}`, {
        headers: this.getHeaders(),
      })
      .pipe(map((detalle) => this.mapInventarioDetalleFromApi(detalle)));
  }

  // ==================== Mappers ====================

  /**
   * Mapea un item del inventario de la API a camelCase
   */
  private mapInventarioItemFromApi(item: any): InventarioItem {
    return {
      id_modelo: item.id_modelo ?? item.idModelo ?? 0,
      nombre_modelo: item.nombre_modelo ?? item.nombreModelo ?? '',
      foto_portada: item.foto_portada ?? item.fotoPortada ?? '',
      categoria: item.categoria ?? '',
      marca: item.marca ?? '',
      corte: item.corte ?? '',
      total_stock_global: item.total_stock_global ?? item.totalStockGlobal ?? 0,
    };
  }

  /**
   * Mapea el detalle del inventario de la API
   */
  private mapInventarioDetalleFromApi(detalle: any): InventarioDetalle {
    return {
      id_modelo: detalle.id_modelo ?? detalle.idModelo ?? 0,
      colores_disponibles: detalle.colores_disponibles ?? detalle.coloresDisponibles ?? [],
      tallas_disponibles: detalle.tallas_disponibles ?? detalle.tallasDisponibles ?? [],
      sucursales: (detalle.sucursales ?? []).map((suc: any) =>
        this.mapSucursalInventarioFromApi(suc)
      ),
    };
  }

  /**
   * Mapea una sucursal de inventario
   */
  private mapSucursalInventarioFromApi(sucursal: any): SucursalInventario {
    return {
      id_sucursal: sucursal.id_sucursal ?? sucursal.idSucursal ?? 0,
      nombre_sucursal: sucursal.nombre_sucursal ?? sucursal.nombreSucursal ?? '',
      matriz_color_talla: this.mapMatrizColorTalla(
        sucursal.matriz_color_talla ?? sucursal.matrizColorTalla ?? {}
      ),
    };
  }

  /**
   * Mapea la matriz color-talla
   * Maneja casos donde pueden faltar combinaciones
   */
  private mapMatrizColorTalla(matriz: any): MatrizColorTalla {
    const result: MatrizColorTalla = {};

    // Si la matriz viene vacía o es null, retornar objeto vacío
    if (!matriz || typeof matriz !== 'object') {
      return result;
    }

    // Iterar sobre cada color
    Object.keys(matriz).forEach((color) => {
      result[color] = {};
      const tallasDelColor = matriz[color];

      if (tallasDelColor && typeof tallasDelColor === 'object') {
        // Iterar sobre cada talla del color
        Object.keys(tallasDelColor).forEach((talla) => {
          const variante = tallasDelColor[talla];

          if (variante && typeof variante === 'object') {
            result[color][talla] = {
              id_variante: variante.id_variante ?? variante.idVariante ?? 0,
              stock: variante.stock ?? 0,
              codigo_hex_color: variante.codigo_hex_color ?? variante.codigoHexColor ?? '#000000',
            };
          } else {
            // Si no existe la combinación, dejar como undefined
            result[color][talla] = undefined;
          }
        });
      }
    });

    return result;
  }
}
