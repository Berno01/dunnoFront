import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario, LoginResponse } from '../models/auth.models';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private sessionService = inject(SessionService);

  private apiUrl = `${environment.apiUrl}/auth`;
  private readonly USER_KEY = 'dunno_user';

  constructor() {
    this.checkLocalStorage();
  }

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        console.log('Respuesta del Backend:', response); // DEBUG

        // Lógica específica para asignar sucursal según el rol
        let idSucursal = 1; // Default para ADMIN (Tarija)
        let nombreSucursal = 'Tarija';

        if (response.rol === 'VENDEDOR') {
          // Si es vendedor, usamos la sucursal que viene del backend
          if (response.id_sucursal) {
            idSucursal = response.id_sucursal;
            // Si viene el nombre, lo usamos. Si no, lo mapeamos según el ID.
            nombreSucursal = response.nombre_sucursal || this.getSucursalName(idSucursal);
          }
        }

        const usuario: Usuario = {
          id_usuario: response.id_usuario,
          username: response.username,
          rol: response.rol,
          nombre_completo: response.nombre_completo,
          id_sucursal: idSucursal,
          nombre_sucursal: nombreSucursal,
          token: response.token,
        };

        if (usuario.id_usuario) {
          this.saveUserToStorage(usuario);
          this.sincronizarVariablesGlobales(usuario);
        } else {
          console.error('ALERTA: Respuesta inválida, falta id_usuario', response);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.USER_KEY);
  }

  getUser(): Usuario | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  private getSucursalName(id: number): string {
    const sucursales: { [key: number]: string } = {
      1: 'Tarija',
      2: 'Cochabamba',
      3: 'Santa Cruz',
    };
    return sucursales[id] || 'Sucursal Desconocida';
  }

  private saveUserToStorage(usuario: Usuario) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
  }

  private checkLocalStorage() {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        const usuario: Usuario = JSON.parse(userStr);
        this.sincronizarVariablesGlobales(usuario);
      } catch (e) {
        console.error('Error parsing user from local storage', e);
        localStorage.removeItem(this.USER_KEY);
      }
    }
  }

  private sincronizarVariablesGlobales(usuario: Usuario) {
    // Asignar valores a SessionService
    const nombreSucursal = usuario.nombre_sucursal || 'Tarija';
    const idSucursal = usuario.id_sucursal || 1;

    this.sessionService.initSession(usuario.id_usuario, idSucursal, nombreSucursal, usuario.rol);
  }
}
