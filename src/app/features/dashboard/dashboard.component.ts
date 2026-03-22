import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SortChartComponent } from './components/sort-chart/sort-chart.component';
import { ResultsTableComponent } from './components/results-table/results-table.component';
import { TopVolumeComponent } from './components/top-volume/top-volume.component';

import { ALGORITHMS } from '@core/data/algorithms.data';
import { ApiService } from '@core';
import type { SortRecord, ExecutionEntry } from '@core';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SortChartComponent, ResultsTableComponent, TopVolumeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Estados UI ──
  readonly isRacing = signal<boolean>(false);
  readonly isFullscreen = signal<boolean>(false);

  // ── Datos (Signals Generales) ──
  readonly racingExecutionTimes = signal<ExecutionEntry[]>([]);
  readonly sortedData = signal<SortRecord[]>([]);

  // ── Datos (Mocks Top Volumen) ──
  readonly topVolumeData = signal<{ date: string; volume: number }[]>([
    { date: '2023-11-02', volume: 4521000000 },
    { date: '2023-10-15', volume: 4180500000 },
    { date: '2024-01-22', volume: 3950200000 },
    { date: '2023-09-08', volume: 3820100000 },
    { date: '2024-02-14', volume: 3750000000 },
    { date: '2023-12-05', volume: 3610900000 },
    { date: '2023-08-30', volume: 3540200000 },
    { date: '2024-03-01', volume: 3490800000 },
    { date: '2023-07-12', volume: 3420500000 },
    { date: '2023-11-28', volume: 3380100000 },
    { date: '2024-01-05', volume: 3310400000 },
    { date: '2023-10-02', volume: 3260700000 },
    { date: '2023-09-21', volume: 3190200000 },
    { date: '2024-02-28', volume: 3150800000 },
    { date: '2023-08-14', volume: 3110500000 },
  ]);

  constructor() {
    this.initializeEmptyRace();
  }

  // ── Toggle Pantalla Completa ──
  toggleFullscreen(): void {
    this.isFullscreen.update(v => !v);
  }

  // ── Simulación Visual de Carrera (Mocks) ──
  onSimulateRace(): void {
    if (this.isRacing()) return;
    this.isRacing.set(true);
    this.initializeEmptyRace();

    // Valores finales mockeados (en ms) como referencia
    const targetTimes: Record<string, number> = {
      timsort: 12.5,
      quicksort: 14.2,
      mergesort: 18.7,
      heapsort: 21.3,
      shellsort: 35.1,
      combsort: 42.8,
      radixsort: 55.4,
      countingsort: 62.1,
      bucketsort: 75.9,
      insertionsort: 450.2,
      selectionsort: 1250.5,
      bubblesort: 2800.8
    };

    let step = 0;
    const maxSteps = 40; // frames
    const intervalTime = 50; // ms

    const interval = setInterval(() => {
      step++;
      const progress = step / maxSteps;
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const currentEntries = ALGORITHMS.map(algo => ({
        algorithmId: algo.id,
        algorithmName: algo.name,
        timeMs: (targetTimes[algo.id] || Number.MAX_VALUE) * easeProgress
      }));

      // Ordenar por tiempo actual (Ascendente) para simular carrera real
      currentEntries.sort((a, b) => a.timeMs - b.timeMs);
      this.racingExecutionTimes.set(currentEntries);

      if (step >= maxSteps) {
        clearInterval(interval);
        this.isRacing.set(false);
        this.generateMockTableData();
      }
    }, intervalTime);
  }

  private initializeEmptyRace(): void {
    const emptyEntries = ALGORITHMS.map(algo => ({
      algorithmId: algo.id,
      algorithmName: algo.name,
      timeMs: 0
    }));
    this.racingExecutionTimes.set(emptyEntries);
    this.sortedData.set([]);
  }

  private generateMockTableData(): void {
    const mockData: SortRecord[] = Array.from({ length: 50 }).map((_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString(),
      open: 150 + Math.random() * 10,
      high: 160 + Math.random() * 10,
      low: 140 + Math.random() * 10,
      close: 155 + Math.random() * 10,
      volume: 1000000 + Math.random() * 5000000
    }));
    this.sortedData.set(mockData);
  }
}
