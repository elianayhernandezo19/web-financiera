import {
  Component,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApiService } from '../../core/services/api.service';
import { AlgorithmInfo } from '../../core/models/algorithm.model';
import { FinancialAsset } from '../../core/models/asset.model';
import { ExecutionEntry, SortRecord } from '../../core/models/sort-result.model';
import { ALGORITHMS } from '../../core/data/algorithms.data';
import { FINANCIAL_ASSETS } from '../../core/data/assets.data';

import { ControlPanelComponent } from './components/control-panel/control-panel.component';
import { SortChartComponent } from './components/sort-chart/sort-chart.component';
import { ResultsTableComponent } from './components/results-table/results-table.component';
import { AlgorithmCardComponent } from './components/algorithm-card/algorithm-card.component';

/**
 * DashboardComponent — componente contenedor ("smart component").
 *
 * Responsabilidades:
 *   - Posee todo el estado reactivo de la pantalla con Signals
 *   - Orquesta las llamadas al ApiService
 *   - Pasa datos hacia abajo (inputs) y recibe eventos hacia arriba (outputs)
 *
 * Lazy loading: se carga con `loadComponent()` en app.routes.ts.
 */
@Component({
  selector: 'app-dashboard',
  imports: [
    DecimalPipe,
    ControlPanelComponent,
    SortChartComponent,
    ResultsTableComponent,
    AlgorithmCardComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  // ── Servicios ────────────────────────────────────────────────
  private readonly apiService = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Datos estáticos ──────────────────────────────────────────
  readonly algorithms: AlgorithmInfo[] = ALGORITHMS;
  readonly assets: FinancialAsset[] = FINANCIAL_ASSETS;

  // ── Estado reactivo con Signals ──────────────────────────────
  readonly selectedAlgorithmId = signal<string>(ALGORITHMS[0].id);
  readonly selectedAssetId = signal<string>(FINANCIAL_ASSETS[0].id);
  readonly executionTimes = signal<ExecutionEntry[]>([]);
  readonly sortedData = signal<SortRecord[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // ── Señales derivadas (computed) ─────────────────────────────
  readonly selectedAlgorithmInfo = computed<AlgorithmInfo>(
    () => this.algorithms.find((a) => a.id === this.selectedAlgorithmId())!,
  );

  readonly selectedAssetInfo = computed<FinancialAsset>(
    () => this.assets.find((a) => a.id === this.selectedAssetId())!,
  );

  readonly lastExecutionTime = computed<number | null>(() => {
    const times = this.executionTimes();
    return times.length > 0 ? times[times.length - 1].timeMs : null;
  });

  readonly totalExecutions = computed<number>(() => this.executionTimes().length);

  // ── Handlers ─────────────────────────────────────────────────
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

    this.apiService
      .executeSort({ algorithm: this.selectedAlgorithmId() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.executionTimes.update((prev) => [
            ...prev,
            {
              algorithmId: response.algorithm,
              algorithmName: this.selectedAlgorithmInfo().name,
              timeMs: response.executionTimeMs,
            },
          ]);

          this.sortedData.set(response.sortedData);
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
