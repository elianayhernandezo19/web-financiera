import { Component, input } from '@angular/core';
import { AlgorithmInfo } from '../../../../core/models/algorithm.model';

/**
 * AlgorithmCardComponent — muestra la ficha técnica Big O del algoritmo seleccionado.
 * Componente puramente presentacional: sin estado propio, solo recibe un input.
 */
@Component({
  selector: 'app-algorithm-card',
  imports: [],
  templateUrl: './algorithm-card.component.html',
})
export class AlgorithmCardComponent {
  readonly algorithm = input.required<AlgorithmInfo>();
}
