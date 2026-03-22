/** Payload enviado al endpoint POST /api/sort/execute */
export interface SortRequest {
  algorithm: string;
}

/** Un registro financiero individual devuelto por la API (ya ordenado) */
export interface SortRecord {
  date: string;
  closePrice: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  volume?: number;
  [key: string]: unknown;
}

/** Respuesta completa del API tras ejecutar el ordenamiento */
export interface SortResponse {
  algorithm: string;
  executionTimeMs: number;
  recordCount: number;
  sortedData: SortRecord[];
}

/**
 * Entrada del historial de tiempos para la gráfica comparativa.
 * Se guarda en el signal `executionTimes` del DashboardComponent.
 */
export interface ExecutionEntry {
  algorithmId: string;
  algorithmName: string;
  timeMs: number;
}
