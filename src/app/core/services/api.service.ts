import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import type { SortRequest, ApiResponse, SortExecutionResult, RaceData, SortRecord } from '../models';

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

  // Reads API_URL from window.__env at runtime (injected by some static hosts
  // that provide runtime config). For Render static sites it's recommended to
  // set `API_URL` as a build environment variable so it's embedded in the
  // bundle; this `window.__env` fallback is kept for platforms that support
  // runtime injection or for local development.
  private readonly BASE_URL: string =
    (window as any).__env?.['API_URL'] || 'http://localhost:3000/api/v1';

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

  /**
   * Ejecuta la carrera completa contra todos los algoritmos
   */
  runRace(): Observable<ApiResponse<RaceData>> {
    return this.http
      .get<ApiResponse<RaceData>>(`${this.BASE_URL}/algoritmos/carrera`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene datos históricos crudos paginados
   */
  getDatos(limit: number = 100, offset: number = 0): Observable<ApiResponse<SortRecord[]>> {
    return this.http
      .get<ApiResponse<SortRecord[]>>(`${this.BASE_URL}/datos?limit=${limit}&offset=${offset}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene el Top 15 de días con mayor volumen negociado
   */
  getTopVolumen(): Observable<ApiResponse<{ symbol: string; date: string; volume: number }[]>> {
    return this.http
      .get<ApiResponse<{ symbol: string; date: string; volume: number }[]>>(`${this.BASE_URL}/datos/top-volumen/ordenado`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Ejecuta un algoritmo en el Laboratorio (Explorador) y trae los datos ordenados
   */
  executeAlgorithmLab(algorithm: string, symbol?: string): Observable<ApiResponse<any>> {
    const body = symbol ? { algorithm, symbol } : { algorithm };
    return this.http
      .post<ApiResponse<any>>(`${this.BASE_URL}/sort/execute`, body)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene la documentación Markdown del algoritmo
   */
  getAlgorithmDocs(algorithm: string): Observable<ApiResponse<{ algorithm: string; nombre: string; content: string }>> {
    return this.http
      .get<ApiResponse<any>>(`${this.BASE_URL}/docs/${algorithm}`)
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
