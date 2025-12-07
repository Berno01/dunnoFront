import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'ventas',
    pathMatch: 'full',
  },
  {
    path: 'ventas',
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
    path: '**',
    redirectTo: 'ventas',
  },
];
