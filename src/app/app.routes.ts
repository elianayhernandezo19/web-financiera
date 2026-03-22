import { Routes } from '@angular/router';

/**
 * Rutas de la aplicación.
 *
 * DashboardComponent se carga mediante `loadComponent()` (lazy loading):
 * Angular genera un chunk separado que solo se descarga cuando el usuario
 * navega a '/dashboard', reduciendo el bundle inicial.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
    title: 'Dashboard — Análisis de Algoritmos · UQ',
  },
  // Catch-all: redirige rutas desconocidas al dashboard
  { path: '**', redirectTo: 'dashboard' },
];
