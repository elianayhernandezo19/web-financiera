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
import { ExecutionEntry, SortRecord } from '../../core/models/sort-result.model';
import { ALGORITHMS } from '../../core/data/algorithms.data';

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
 * Por qué Signals en vez de BehaviorSubject + async pipe:
 *   - Sintaxis más concisa, sin necesidad de subscribe/unsubscribe en el template
 *   - computed() reemplaza RxJS combineLatest para valores derivados
 *   - La detección de cambios de Angular 17+ es signal-aware: solo actualiza
 *     las partes del DOM que dependen del signal que cambió (Zoneless-ready)
 *
 * Lazy loading: este componente se carga con `loadComponent()` en app.routes.ts,
 * lo que lo excluye del bundle inicial de la aplicación.
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
  // ── Servicios ──────────────────────────────────────────────────────────────
  private readonly apiService = inject(ApiService);

  /**
   * DestroyRef + takeUntilDestroyed() es la forma moderna (Angular 16+) de
   * cancelar suscripciones al destruir el componente, sin boilerplate de
   * Subject<void> + ngOnDestroy + takeUntil(this.destroy$).
   */
  private readonly destroyRef = inject(DestroyRef);

  // ── Datos estáticos ────────────────────────────────────────────────────────
  /** Lista inmutable de algoritmos disponibles; no necesita ser signal */
  readonly algorithms: AlgorithmInfo[] = ALGORITHMS;

  // ── Estado reactivo con Signals ────────────────────────────────────────────

  /** ID del algoritmo actualmente seleccionado en el ControlPanel */
  readonly selectedAlgorithmId = signal<string>(ALGORITHMS[0].id);

  /**
   * Historial acumulado de tiempos — cada ejecución agrega una entrada.
   * El signal se actualiza de forma inmutable con update() para garantizar
   * que los componentes hijo detecten el cambio de referencia del array.
   */
  readonly executionTimes = signal<ExecutionEntry[]>([]);

  /** Registros financieros del último ordenamiento para la tabla virtual */
  readonly sortedData = signal<SortRecord[]>([]);

  /** Controla el estado de carga del botón y el spinner */
  readonly isLoading = signal<boolean>(false);

  /** null = sin errores activos; string = mensaje legible para el usuario */
  readonly errorMessage = signal<string | null>(null);

  // ── Señales derivadas (computed) ───────────────────────────────────────────

  /**
   * computed() recalcula automáticamente cada vez que selectedAlgorithmId cambia.
   * Evita buscar manualmente en el array dentro de cada handler.
   * El signo "!" es seguro porque selectedAlgorithmId siempre inicia con un ID válido.
   */
  readonly selectedAlgorithmInfo = computed<AlgorithmInfo>(
    () => this.algorithms.find((a) => a.id === this.selectedAlgorithmId())!,
  );

  /** Tiempo de la última ejecución para el badge del header */
  readonly lastExecutionTime = computed<number | null>(() => {
    const times = this.executionTimes();
    return times.length > 0 ? times[times.length - 1].timeMs : null;
  });

  /** Contador total de ejecuciones acumuladas */
  readonly totalExecutions = computed<number>(() => this.executionTimes().length);

  // ── Handlers de eventos de los componentes hijo ───────────────────────────

  onAlgorithmSelected(id: string): void {
    this.selectedAlgorithmId.set(id);
    // Limpiar error previo al cambiar de selección
    this.errorMessage.set(null);
  }

  onExecuteSort(): void {
    // Guard: ignorar clics dobles mientras hay una petición en vuelo
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .executeSort({ algorithm: this.selectedAlgorithmId() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // update() recibe la función transformadora — inmutabilidad garantizada
          this.executionTimes.update((prev) => [
            ...prev,
            {
              algorithmId: response.algorithm,
              // Usar el nombre legible del catálogo local en vez del ID crudo
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

  /** Reinicia la comparativa sin recargar la página */
  clearHistory(): void {
    this.executionTimes.set([]);
    this.sortedData.set([]);
    this.errorMessage.set(null);
  }
}
