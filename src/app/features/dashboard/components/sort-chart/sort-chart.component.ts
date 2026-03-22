import { ChangeDetectionStrategy, Component, input, computed, inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartData, ChartOptions } from 'chart.js';

import type { ExecutionEntry } from '@core';
import { ThemeService, BAR_COLORS } from '@core';

/**
 * SortChartComponent — diagrama de barras comparativo con tema reactivo.
 *
 * `chartData` y `chartOptions` son computed() signals que se
 * recalculan automáticamente ante cambios en sus dependencias.
 */
@Component({
  selector: 'app-sort-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
  templateUrl: './sort-chart.component.html',
  styleUrl: './sort-chart.component.scss',
})
export class SortChartComponent {
  private readonly theme = inject(ThemeService);

  readonly entries = input.required<ExecutionEntry[]>();
  readonly isFinished = input<boolean>(false);

  /** Deriva el formato ChartData a partir del historial de ejecuciones */
  readonly chartData = computed<ChartData<'bar'>>(() => {
    const finished = this.isFinished();
    return {
      labels: this.entries().map((e, index) => {
        let name = e.algorithmName;
        if (finished) {
          if (index === 0) name = '🥇 ' + name;
          else if (index === 1) name = '🥈 ' + name;
          else if (index === 2) name = '🥉 ' + name;
        }
        return name;
      }),
      datasets: [{
        data: this.entries().map(e => e.timeMs),
        label: 'Tiempo (ms)',
        backgroundColor: this.entries().map((_, i) => BAR_COLORS[i % BAR_COLORS.length] + 'CC'),
        borderColor: this.entries().map((_, i) => BAR_COLORS[i % BAR_COLORS.length]),
        borderWidth: 1.5,
        borderRadius: 8,
      }],
    };
  });

  /** Opciones reactivas al tema — se recalcula al cambiar isDark() */
  readonly chartOptions = computed<ChartOptions<'bar'>>(() => {
    const dark = this.theme.isDark();

    const text = dark ? '#9ca3af' : '#6b7280';
    const grid = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const border = dark ? '#374151' : '#e5e7eb';
    const tipBg = dark ? '#1e293b' : '#ffffff';
    const tipTitle = dark ? '#9ca3af' : '#6b7280';
    const tipBody = dark ? '#f1f5f9' : '#1e293b';
    const tipBorder = dark ? '#334155' : '#e2e8f0';

    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y', // Convertir a gráfico de barras horizontales
      animation: { duration: 150, easing: 'linear' }, // Animación veloz para simular "carrera"
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tipBg,
          titleColor: tipTitle,
          bodyColor: tipBody,
          borderColor: tipBorder,
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          titleFont: { size: 11, weight: 'normal' },
          bodyFont: { size: 13, weight: 'bold' },
          callbacks: { label: ctx => `  ${(ctx.parsed.x ?? 0).toFixed(3)} ms` },
        },
      },
      scales: {
        x: {
          ticks: { color: text, font: { size: 11 } },
          grid: { color: grid },
          border: { color: border },
          title: { display: true, text: 'Milisegundos (ms)', color: text, font: { size: 11 } },
        },
        y: {
          ticks: { color: text, font: { size: 11, weight: 600 } },
          grid: { display: false }, // Ocultar grid lines horizontales para un look más limpio
          border: { color: border },
        },
      },
    };
  });
}
