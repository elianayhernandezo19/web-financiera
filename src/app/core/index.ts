// ═══════════════════════════════════════════════════════════════
// core/index.ts — barrel export público del módulo core
//
// Permite que cualquier componente importe todo lo necesario con:
//   import { AlgorithmInfo, ApiService, ALGORITHMS } from '@core';
//   o bien:
//   import { ... } from '../../core';         (ruta relativa)
// ═══════════════════════════════════════════════════════════════

// ── Modelos ──
export type {
  AlgorithmInfo,
  AssetType,
  FinancialAsset,
  SortRequest,
  SortRecord,
  SortExecutionResult,
  ApiResponse,
  ExecutionEntry,
} from './models';

// ── Datos estáticos ──
export { ALGORITHMS } from './data/algorithms.data';
export { FINANCIAL_ASSETS } from './data/assets.data';

// ── Servicios ──
export { ApiService } from './services/api.service';
export { ThemeService } from './services/theme.service';

// ── Constantes compartidas ──
export { BAR_COLORS } from './data/chart-colors.data';
