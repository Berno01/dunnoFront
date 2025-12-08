import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: '',
    redirectTo: 'ventas',
    pathMatch: 'full',
  },
  {
    path: 'ventas',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/ventas/components/sales-list/sales-list.component').then(
            (m) => m.SalesListComponent
          ),
      },
      {
        path: 'nueva',
        loadComponent: () =>
          import('./features/ventas/layout/ventas-layout.component').then(
            (m) => m.VentasLayoutComponent
          ),
      },
      {
        path: 'editar/:id',
        loadComponent: () =>
          import('./features/ventas/layout/ventas-layout.component').then(
            (m) => m.VentasLayoutComponent
          ),
      },
    ],
  },
  {
    path: 'catalogo',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/catalogo/components/catalogo-list/catalogo-list.component').then(
            (m) => m.CatalogoListComponent
          ),
      },
      {
        path: 'nuevo',
        loadComponent: () =>
          import('./features/catalogo/components/catalogo-form/catalogo-form.component').then(
            (m) => m.CatalogoFormComponent
          ),
      },
      {
        path: 'editar/:id',
        loadComponent: () =>
          import('./features/catalogo/components/catalogo-form/catalogo-form.component').then(
            (m) => m.CatalogoFormComponent
          ),
      },
    ],
  },
  {
    path: 'drops',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/drops/components/drops-list/drops-list.component').then(
            (m) => m.DropsListComponent
          ),
      },
      {
        path: 'nueva',
        loadComponent: () =>
          import('./features/drops/layout/drops-layout.component').then(
            (m) => m.DropsLayoutComponent
          ),
      },
      {
        path: 'editar/:id',
        loadComponent: () =>
          import('./features/drops/layout/drops-layout.component').then(
            (m) => m.DropsLayoutComponent
          ),
      },
    ],
  },
  {
    path: 'inventario',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/inventario/components/inventario-list/inventario-list.component').then(
        (m) => m.InventarioListComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'ventas',
  },
];
