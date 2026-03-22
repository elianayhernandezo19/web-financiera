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
