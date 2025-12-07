import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  OpcionesCatalogoDTO,
  ModeloDTO,
  ApiModeloDTO,
  MarcaDTO,
  CategoriaDTO,
  CorteDTO,
  TallaDTO,
  ColorDTO,
} from '../models/catalogo-admin.models';

@Injectable({
  providedIn: 'root',
})
export class CatalogoAdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * GET /api/catalogo/opciones
   * Obtiene todas las opciones para los filtros (marcas, categorías, cortes, etc.)
   */
  getOpciones(): Observable<OpcionesCatalogoDTO> {
    return this.http.get<OpcionesCatalogoDTO>(`${this.apiUrl}/catalogo/opciones`);
  }

  /**
   * GET /api/catalogo/modelo
   * Obtiene la lista completa de modelos con todos sus detalles
   */
  getModelos(): Observable<ModeloDTO[]> {
    return this.http.get<ApiModeloDTO[]>(`${this.apiUrl}/catalogo/modelo`).pipe(
      map((modelos) =>
        modelos.map((modelo) => ({
          id: modelo.id,
          nombre: modelo.nombre,
          marca: modelo.marca,
          categoria: modelo.categoria,
          corte: modelo.corte,
          colores: modelo.colores.map((color) => ({
            id: color.id,
            fotoUrl: color.foto_url, // snake_case → camelCase
            color: color.color,
            variantes: color.variantes,
          })),
        }))
      )
    );
  }

  /**
   * GET /api/catalogo/modelo/{id}
   * Obtiene un modelo específico por ID
   */
  getModeloById(id: number): Observable<ModeloDTO> {
    return this.http.get<any>(`${this.apiUrl}/catalogo/modelo/${id}`).pipe(
      map((modelo) => ({
        id: modelo.id,
        nombre: modelo.nombre,
        marca: modelo.marca,
        categoria: modelo.categoria,
        corte: modelo.corte,
        colores: modelo.colores.map((color: any) => ({
          id: color.id,
          fotoUrl: color.foto_url || color.fotoUrl,
          color: color.color,
          variantes: color.variantes,
        })),
      }))
    );
  }

  /**
   * POST /api/catalogo/modelo
   * Crea un nuevo modelo
   */
  createModelo(modelo: any): Observable<ModeloDTO> {
    return this.http.post<ModeloDTO>(`${this.apiUrl}/catalogo/modelo`, modelo);
  }

  /**
   * PUT /api/catalogo/modelo/{id}
   * Actualiza un modelo existente
   */
  updateModelo(id: number, modelo: any): Observable<ModeloDTO> {
    return this.http.put<ModeloDTO>(`${this.apiUrl}/catalogo/modelo/${id}`, {
      ...modelo,
      id_modelo: id,
    });
  }

  /**
   * DELETE /api/catalogo/modelo/{id}
   * Elimina un modelo
   */
  deleteModelo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/catalogo/modelo/${id}`);
  }

  // ========== MARCAS ==========
  /**
   * POST /api/catalogo/marcas
   * Crea una nueva marca
   */
  createMarca(nombre: string): Observable<MarcaDTO> {
    return this.http.post<MarcaDTO>(`${this.apiUrl}/catalogo/marcas`, { nombre });
  }

  // ========== CATEGORÍAS ==========
  /**
   * POST /api/catalogo/categorias
   * Crea una nueva categoría
   */
  createCategoria(nombre: string): Observable<CategoriaDTO> {
    return this.http.post<CategoriaDTO>(`${this.apiUrl}/catalogo/categorias`, { nombre });
  }

  // ========== CORTES ==========
  /**
   * POST /api/catalogo/cortes
   * Crea un nuevo corte
   */
  createCorte(nombre: string): Observable<CorteDTO> {
    return this.http.post<CorteDTO>(`${this.apiUrl}/catalogo/cortes`, { nombre });
  }

  // ========== TALLAS ==========
  /**
   * POST /api/catalogo/tallas
   * Crea una nueva talla
   */
  createTalla(nombre: string): Observable<TallaDTO> {
    return this.http.post<TallaDTO>(`${this.apiUrl}/catalogo/tallas`, { nombre });
  }

  // ========== COLORES ==========
  /**
   * POST /api/catalogo/colores
   * Crea un nuevo color
   */
  createColor(nombre: string, codigoHex: string): Observable<ColorDTO> {
    return this.http.post<ColorDTO>(`${this.apiUrl}/catalogo/colores`, {
      nombre,
      codigoHex,
    });
  }
}
