// ═══════════════════════════════════════════════════════════════
// Modelos del dominio — consolidados en un solo archivo
// ═══════════════════════════════════════════════════════════════

// ── Algoritmos ──

/** Ficha técnica de complejidad Big O para cada algoritmo */
export interface AlgorithmInfo {
  readonly id: string;
  readonly name: string;
  readonly bestCase: string;
  readonly averageCase: string;
  readonly worstCase: string;
  readonly spaceComplexity: string;
  readonly stable: boolean;
  readonly description: string;
}

// ── Activos Financieros ──

/** Tipo de activo financiero */
export type AssetType = 'stock' | 'index' | 'crypto' | 'commodity';

/** Modelo para un activo financiero disponible en el selector */
export interface FinancialAsset {
  readonly id: string;
  readonly name: string;
  readonly ticker: string;
  readonly type: AssetType;
}

// ── Ordenamiento / API ──

/** Payload enviado al endpoint POST /api/sort/execute */
export interface SortRequest {
  readonly algorithm: string;
}

/** Un registro financiero individual devuelto por la API (ya ordenado) */
export interface SortRecord {
  readonly date: string;
  readonly closePrice: number;
  readonly openPrice?: number;
  readonly highPrice?: number;
  readonly lowPrice?: number;
  readonly volume?: number;
  readonly [key: string]: unknown;
}

/** Respuesta completa del API tras ejecutar el ordenamiento */
export interface SortResponse {
  readonly algorithm: string;
  readonly executionTimeMs: number;
  readonly recordCount: number;
  readonly sortedData: SortRecord[];
}

/**
 * Entrada del historial de tiempos para la gráfica comparativa.
 * Se guarda en el signal `executionTimes` del DashboardComponent.
 */
export interface ExecutionEntry {
  readonly algorithmId: string;
  readonly algorithmName: string;
  readonly timeMs: number;
}
