import type { FinancialAsset } from '../models';

/**
 * Catálogo estático de activos financieros disponibles.
 * En una versión futura estos podrían cargarse desde la API.
 */
export const FINANCIAL_ASSETS: FinancialAsset[] = [
  {
    id: 'ecopetrol',
    name: 'Ecopetrol',
    ticker: 'EC',
    type: 'stock',
  },
  {
    id: 'sp500',
    name: 'S&P 500',
    ticker: 'SPX',
    type: 'index',
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    ticker: 'BTC',
    type: 'crypto',
  },
  {
    id: 'apple',
    name: 'Apple Inc.',
    ticker: 'AAPL',
    type: 'stock',
  },
  {
    id: 'bancolombia',
    name: 'Bancolombia',
    ticker: 'CIB',
    type: 'stock',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    ticker: 'ETH',
    type: 'crypto',
  },
];
