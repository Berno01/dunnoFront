import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../core/services/session.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="sticky top-0 z-50 bg-white border-b border-gray-200 h-20">
      <div class="max-w-full mx-auto px-4 md:px-6 h-full flex items-center justify-between">
        <!-- Logo (Izquierda) -->
        <div class="flex items-center">
          <img
            src="/assets/images/logo.png"
            alt="Logo"
            class="h-10 md:h-14"
            onerror="this.src='/assets/images/logo-dunno.jpg'"
          />
        </div>

        <!-- Botón Hamburguesa (Mobile) -->
        <button
          class="md:hidden flex items-center justify-center w-10 h-10 text-gray-700 hover:bg-gray-100 rounded transition-colors"
          (click)="toggleMenu()"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            @if (!menuOpen()) {
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
            } @else {
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
            }
          </svg>
        </button>

        <!-- Navegación (Centro - Desktop) -->
        <div class="hidden md:flex items-center gap-2">
          <!-- Dashboard (Solo Admin) -->
          @if (isAdmin()) {
          <a
            routerLink="/dashboard"
            routerLinkActive="bg-black text-white"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-colors text-gray-700 hover:bg-gray-100"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              ></path>
            </svg>
            <span>DASHBOARD</span>
          </a>
          }

          <!-- Ventas (Todos) -->
          <a
            routerLink="/ventas"
            routerLinkActive="bg-black text-white"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-colors text-gray-700 hover:bg-gray-100"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
            <span>VENTAS</span>
          </a>

          <!-- Catálogo (Solo Admin) -->
          @if (isAdmin()) {
          <a
            routerLink="/catalogo"
            routerLinkActive="bg-black text-white"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-colors text-gray-700 hover:bg-gray-100"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              ></path>
            </svg>
            <span>CATÁLOGO</span>
          </a>
          }

          <!-- Drops (Solo admins) -->
           @if (isAdmin()) {
          <a
            routerLink="/drops"
            routerLinkActive="bg-black text-white"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-colors text-gray-700 hover:bg-gray-100"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              ></path>
            </svg>
            <span>DROPS</span>
          </a>

          <!-- Inventario (Solo Admin) -->
          
          <a
            routerLink="/inventario"
            routerLinkActive="bg-black text-white"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-colors text-gray-700 hover:bg-gray-100"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              ></path>
            </svg>
            <span>INVENTARIO</span>
          </a>
          }
        </div>

        <!-- Info Sucursal y Logout (Derecha - Desktop) -->
        <div class="hidden md:flex items-center gap-4">
          <span class="text-sm font-medium text-gray-700">
            Sucursal: {{ sessionService.sucursalNombre() }}
          </span>
          <button
            (click)="logout()"
            class="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
          >
            SALIR
          </button>
        </div>
      </div>

      <!-- Menú Mobile (Dropdown) -->
      @if (menuOpen()) {
      <div
        class="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40"
      >
        <div class="px-4 py-4 space-y-2">
          <!-- Dashboard -->
          @if (isAdmin()) {
          <a
            routerLink="/dashboard"
            routerLinkActive="bg-black text-white"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-3 px-4 py-3 rounded-md font-medium text-sm transition-colors text-gray-700 hover:bg-gray-100"
            (click)="closeMenu()"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              ></path>
            </svg>
            <span>DASHBOARD</span>
          </a>
          }

          <!-- Ventas -->
          <a
            routerLink="/ventas"
            routerLinkActive="bg-black text-white"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-3 px-4 py-3 rounded-md font-medium text-sm transition-colors text-gray-700 hover:bg-gray-100"
            (click)="closeMenu()"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
            <span>VENTAS</span>
          </a>

          <!-- Catálogo -->
          @if (isAdmin()) {
          <a
            routerLink="/catalogo"
            routerLinkActive="bg-black text-white"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-3 px-4 py-3 rounded-md font-medium text-sm transition-colors text-gray-700 hover:bg-gray-100"
            (click)="closeMenu()"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              ></path>
            </svg>
            <span>CATÁLOGO</span>
          </a>
          }

          <!-- Drops -->
          <a
            routerLink="/drops"
            routerLinkActive="bg-black text-white"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-3 px-4 py-3 rounded-md font-medium text-sm transition-colors text-gray-700 hover:bg-gray-100"
            (click)="closeMenu()"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              ></path>
            </svg>
            <span>DROPS</span>
          </a>

          <!-- Inventario -->
          @if (isAdmin()) {
          <a
            routerLink="/inventario"
            routerLinkActive="bg-black text-white"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-3 px-4 py-3 rounded-md font-medium text-sm transition-colors text-gray-700 hover:bg-gray-100"
            (click)="closeMenu()"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              ></path>
            </svg>
            <span>INVENTARIO</span>
          </a>
          }

          <!-- Info Sucursal y Logout (Mobile) -->
          <div class="pt-3 mt-3 border-t border-gray-200 flex flex-col gap-2">
            <span class="text-sm font-medium text-gray-700 px-4">
              Sucursal: {{ sessionService.sucursalNombre() }}
            </span>
            <button
              (click)="logout()"
              class="text-sm font-medium text-red-600 hover:text-red-800 transition-colors px-4 text-left"
            >
              SALIR
            </button>
          </div>
        </div>
      </div>
      }
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class NavbarComponent {
  sessionService = inject(SessionService);
  authService = inject(AuthService);
  menuOpen = signal(false);

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  logout() {
    this.authService.logout();
  }

  isAdmin() {
    return this.sessionService.rol() === 'ADMIN';
  }
}
