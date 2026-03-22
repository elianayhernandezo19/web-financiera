import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlgorithmInfo } from '../../../../core/models/algorithm.model';
import { FinancialAsset } from '../../../../core/models/asset.model';

/**
 * ControlPanelComponent — componente presentacional ("dumb component").
 *
 * Contiene los selectores de activo financiero y algoritmo de ordenamiento,
 * más el botón de ejecución con estado de carga.
 */
@Component({
  selector: 'app-control-panel',
  imports: [FormsModule],
  templateUrl: './control-panel.component.html',
  styleUrl: './control-panel.component.scss',
})
export class ControlPanelComponent {
  // ── Inputs ──
  readonly algorithms = input.required<AlgorithmInfo[]>();
  readonly selectedAlgorithmId = input.required<string>();
  readonly assets = input.required<FinancialAsset[]>();
  readonly selectedAssetId = input.required<string>();
  readonly isLoading = input<boolean>(false);

  // ── Outputs ──
  readonly algorithmSelected = output<string>();
  readonly assetSelected = output<string>();
  readonly executeSortClicked = output<void>();

  onAlgorithmChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.algorithmSelected.emit(value);
  }

  onAssetChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.assetSelected.emit(value);
  }

  onExecute(): void {
    this.executeSortClicked.emit();
  }
}
