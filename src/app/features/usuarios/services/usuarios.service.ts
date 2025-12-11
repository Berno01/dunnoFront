import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardUsuariosResponse, UsuariosFilters } from '../models/usuarios.models';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard/sales-rep-analysis`;

  constructor() {}

  private getHeaders(usuarioId: number): HttpHeaders {
    return new HttpHeaders().set('X-Usuario-Id', usuarioId.toString());
  }

  private getParams(filters: UsuariosFilters): HttpParams {
    let params = new HttpParams()
      .set('startDate', filters.startDate)
      .set('endDate', filters.endDate);

    if (filters.salesRepId) {
      params = params.set('salesRepId', filters.salesRepId.toString());
    }

    return params;
  }

  getDashboardData(
    usuarioId: number,
    filters: UsuariosFilters
  ): Observable<DashboardUsuariosResponse> {
    return this.http.get<DashboardUsuariosResponse>(this.apiUrl, {
      headers: this.getHeaders(usuarioId),
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
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hoy.getDate() - 7);
    return {
      fechaInicio: this.formatDate(hace7Dias),
      fechaFin: this.formatDate(hoy),
    };
  }
}
