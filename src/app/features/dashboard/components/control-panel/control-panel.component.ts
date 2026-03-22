import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { AlgorithmInfo, FinancialAsset } from '@core';

/**
 * ControlPanelComponent — presentacional (dumb).
 *
 * Selectores de activo financiero y algoritmo + botón de ejecución.
 * No posee estado propio: recibe datos por input y emite acciones por output.
 */
@Component({
  selector: 'app-control-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './control-panel.component.html',
  styleUrl: './control-panel.component.scss',
})
export class ControlPanelComponent {
  // ── Inputs ──
  readonly algorithms = input.required<AlgorithmInfo[]>();
  readonly selectedAlgorithmId = input.required<string>();
  readonly assets = input.required<FinancialAsset[]>();
  readonly selectedAssetId = input.required<string>();
  readonly isLoading = input(false);

  // ── Outputs ──
  readonly algorithmSelected = output<string>();
  readonly assetSelected = output<string>();
  readonly executeSortClicked = output<void>();

  /** Extrae el valor de un <select> y lo emite al output indicado */
  emitSelectValue(event: Event, emitter: typeof this.algorithmSelected): void {
    emitter.emit((event.target as HTMLSelectElement).value);
  }

  onExecute(): void {
    this.executeSortClicked.emit();
  }
}
