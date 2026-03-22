import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DecimalPipe, DatePipe } from '@angular/common';

import type { SortRecord } from '@core';

/**
 * ResultsTableComponent — tabla de alto rendimiento con Virtual Scroll.
 *
 * CdkVirtualScrollViewport solo monta los elementos visibles en el DOM,
 * garantizando scroll fluido con miles de registros financieros.
 *
 * itemSize="48" → altura fija de cada fila (3rem = 48px).
 */
@Component({
  selector: 'app-results-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollingModule, DecimalPipe, DatePipe],
  templateUrl: './results-table.component.html',
  styleUrl: './results-table.component.scss',
})
export class ResultsTableComponent {
  readonly data = input.required<SortRecord[]>();
  readonly loadingMore = input<boolean>(false);
  
  readonly loadMore = output<void>();

  /** TrackBy por fecha: evita re-creación de nodos DOM */
  trackByDate(_: number, row: SortRecord): string {
    return row.date;
  }

  /**
   * Dispara el evento de carga si el scroll llega cerca del final
   * @param index Último índice scrolleado (inicio visible)
   */
  onScroll(index: number): void {
    if (this.loadingMore()) return;
    
    // Calculamos si nos acercamos a los últimos 20 ítems del buffer de datos
    // CdkVirtualScroll suele mostrar ~10-20 dependiendo de la altura, así que index + 20 = fondo
    if (index + 20 >= this.data().length) {
      this.loadMore.emit();
    }
  }
}
