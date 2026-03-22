import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import type { SortRequest, ApiResponse, SortExecutionResult } from '../models';

/**
 * ApiService — única capa de comunicación con el backend Node.js.
 *
 * Usa `inject()` en lugar de inyección por constructor para aprovechar
 * la sintaxis funcional de Angular 14+ sin boilerplate de constructor.
 *
 * `providedIn: 'root'` crea una instancia singleton registrada en el
 * injector raíz sin necesidad de declararlo en ningún NgModule.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  // inject() es la forma moderna de DI: más conciso y compatible con
  // funciones standalone fuera de clases (guards, resolvers funcionales, etc.)
  private readonly http = inject(HttpClient);

  // La URL base puede moverse a src/environments/ para diferenciar
  // entornos de dev/productoin sin cambiar el código del servicio.
  private readonly BASE_URL = 'http://localhost:3000/api/v1';

  /**
   * Ejecuta un algoritmo de ordenamiento sobre los datos financieros del backend.
   * Ejecuta el algoritmo llamando a /api/v1/algoritmos/ejecutar
   * @param request Nombre del algoritmo y opcionalmente el símbolo
   */
  executeSort(request: SortRequest): Observable<ApiResponse<SortExecutionResult>> {
    return this.http
      .get<ApiResponse<SortExecutionResult>>(`${this.BASE_URL}/algoritmos/${request.algorithm}`)
      .pipe(catchError(this.handleError));
  }

  /** Convierte errores HTTP en mensajes descriptivos para mostrar en la UI */
  private handleError(error: HttpErrorResponse): Observable<never> {
    const message =
      error.status === 0
        ? 'Sin conexión con el servidor. Verifica que la API esté corriendo en el puerto 3000.'
        : `Error del servidor (${error.status}): ${error.error?.message ?? error.message}`;

    return throwError(() => new Error(message));
  }
}
