import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';

/**
 * Configuración funcional de la aplicación (sin NgModules).
 *
 * - provideHttpClient()              → habilita HttpClient con el nuevo API funcional
 *                                       (reemplaza HttpClientModule)
 * - provideCharts(withDefaultRegisterables()) → registra todos los tipos de Chart.js
 *                                       (bar, line, pie…) de forma tree-shakeable
 * - provideRouter(withComponentInputBinding()) → permite pasar query params como
 *                                       @Input() automáticamente en los componentes
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    provideCharts(withDefaultRegisterables()),
  ],
};
