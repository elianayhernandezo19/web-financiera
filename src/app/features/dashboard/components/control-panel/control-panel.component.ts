import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlgorithmInfo } from '../../../../core/models/algorithm.model';

/**
 * ControlPanelComponent — componente presentacional ("dumb component").
 *
 * No contiene lógica de negocio ni estado propio. Recibe datos vía
 * signal inputs (input()) y comunica acciones al padre con outputs.
 *
 * Por qué input() en vez de @Input():
 *   - El valor es un Signal: se puede componer con computed() y effect()
 *   - Sin necesidad de ngOnChanges para reaccionar a cambios
 *   - Infraestructura de reactividad consistent con el resto de la app
 */
@Component({
  selector: 'app-control-panel',
  imports: [FormsModule],
  templateUrl: './control-panel.component.html',
})
export class ControlPanelComponent {
  // input.required<T>() — su ausencia causa error en tiempo de compilación
  readonly algorithms = input.required<AlgorithmInfo[]>();
  readonly selectedId = input.required<string>();
  readonly isLoading = input<boolean>(false);

  // output() reemplaza EventEmitter con una API más limpia y tipada
  readonly algorithmSelected = output<string>();
  readonly executeSortClicked = output<void>();

  onSelectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.algorithmSelected.emit(value);
  }

  onExecute(): void {
    this.executeSortClicked.emit();
  }
}
