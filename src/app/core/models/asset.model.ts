/** Modelo para un activo financiero disponible en el selector */
export interface FinancialAsset {
  id: string;
  name: string;
  ticker: string;
  type: 'stock' | 'index' | 'crypto' | 'commodity';
}
