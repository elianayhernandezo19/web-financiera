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
  {
    path: 'algorithms',
    loadComponent: () =>
      import('./features/algorithm-explorer/algorithm-explorer.component').then(
        (m) => m.AlgorithmExplorerComponent,
      ),
    title: 'Explorador de Algoritmos — Análisis de Algoritmos · UQ',
  },
  {
    path: 'similarity',
    loadComponent: () =>
      import('./features/similarity/similarity.component').then(
        (m) => m.SimilarityComponent,
      ),
    title: 'Similitud de Series — Requerimiento 2 · UQ',
  },
  {
    path: 'patterns',
    loadComponent: () =>
      import('./features/patterns/patterns.component').then(
        (m) => m.PatternsComponent,
      ),
    title: 'Patrones y Riesgo — Requerimiento 3 · UQ',
  },
  {
    path: 'visualization',
    loadComponent: () =>
      import('./features/visualization/visualization.component').then(
        (m) => m.VisualizationComponent,
      ),
    title: 'Visualización Bursátil — Requerimiento 4 · UQ',
  },
  // Catch-all: redirige rutas desconocidas al dashboard
  { path: '**', redirectTo: 'dashboard' },
];
