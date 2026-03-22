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
  readonly isExecutingApi = signal<boolean>(false);
  readonly isFullscreen = signal<boolean>(false);
  readonly isRaceFinished = signal<boolean>(false);

  // ── Datos (Signals Generales) ──
  readonly racingExecutionTimes = signal<ExecutionEntry[]>([]);
  readonly sortedData = signal<SortRecord[]>([]);

  // ── Paginación Data Grid ──
  readonly isLoadingTable = signal<boolean>(false);
  readonly hasMoreTableData = signal<boolean>(true);
  private currentTableOffset = 0;
  private readonly TABLE_LIMIT = 100;

  // ── Top 15 Volumen ──
  readonly topVolumeData = signal<{ symbol: string; date: string; volume: number }[]>([]);

  constructor() {
    this.initializeEmptyRace();
    this.loadInitialTableData();
    this.loadTopVolume();
  }

  // ── Top 15 Volumen (API Real) ──
  private loadTopVolume(): void {
    this.api.getTopVolumen().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.topVolumeData.set(response.data);
        }
      },
      error: (err) => console.error('API Error: No se pudo cargar el Top 15 Volumen', err)
    });
  }

  // ── Datos Crudos (Paginación / Scroll Infinito) ──
  private loadInitialTableData(): void {
    this.currentTableOffset = 0;
    this.hasMoreTableData.set(true);
    this.fetchTableData(0);
  }

  onLoadMoreTableData(): void {
    if (this.isLoadingTable() || !this.hasMoreTableData()) return;
    this.fetchTableData(this.currentTableOffset);
  }

  private fetchTableData(offset: number): void {
    this.isLoadingTable.set(true);
    this.api.getDatos(this.TABLE_LIMIT, offset).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.isLoadingTable.set(false);
        if (response.success && response.data) {
          const newBatch = response.data;
          
          if (offset === 0) {
            this.sortedData.set(newBatch);
          } else {
            this.sortedData.update(prev => [...prev, ...newBatch]);
          }

          this.currentTableOffset += newBatch.length;

          // Si retorna menos registros de los solicitados, es el final
          if (newBatch.length < this.TABLE_LIMIT) {
             this.hasMoreTableData.set(false);
          }
        }
      },
      error: (err) => {
        console.error('API Error: No se pudo cargar los registros crudos', err);
        this.isLoadingTable.set(false);
      }
    });
  }

  // ── Toggle Pantalla Completa ──
  toggleFullscreen(): void {
    this.isFullscreen.update(v => !v);
  }

  // ── Simulación Visual de Carrera (Real API o Fallback) ──
  private fakeRaceInterval: any;

  onSimulateRace(): void {
    if (this.isRacing() || this.isExecutingApi()) return;
    
    this.isRaceFinished.set(false);
    this.isExecutingApi.set(true);
    this.initializeEmptyRace();
    this.startFakeRace();

    // Llamar al endpoint real de Node.js (toma bastante tiempo por los 63k registros en todos los algos)
    this.api.runRace().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.stopFakeRace();
        this.isExecutingApi.set(false);
        if (response.success && response.data?.raceResults) {
          // Extraer los tiempos reales del backend
          const realTimes: Record<string, number> = {};
          response.data.raceResults.forEach(r => {
            // Normalizar el nombre para mapear con ALGORITHMS id
            const normalizedId = r.algorithm.toLowerCase().replace(/\s/g, '');
            // Si hay error de TIMEOUT, asignar un tiempo muy alto o el máximo esperado
            realTimes[normalizedId] = r.error ? 60000 : r.executionTimeMs;
          });
          this.startVisualRace(realTimes);
        } else {
          this.startVisualRace(null); // usar mocks por defecto
        }
      },
      error: (err) => {
        console.error('Error contacting backend, using mocks...', err);
        this.stopFakeRace();
        this.isExecutingApi.set(false);
        this.startVisualRace(null); // fallback
      }
    });
  }

  private startFakeRace(): void {
    this.isRacing.set(true);
    // Velocidades aleatorias más controladas y lentas
    const velocities = ALGORITHMS.map(() => Math.random() * 0.8 + 0.2); 
    
    this.fakeRaceInterval = setInterval(() => {
      const currentEntries = this.racingExecutionTimes().map((entry, idx) => {
        return {
          ...entry,
          // Incremento muy sutil para dar sensación analítica
          timeMs: entry.timeMs + velocities[idx] + (Math.random() * 0.1)
        };
      });

      // Ordenar por tiempo constantemente sin saltos estridentes
      currentEntries.sort((a, b) => a.timeMs - b.timeMs);
      this.racingExecutionTimes.set(currentEntries);
    }, 100); // Secuencia suavizada a 10 cuadros efectivos
  }

  private stopFakeRace(): void {
    if (this.fakeRaceInterval) {
      clearInterval(this.fakeRaceInterval);
      this.fakeRaceInterval = null;
    }
  }

  private startVisualRace(apiTimes: Record<string, number> | null): void {
    this.initializeEmptyRace(); // Se resetea la carrera falsa al iniciar el sprint verdadero de 2 segundos
    this.isRacing.set(true);
    
    // Valores por defecto si la API falla o devuelve nulo
    const targetTimes: Record<string, number> = apiTimes || {
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
    let maxTime = 0;
    ALGORITHMS.forEach(a => {
      const normalizedId = a.id.toLowerCase().replace(/\s/g, '');
      const t = targetTimes[normalizedId] || targetTimes[a.id] || targetTimes[a.name.toLowerCase().replace(/\s/g, '')] || Math.random() * 5000 + 1000;
      targetTimes[a.id] = t; // re-asignar para un acceso seguro uniforme abajo
      if (t > maxTime) maxTime = t;
    });

    const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);

    const interval = setInterval(() => {
      step++;
      const progress = step / maxSteps; 
      const easedProgress = easeOutQuart(progress);
      
      const currentTimeObj = maxTime * easedProgress;

      const currentEntries = ALGORITHMS.map(algo => {
        const target = targetTimes[algo.id];
        const currentVal = Math.min(currentTimeObj, target);
        
        return {
          algorithmId: algo.id,
          algorithmName: algo.name,
          timeMs: currentVal
        };
      });

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
        this.isRaceFinished.set(true);
      }
    }, intervalTime);
  }

  private initializeEmptyRace(): void {
    this.isRaceFinished.set(false);
    const emptyEntries = ALGORITHMS.map(algo => ({
      algorithmId: algo.id,
      algorithmName: algo.name,
      timeMs: 0
    }));
    this.racingExecutionTimes.set(emptyEntries);
  }
}
