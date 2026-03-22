import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { AlgorithmInfo } from '@core';

/**
 * AlgorithmCardComponent — ficha técnica Big O del algoritmo seleccionado.
 * Puramente presentacional: sin estado, solo recibe un input.
 */
@Component({
  selector: 'app-algorithm-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './algorithm-card.component.html',
  styleUrl: './algorithm-card.component.scss',
})
export class AlgorithmCardComponent {
  readonly algorithm = input.required<AlgorithmInfo>();
}
