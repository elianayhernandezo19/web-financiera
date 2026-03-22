import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';

import type { SortRecord } from '../../../../core';

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
  imports: [ScrollingModule, DecimalPipe],
  templateUrl: './results-table.component.html',
  styleUrl: './results-table.component.scss',
})
export class ResultsTableComponent {
  readonly data = input.required<SortRecord[]>();

  /** TrackBy por fecha: evita re-creación de nodos DOM */
  trackByDate(_: number, row: SortRecord): string {
    return row.date;
  }
}
