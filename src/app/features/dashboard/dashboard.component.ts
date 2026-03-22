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

    // Valores finales inspirados en la captura del usuario
    const targetTimes: Record<string, number> = {
      pigeonholesort: 50.7,
      timsort: 1163.9,
      radixsort: 122.3,
      quicksort: 1600.0,
      bucketsort: 2014.8,
      heapsort: 2057.6,
      combsort: 3067.8,
      bitonicsort: 3317.8,
      binaryinsertionsort: 3689.3,
      treesort: 8000.5,
      selectionsort: 12000.0,
      bubblesort: 19853.4
    };

    let step = 0;
    const maxSteps = 120; // 2 segundos a 60fps (120 frames)
    const intervalTime = 16;
    
    // Obtenemos el tiempo máximo que tomará el más lento
    // Usamos ALGORITHMS para mapear, asegurando que todos tengan un default
    let maxTime = 0;
    ALGORITHMS.forEach(a => {
      const t = targetTimes[a.id.toLowerCase().replace(/\s/g, '')] || targetTimes[a.id] || targetTimes[a.name.toLowerCase().replace(/\s/g, '')] || Math.random() * 5000 + 1000;
      targetTimes[a.id] = t; // normalizar la key al ID official
      if (t > maxTime) maxTime = t;
    });

    // Función de Easing (Ease Out Quart) para que el "cronómetro" empiece rápido y ralentice al final
    const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);

    const interval = setInterval(() => {
      step++;
      const progress = step / maxSteps; // 0 a 1
      const easedProgress = easeOutQuart(progress);
      
      // El "cronómetro" global simulado
      const currentTimeObj = maxTime * easedProgress;

      const currentEntries = ALGORITHMS.map(algo => {
        const target = targetTimes[algo.id];
        // La barra avanza junto con el cronómetro, PERO se detiene en su target final
        const currentVal = Math.min(currentTimeObj, target);
        
        return {
          algorithmId: algo.id,
          algorithmName: algo.name,
          timeMs: currentVal
        };
      });

      // ORDENAMIENTO EN TIEMPO REAL:
      // Los ganadores (menor tiempo) suben. Durante la carrera, los que siguen corriendo están empatados en `currentTimeObj`.
      // Para evitar que los empatados salten visualmente, el desempate se hace por el target final.
      currentEntries.sort((a, b) => {
        if (a.timeMs === b.timeMs) {
           return targetTimes[a.algorithmId] - targetTimes[b.algorithmId];
        }
        return a.timeMs - b.timeMs;
      });

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
