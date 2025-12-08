import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DashboardKPIs,
  VentasPorHora,
  VentasPorCategoria,
  MetodoPago,
  DistribucionTalla,
  TopProducto,
  DashboardFilters,
} from '../models/dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor() {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders().set('idUsuario', '1');
  }

  private getParams(filters?: DashboardFilters): HttpParams {
    let params = new HttpParams();
    if (filters) {
      if (filters.idSucursal) params = params.set('idSucursal', filters.idSucursal.toString());
      if (filters.fechaInicio) params = params.set('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params = params.set('fechaFin', filters.fechaFin);
    }
    return params;
  }

  getKPIs(filters?: DashboardFilters): Observable<DashboardKPIs> {
    return this.http.get<DashboardKPIs>(`${this.apiUrl}/kpis`, {
      headers: this.getHeaders(),
      params: this.getParams(filters),
    });
  }

  getVentasPorHora(filters?: DashboardFilters): Observable<VentasPorHora[]> {
    return this.http.get<VentasPorHora[]>(`${this.apiUrl}/ventas-por-hora`, {
      headers: this.getHeaders(),
      params: this.getParams(filters),
    });
  }

  getVentasPorCategoria(filters?: DashboardFilters): Observable<VentasPorCategoria[]> {
    return this.http.get<VentasPorCategoria[]>(`${this.apiUrl}/ventas-por-categoria`, {
      headers: this.getHeaders(),
      params: this.getParams(filters),
    });
  }

  getMetodosPago(filters?: DashboardFilters): Observable<MetodoPago[]> {
    return this.http.get<MetodoPago[]>(`${this.apiUrl}/metodos-pago`, {
      headers: this.getHeaders(),
      params: this.getParams(filters),
    });
  }

  getDistribucionTallas(filters?: DashboardFilters): Observable<DistribucionTalla[]> {
    return this.http.get<DistribucionTalla[]>(`${this.apiUrl}/distribucion-tallas`, {
      headers: this.getHeaders(),
      params: this.getParams(filters),
    });
  }

  getTopProductos(filters?: DashboardFilters): Observable<TopProducto[]> {
    return this.http.get<TopProducto[]>(`${this.apiUrl}/top-productos`, {
      headers: this.getHeaders(),
      params: this.getParams(filters),
    });
  }

  // Helpers de Fechas
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getRangoHoy(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    const fecha = this.formatDate(hoy);
    return { fechaInicio: fecha, fechaFin: fecha };
  }

  getRangoEsteMes(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return {
      fechaInicio: this.formatDate(inicio),
      fechaFin: this.formatDate(hoy),
    };
  }

  getRangoUltimos7Dias(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - 7);
    return {
      fechaInicio: this.formatDate(inicio),
      fechaFin: this.formatDate(hoy),
    };
  }
}
