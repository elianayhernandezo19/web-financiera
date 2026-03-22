import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SortRecord } from '../../../../core/models/sort-result.model';

/**
 * ResultsTableComponent — tabla de alto rendimiento con Virtual Scroll.
 *
 * Por qué Virtual Scroll (CdkVirtualScrollViewport + *cdkVirtualFor):
 *   Con miles de registros financieros históricos, renderizar cada fila
 *   como nodo DOM degradaría el rendimiento. El virtual scroll solo monta
 *   los elementos visibles, manteniendo el DOM ligero y el scroll fluido.
 *
 * itemSize="48" — altura fija de cada fila en píxeles (h-12 = 3rem = 48px).
 * El CDK necesita este valor para calcular la posición de scroll correctamente.
 */
@Component({
  selector: 'app-results-table',
  // ScrollingModule exporta CdkVirtualScrollViewport y CdkVirtualForOf
  imports: [ScrollingModule, DecimalPipe],
  templateUrl: './results-table.component.html',
  styleUrl: './results-table.component.scss',
})
export class ResultsTableComponent {
  readonly data = input.required<SortRecord[]>();

  /** TrackBy por fecha: evita re-creación de nodos DOM en actualizaciones */
  trackByDate(_index: number, row: SortRecord): string {
    return row.date;
  }
}
