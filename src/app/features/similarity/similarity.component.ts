import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartData, ChartOptions } from 'chart.js';

import { ApiService, ThemeService } from '@core';
import type {
  SimilarityCompareResponse, SimilarityMetric, SimilarityResultItem,
} from '@core';

/**
 * SimilarityComponent — Requerimiento 2:
 *  Compara dos activos con los 4 algoritmos de similitud y muestra:
 *    • Selector de activo A y B + métrica (precios | retornos)
 *    • Gráfico de líneas con ambas series alineadas por fecha
 *    • Una tarjeta por algoritmo con el valor, la fórmula matemática,
 *      la complejidad y el tiempo de ejecución medido en el backend.
 */
@Component({
  selector: 'app-similarity',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, DecimalPipe, BaseChartDirective],
  templateUrl: './similarity.component.html',
  styleUrl: './similarity.component.scss',
})
export class SimilarityComponent {
  private readonly api        = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly theme    = inject(ThemeService);

  // ── Estado UI ──
  readonly symbols   = signal<string[]>([]);
  readonly symbolA   = signal<string>('');
  readonly symbolB   = signal<string>('');
  readonly metric    = signal<SimilarityMetric>('close');

  readonly loading   = signal<boolean>(false);
  readonly error     = signal<string | null>(null);
  readonly result    = signal<SimilarityCompareResponse | null>(null);

  constructor() { this.loadSymbols(); }

  // ── Carga inicial de tickers ──
  private loadSymbols(): void {
    this.api.getSimilaritySymbols()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => {
          if (r.success && r.data?.length) {
            this.symbols.set(r.data);
            this.symbolA.set(r.data[0] ?? '');
            this.symbolB.set(r.data[1] ?? r.data[0] ?? '');
          }
        },
        error: e => this.error.set(e.message),
      });
  }

  // ── Acción principal: lanzar comparación ──
  comparar(): void {
    const a = this.symbolA(); const b = this.symbolB();
    if (!a || !b) { this.error.set('Selecciona ambos activos.'); return; }
    if (a === b)  { this.error.set('Los activos deben ser distintos.'); return; }

    this.error.set(null);
    this.loading.set(true);
    this.result.set(null);

    this.api.compareSimilarity(a, b, this.metric())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => {
          this.loading.set(false);
          if (r.success && r.data) this.result.set(r.data);
          else this.error.set(r.message ?? 'Respuesta vacia.');
        },
        error: e => { this.loading.set(false); this.error.set(e.message); },
      });
  }

  // ── Helpers de presentación de resultados ──
  trackById = (_i: number, x: SimilarityResultItem) => x.id;

  /**
   * Para Pearson y Coseno, |valor| → barra de "qué tan similares".
   * Para Euclidiana y DTW son distancias absolutas; sólo mostramos el número.
   */
  bounded(item: SimilarityResultItem): boolean {
    return item.id === 'pearson' || item.id === 'cosine';
  }

  badge(item: SimilarityResultItem): string {
    if (item.value === null) return 'sin datos';
    if (this.bounded(item)) {
      const v = item.value;
      if (v > 0.7)  return 'muy similar';
      if (v > 0.3)  return 'similar';
      if (v > -0.3) return 'sin relacion';
      if (v > -0.7) return 'inverso';
      return 'muy inverso';
    }
    return 'distancia';
  }

  // ── Chart de líneas (dos series alineadas) ──
  readonly chartData = computed<ChartData<'line'>>(() => {
    const r = this.result();
    if (!r) return { labels: [], datasets: [] };

    return {
      labels: r.series.dates,
      datasets: [
        {
          label: r.activos.a,
          data: r.series.a,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.15)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.15,
        },
        {
          label: r.activos.b,
          data: r.series.b,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.15)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.15,
        },
      ],
    };
  });

  readonly chartOptions = computed<ChartOptions<'line'>>(() => {
    const dark = this.theme.isDark();
    const text = dark ? '#9ca3af' : '#6b7280';
    const grid = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: text } },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        x: { ticks: { color: text, maxTicksLimit: 8 }, grid: { color: grid } },
        y: { ticks: { color: text }, grid: { color: grid } },
      },
    };
  });
}
