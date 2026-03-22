import { ChangeDetectionStrategy, Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import type { AlgorithmInfo, FinancialAsset, ExecutionEntry, SortRecord } from '@core';
import { ApiService, ALGORITHMS, FINANCIAL_ASSETS } from '@core';

import {
  ControlPanelComponent,
  SortChartComponent,
  ResultsTableComponent,
  AlgorithmCardComponent,
} from './components';

/**
 * DashboardComponent — smart component orquestador.
 *
 * Responsabilidades:
 *   - Posee todo el estado reactivo con Signals
 *   - Orquesta llamadas al ApiService
 *   - Pasa datos ↓ (inputs) y recibe eventos ↑ (outputs)
 *
 * Lazy-loaded desde app.routes.ts.
 */
@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, ControlPanelComponent, SortChartComponent, ResultsTableComponent, AlgorithmCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Datos estáticos (no requieren signal) ──
  readonly algorithms: AlgorithmInfo[] = ALGORITHMS;
  readonly assets: FinancialAsset[] = FINANCIAL_ASSETS;

  // ── Estado reactivo ──
  readonly selectedAlgorithmId = signal(ALGORITHMS[0].id);
  readonly selectedAssetId = signal(FINANCIAL_ASSETS[0].id);
  readonly executionTimes = signal<ExecutionEntry[]>([]);
  readonly sortedData = signal<SortRecord[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // ── Derivados (computed) ──
  readonly selectedAlgorithmInfo = computed(() =>
    this.algorithms.find(a => a.id === this.selectedAlgorithmId())!,
  );

  readonly selectedAssetInfo = computed(() =>
    this.assets.find(a => a.id === this.selectedAssetId())!,
  );

  readonly lastExecutionTime = computed(() => {
    const t = this.executionTimes();
    return t.length ? t[t.length - 1].timeMs : null;
  });

  readonly totalExecutions = computed(() => this.executionTimes().length);

  // ── Handlers ──
  onAlgorithmSelected(id: string): void {
    this.selectedAlgorithmId.set(id);
    this.errorMessage.set(null);
  }

  onAssetSelected(id: string): void {
    this.selectedAssetId.set(id);
    this.errorMessage.set(null);
  }

  onExecuteSort(): void {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const symbol = this.selectedAssetInfo().ticker;

    this.api
      .executeSort({ algorithm: this.selectedAlgorithmId(), symbol })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res.success) {
            this.errorMessage.set(res.message || 'Error desde el servidor');
            this.isLoading.set(false);
            return;
          }
          
          const executionResult = res.data;
          
          this.executionTimes.update(prev => [
            ...prev,
            { algorithmId: this.selectedAlgorithmId(), algorithmName: executionResult.algorithm, timeMs: executionResult.executionTimeMs },
          ]);
          this.sortedData.set(executionResult.data);
          this.isLoading.set(false);
        },
        error: (err: Error) => {
          this.errorMessage.set(err.message);
          this.isLoading.set(false);
        },
      });
  }

  clearHistory(): void {
    this.executionTimes.set([]);
    this.sortedData.set([]);
    this.errorMessage.set(null);
  }
}
