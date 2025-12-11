import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { VentaDTO } from '../models/venta.models';

@Injectable({
  providedIn: 'root',
})
export class VentasService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  createSale(venta: VentaDTO): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/venta`, venta);
  }

  getSales(idSucursal?: number, fecha?: string, fecha_fin?: string): Observable<VentaDTO[]> {
    let params: any = {};
    if (idSucursal !== undefined && idSucursal !== null) {
      params.idSucursal = idSucursal.toString();
    }
    if (fecha) {
      params.fecha = fecha;
    }
    if (fecha_fin) {
      params.fecha_fin = fecha_fin;
    }
    return this.http
      .get<any[]>(`${this.apiUrl}/venta`, { params })
      .pipe(map((sales) => sales.map((sale) => this.mapVentaFromApi(sale))));
  }

  getSaleById(id: number): Observable<VentaDTO> {
    return this.http
      .get<any>(`${this.apiUrl}/venta/${id}`)
      .pipe(map((sale) => this.mapVentaFromApi(sale)));
  }

  updateSale(id: number, venta: VentaDTO): Observable<VentaDTO> {
    return this.http
      .put<any>(`${this.apiUrl}/venta/${id}`, venta)
      .pipe(map((sale) => this.mapVentaFromApi(sale)));
  }

  deleteSale(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/venta/${id}`);
  }

  activateSale(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/venta/${id}/activar`, {});
  }

  // Mapeo snake_case -> camelCase
  private mapVentaFromApi(sale: any): VentaDTO {
    return {
      id_venta: sale.id_venta ?? sale.idVenta,
      id_sucursal: sale.id_sucursal ?? sale.idSucursal,
      id_usuario: sale.id_usuario ?? sale.idUsuario,
      username: sale.username,
      total: sale.total,
      descuento: sale.descuento ?? 0,
      tipo_descuento: sale.tipo_descuento ?? sale.tipoDescuento ?? 'SIN DESCUENTO',
      monto_efectivo: sale.monto_efectivo ?? sale.montoEfectivo ?? 0,
      monto_qr: sale.monto_qr ?? sale.montoQr ?? 0,
      monto_tarjeta: sale.monto_tarjeta ?? sale.montoTarjeta ?? 0,
      monto_giftcard: sale.monto_giftcard ?? sale.montoGiftcard ?? 0,
      tipo_venta: sale.tipo_venta ?? sale.tipoVenta ?? 'LOCAL',
      fecha_venta: sale.fecha_venta ?? sale.fechaVenta,
      estado_venta: sale.estado_venta ?? sale.estadoVenta ?? true,
      detalle_venta: (sale.detalle_venta ?? sale.detalleVenta ?? []).map((detalle: any) => ({
        id_variante: detalle.id_variante ?? detalle.idVariante,
        id_modelo: detalle.id_modelo ?? detalle.idModelo,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario ?? detalle.precioUnitario,
        total: detalle.total,
      })),
    };
  }
}
