export type AssetType = 'stock' | 'crypto' | 'forex' | 'index';

export interface FinancialAsset {
  readonly id: string;
  readonly name: string;
  readonly ticker: string;
  readonly type: AssetType;
}

export interface AlgorithmInfo {
  readonly id: string;
  readonly name: string;
  readonly complexity: {
    readonly best: string;
    readonly average: string;
    readonly worst: string;
    readonly space: string;
  };
  readonly stable?: boolean;
  readonly description?: string;
}

// ── Models format mapped to backend Node.js API ──

export interface SortRequest {
  readonly algorithm: string;
  readonly symbol?: string;
}

export interface SortRecord {
  readonly symbol?: string;
  readonly date: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

export interface SortExecutionResult {
  readonly algorithm: string;
  readonly size: number;
  readonly executionTimeMs: number;
  readonly complexity: AlgorithmInfo['complexity'];
  readonly data: SortRecord[];
}

export interface RaceResultItem {
  readonly position: number;
  readonly algorithm: string;
  readonly executionTimeMs: number;
  readonly error: string | null;
}

export interface RaceData {
  readonly asset: string;
  readonly dataSize: number;
  readonly mode: string;
  readonly threads: number;
  readonly cpuCores: number;
  readonly wallClockMs: number;
  readonly raceResults: RaceResultItem[];
}

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T;
  readonly meta?: {
    readonly n?: number;
    readonly timestamp?: string;
    readonly total?: number;
    readonly [key: string]: unknown;
  };
  readonly statusCode?: number;
  readonly message?: string;
}

// ── UI state models ──

export interface ExecutionEntry {
  readonly algorithmId: string;
  readonly algorithmName: string;
  readonly timeMs: number;
}

// ── Similitud de series de tiempo (Requerimiento 2) ──

export type SimilarityMetric = 'close' | 'returns';

export interface SimilarityAlgorithmMeta {
  readonly id: string;
  readonly name: string;
  readonly complexity: { readonly time: string; readonly space: string };
  readonly formula: string;
  readonly description: string;
}

export interface SimilarityResultItem extends SimilarityAlgorithmMeta {
  readonly value: number | null;
  readonly executionTimeMs: number;
  readonly error: string | null;
}

export interface SimilarityCompareResponse {
  readonly activos: { readonly a: string; readonly b: string };
  readonly metric: SimilarityMetric;
  readonly n: number;
  readonly series: {
    readonly dates: string[];
    readonly a: number[];
    readonly b: number[];
  };
  readonly resultados: SimilarityResultItem[];
}

// -- Patrones (Requerimiento 3 - parte 1) --

export interface PatternParameter {
  readonly name: string;
  readonly type: 'integer' | 'number';
  readonly default: number;
  readonly min?: number;
  readonly description: string;
}

export interface PatternMeta {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly formalDefinition: string;
  readonly complexity: { readonly time: string; readonly space: string; readonly notes?: string };
  readonly parameters: PatternParameter[];
}

export interface StreakUpOccurrence {
  readonly startIndex: number;
  readonly endIndex: number;
  readonly length: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly startPrice: number;
  readonly endPrice: number;
  readonly gainPct: number;
}

export interface VReversalOccurrence {
  readonly bottomIndex: number;
  readonly bottomDate: string;
  readonly bottomPrice: number;
  readonly startIndex: number;
  readonly startDate: string;
  readonly endIndex: number;
  readonly endDate: string;
  readonly downDays: number;
  readonly upDays: number;
  readonly dropPct: number;
  readonly recoveryPct: number;
}

export type PatternOccurrence = StreakUpOccurrence | VReversalOccurrence;

export interface PatternDetectResponse {
  readonly symbol: string;
  readonly pattern: PatternMeta;
  readonly paramsUsed: Record<string, number>;
  readonly seriesSize: number;
  readonly occurrencesCount: number;
  readonly occurrences: PatternOccurrence[];
  readonly executionTimeMs: number;
  readonly series: { readonly dates: string[]; readonly closes: number[] };
}

// -- Riesgo / Volatilidad (Requerimiento 3 - parte 2) --

export type RiskCategory = 'conservador' | 'moderado' | 'agresivo';

export interface RiskRankingItem {
  readonly symbol: string;
  readonly source: string;
  readonly n: number;
  readonly firstDate: string;
  readonly lastDate: string;
  readonly meanReturn: number;
  readonly stdDev: number;
  readonly annualized: number;
  readonly annualizedPct: number;
  readonly category: RiskCategory;
  readonly categoryLabel: string;
}

export interface RiskClassificationResponse {
  readonly thresholds: { readonly conservative: number; readonly moderate: number };
  readonly totalAssets: number;
  readonly totals: { readonly conservador: number; readonly moderado: number; readonly agresivo: number };
  readonly ranking: RiskRankingItem[];
  readonly executionTimeMs: number;
}

// -- Visualización (Requerimiento 4) --

export interface CorrelationMatrixResponse {
  readonly labels: string[];
  readonly matrix: number[][];
  readonly n: number;
  readonly pairsComputed: number;
  readonly metric: 'close' | 'returns';
  readonly dateRange: { readonly from: string; readonly to: string };
  readonly executionTimeMs: number;
}

export interface CandleSeries {
  readonly dates: string[];
  readonly opens: number[];
  readonly highs: number[];
  readonly lows: number[];
  readonly closes: number[];
  readonly volumes: number[];
}

export interface SmaSeries {
  readonly window: number;
  readonly values: (number | null)[];
}

export interface CandlesResponse {
  readonly symbol: string;
  readonly n: number;
  readonly dateRange: { readonly from: string; readonly to: string };
  readonly candles: CandleSeries;
  readonly smas: SmaSeries[];
  readonly executionTimeMs: number;
}
