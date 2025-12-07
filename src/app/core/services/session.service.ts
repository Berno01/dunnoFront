import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  // Valores hardcoded para desarrollo
  // La sucursal que viene de la BD del usuario (ADMIN también tiene una)
  readonly userId = signal<number>(1);
  readonly sucursalId = signal<number>(1); // Tarija por defecto
  readonly sucursalNombre = signal<string>('Tarija');
  readonly rol = signal<string>('ADMIN');

  // Guardar la sucursal original del usuario (la que tiene en BD al loguearse)
  // Esta NUNCA cambia, es la sucursal "base" del usuario
  private readonly userOriginalSucursalId = signal<number>(1); // Tarija
  private readonly userOriginalSucursalNombre = signal<string>('Tarija');

  constructor() {}

  // Método para cambiar la sucursal activa
  setSucursal(id: number, nombre: string) {
    this.sucursalId.set(id);
    this.sucursalNombre.set(nombre);
  }

  // Método para restaurar la sucursal original del usuario
  restoreOriginalSucursal() {
    this.sucursalId.set(this.userOriginalSucursalId());
    this.sucursalNombre.set(this.userOriginalSucursalNombre());
  }
}
