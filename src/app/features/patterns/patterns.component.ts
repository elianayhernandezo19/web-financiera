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
  PatternMeta, PatternDetectResponse, RiskClassificationResponse,
  RiskCategory, RiskRankingItem,
  StreakUpOccurrence, VReversalOccurrence,
} from '@core';

type ActiveTab = 'patterns' | 'risk';

/**
 * PatternsComponent - Requerimiento 3.
 *
 * Une dos sub-features en una sola pantalla con tabs:
 *   1) Deteccion de patrones por sliding window (Racha alcista, Reversion en V)
 *   2) Clasificacion de riesgo por volatilidad historica anualizada
 *
 * Mantiene el mismo lenguaje visual del componente Similitud
 * (glassmorphism + paleta emerald + tipografia mono en labels).
 */
@Component({
  selector: 'app-patterns',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, DecimalPipe, BaseChartDirective],
  templateUrl: './patterns.component.html',
  styleUrl: './patterns.component.scss',
})
export class PatternsComponent {
  private readonly api        = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly theme    = inject(ThemeService);

  // -- Estado general --
  readonly activeTab = signal<ActiveTab>('patterns');

  // ===================================================================
  //   TAB 1 - Deteccion de patrones
  // ===================================================================
  readonly patternsSymbols = signal<string[]>([]);
  readonly availablePatterns = signal<PatternMeta[]>([]);
  readonly selectedSymbol = signal<string>('');
  readonly selectedPatternId = signal<string>('streak-up');

  // Parametros (vinculados al patron seleccionado)
  readonly paramMinLength    = signal<number>(3);
  readonly paramDownDays     = signal<number>(3);
  readonly paramUpDays       = signal<number>(3);
  readonly paramMinMagnitude = signal<number>(0.02);

  readonly patternLoading = signal<boolean>(false);
  readonly patternError   = signal<string | null>(null);
  readonly patternResult  = signal<PatternDetectResponse | null>(null);

  readonly selectedPattern = computed<PatternMeta | null>(() => {
    const id = this.selectedPatternId();
    return this.availablePatterns().find(p => p.id === id) ?? null;
  });

  // ===================================================================
  //   TAB 2 - Clasificacion de riesgo
  // ===================================================================
  readonly riskMinDays = signal<number>(100);
  readonly riskOrder   = signal<'asc' | 'desc'>('desc');
  readonly riskFilter  = signal<RiskCategory | 'all'>('all');

  readonly riskLoading = signal<boolean>(false);
  readonly riskError   = signal<string | null>(null);
  readonly riskResult  = signal<RiskClassificationResponse | null>(null);

  readonly filteredRanking = computed<RiskRankingItem[]>(() => {
    const r = this.riskResult();
    if (!r) return [];
    const f = this.riskFilter();
    return f === 'all' ? r.ranking : r.ranking.filter(x => x.category === f);
  });

  constructor() {
    this.loadPatternsCatalog();
    this.loadPatternsSymbols();
  }

  // -- Carga inicial Tab 1 --
  private loadPatternsSymbols(): void {
    this.api.getPatternsSymbols()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => {
          if (r.success && r.data?.length) {
            this.patternsSymbols.set(r.data);
            this.selectedSymbol.set(r.data[0] ?? '');
          }
        },
        error: e => this.patternError.set(e.message),
      });
  }

  private loadPatternsCatalog(): void {
    this.api.getAvailablePatterns()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => {
          if (r.success && r.data?.length) {
            this.availablePatterns.set(r.data);
            this.selectedPatternId.set(r.data[0]?.id ?? 'streak-up');
          }
        },
        error: e => this.patternError.set(e.message),
      });
  }

  // -- Accion Tab 1 --
  detectarPatron(): void {
    const symbol  = this.selectedSymbol();
    const pattern = this.selectedPatternId();
    if (!symbol || !pattern) {
      this.patternError.set('Selecciona un activo y un patron.');
      return;
    }

    const params: Record<string, number> =
      pattern === 'streak-up'
        ? { minLength: this.paramMinLength() }
        : {
            downDays:     this.paramDownDays(),
            upDays:       this.paramUpDays(),
            minMagnitude: this.paramMinMagnitude(),
          };

    this.patternError.set(null);
    this.patternLoading.set(true);
    this.patternResult.set(null);

    this.api.detectPattern(symbol, pattern, params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => {
          this.patternLoading.set(false);
          if (r.success && r.data) this.patternResult.set(r.data);
          else this.patternError.set(r.message ?? 'Respuesta vacia.');
        },
        error: e => { this.patternLoading.set(false); this.patternError.set(e.message); },
      });
  }

  // -- Helpers Tab 1 (cast seguro segun el patron actual) --
  isStreakUp(o: any): o is StreakUpOccurrence {
    return this.selectedPatternId() === 'streak-up';
  }
  isVReversal(o: any): o is VReversalOccurrence {
    return this.selectedPatternId() === 'v-reversal';
  }

  trackOcc = (i: number) => i;

  // -- Chart Tab 1 - serie completa con bandas resaltadas --
  readonly patternChartData = computed<ChartData<'line'>>(() => {
    const r = this.patternResult();
    if (!r) return { labels: [], datasets: [] };

    return {
      labels: r.series.dates,
      datasets: [
        {
          label: r.symbol,
          data: r.series.closes,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.10)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.15,
          fill: true,
        },
      ],
    };
  });

  readonly patternChartOptions = computed<ChartOptions<'line'>>(() => {
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

  // ===================================================================
  //   Acciones Tab 2 - Riesgo
  // ===================================================================
  cargarRanking(): void {
    this.riskError.set(null);
    this.riskLoading.set(true);
    this.riskResult.set(null);

    this.api.getRiskClassification(this.riskMinDays(), this.riskOrder())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => {
          this.riskLoading.set(false);
          if (r.success && r.data) this.riskResult.set(r.data);
          else this.riskError.set(r.message ?? 'Respuesta vacia.');
        },
        error: e => { this.riskLoading.set(false); this.riskError.set(e.message); },
      });
  }

  cambiarTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    if (tab === 'risk' && !this.riskResult() && !this.riskLoading()) {
      this.cargarRanking();
    }
  }

  // -- Helpers Tab 2 --
  categoriaClass(c: RiskCategory): string {
    return 'badge-' + c;
  }

  trackRanking = (_: number, item: RiskRankingItem) => item.symbol;
}
