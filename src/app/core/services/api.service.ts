import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import type {
  SortRequest, ApiResponse, SortExecutionResult, RaceData, SortRecord,
  SimilarityMetric, SimilarityAlgorithmMeta, SimilarityCompareResponse,
  PatternMeta, PatternDetectResponse, RiskClassificationResponse,
  CorrelationMatrixResponse, CandlesResponse,
} from '../models';

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

  // Lee API_URL desde window.__env (inyectado por docker-entrypoint via envsubst).
  // En desarrollo (`ng serve`) o si el placeholder $API_URL no se sustituyo,
  // usa el fallback local.
  private readonly BASE_URL: string = (() => {
    const fromEnv = (window as any).__env?.['API_URL'] as string | undefined;
    // Detectar placeholder no sustituido (empieza por '$')
    const isUnsubstituted = !fromEnv || fromEnv.trim().startsWith('$');
    return isUnsubstituted ? 'http://localhost:3000/api/v1' : fromEnv;
  })();

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

  // ── Requerimiento 2 — Similitud de series de tiempo ──

  /** Lista de tickers disponibles para comparar. */
  getSimilaritySymbols(): Observable<ApiResponse<string[]>> {
    return this.http
      .get<ApiResponse<string[]>>(`${this.BASE_URL}/similitud/activos`)
      .pipe(catchError(this.handleError));
  }

  /** Metadatos de los 4 algoritmos (formula + complejidad + descripcion). */
  getSimilarityAlgorithms(): Observable<ApiResponse<SimilarityAlgorithmMeta[]>> {
    return this.http
      .get<ApiResponse<SimilarityAlgorithmMeta[]>>(`${this.BASE_URL}/similitud/algoritmos`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Compara dos activos con los 4 algoritmos.
   * @param a       simbolo A
   * @param b       simbolo B
   * @param metric  'close' | 'returns'
   */
  compareSimilarity(
    a: string,
    b: string,
    metric: SimilarityMetric = 'close',
  ): Observable<ApiResponse<SimilarityCompareResponse>> {
    const url = `${this.BASE_URL}/similitud/comparar`
              + `?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}&metric=${metric}`;
    return this.http
      .get<ApiResponse<SimilarityCompareResponse>>(url)
      .pipe(catchError(this.handleError));
  }

  // -- Requerimiento 3 - Patrones (sliding window) --

  /** Lista de tickers con suficiente historial para detectar patrones. */
  getPatternsSymbols(): Observable<ApiResponse<string[]>> {
    return this.http
      .get<ApiResponse<string[]>>(`${this.BASE_URL}/patrones/activos`)
      .pipe(catchError(this.handleError));
  }

  /** Lista de patrones definidos con sus parametros y complejidad. */
  getAvailablePatterns(): Observable<ApiResponse<PatternMeta[]>> {
    return this.http
      .get<ApiResponse<PatternMeta[]>>(`${this.BASE_URL}/patrones/disponibles`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Aplica un detector de patrones a un activo.
   * @param symbol  ticker del activo
   * @param pattern id del patron (ej. 'streak-up', 'v-reversal')
   * @param params  parametros opcionales (minLength, downDays, upDays, minMagnitude)
   */
  detectPattern(
    symbol: string,
    pattern: string,
    params: Record<string, number> = {},
  ): Observable<ApiResponse<PatternDetectResponse>> {
    const qs = new URLSearchParams();
    qs.set('symbol', symbol);
    qs.set('pattern', pattern);
    for (const [k, v] of Object.entries(params)) qs.set(k, String(v));
    return this.http
      .get<ApiResponse<PatternDetectResponse>>(`${this.BASE_URL}/patrones/buscar?${qs.toString()}`)
      .pipe(catchError(this.handleError));
  }

  // -- Requerimiento 3 - Riesgo / Volatilidad --

  /**
   * Ranking completo de activos por volatilidad anualizada con su categoria.
   * @param minDays minimo de historial requerido (default 100)
   * @param order   'desc' (mas riesgoso primero) | 'asc'
   */
  getRiskClassification(
    minDays = 100,
    order: 'asc' | 'desc' = 'desc',
  ): Observable<ApiResponse<RiskClassificationResponse>> {
    const url = `${this.BASE_URL}/riesgo/clasificacion?minDays=${minDays}&order=${order}`;
    return this.http
      .get<ApiResponse<RiskClassificationResponse>>(url)
      .pipe(catchError(this.handleError));
  }

  // -- Requerimiento 4 - Visualización --

  /** Lista de tickers con suficiente historial para visualización. */
  getVisualizationSymbols(): Observable<ApiResponse<string[]>> {
    return this.http
      .get<ApiResponse<string[]>>(`${this.BASE_URL}/visualizacion/activos`)
      .pipe(catchError(this.handleError));
  }

  /** Matriz de correlación de Pearson entre N activos. */
  getCorrelationMatrix(
    symbols: string[],
    metric: 'close' | 'returns' = 'close',
  ): Observable<ApiResponse<CorrelationMatrixResponse>> {
    const url = `${this.BASE_URL}/visualizacion/correlacion`
              + `?symbols=${symbols.map(encodeURIComponent).join(',')}`
              + `&metric=${metric}`;
    return this.http
      .get<ApiResponse<CorrelationMatrixResponse>>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * OHLCV + medias móviles simples (SMA) calculadas en backend.
   * @param symbol  ticker
   * @param sma     ventanas, ej. [20, 50] o [20, 50, 200]
   * @param limit   cantidad máxima de velas (último N)
   */
  getCandlesWithSMA(
    symbol: string,
    sma: number[] = [20, 50],
    limit = 250,
  ): Observable<ApiResponse<CandlesResponse>> {
    const url = `${this.BASE_URL}/visualizacion/velas`
              + `?symbol=${encodeURIComponent(symbol)}`
              + `&sma=${sma.join(',')}`
              + `&limit=${limit}`;
    return this.http
      .get<ApiResponse<CandlesResponse>>(url)
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
