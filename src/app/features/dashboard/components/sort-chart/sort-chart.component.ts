import { Component, input, computed, inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { ExecutionEntry } from '../../../../core/models/sort-result.model';
import { ThemeService } from '../../../../core/services/theme.service';

/** Paleta de colores para las barras — un color por algoritmo ejecutado */
const BAR_COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
  '#14b8a6', // teal-500
  '#a855f7', // purple-500
  '#64748b', // slate-500
];

/**
 * SortChartComponent — diagrama de barras comparativo con soporte de tema.
 *
 * Inyecta ThemeService para que chartOptions sea reactivo al dark/light mode.
 * Tanto `chartData` como `chartOptions` son computed() signals que se
 * recalculan automáticamente cuando sus dependencias cambian.
 */
@Component({
  selector: 'app-sort-chart',
  imports: [BaseChartDirective],
  templateUrl: './sort-chart.component.html',
})
export class SortChartComponent {
  private readonly theme = inject(ThemeService);

  readonly entries = input.required<ExecutionEntry[]>();

  /** Deriva el formato de datos que espera Chart.js a partir del historial */
  readonly chartData = computed<ChartData<'bar'>>(() => ({
    labels: this.entries().map((e) => e.algorithmName),
    datasets: [
      {
        data: this.entries().map((e) => e.timeMs),
        label: 'Tiempo (ms)',
        backgroundColor: this.entries().map(
          (_, i) => BAR_COLORS[i % BAR_COLORS.length] + 'CC', // 80% opacidad
        ),
        borderColor: this.entries().map(
          (_, i) => BAR_COLORS[i % BAR_COLORS.length],
        ),
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  }));

  /**
   * Opciones del gráfico — reactivas al tema.
   * computed() se recalcula cada vez que isDark() cambie, haciendo que
   * Chart.js actualice los colores de ejes, grid y tooltip.
   */
  readonly chartOptions = computed<ChartOptions<'bar'>>(() => {
    const dark = this.theme.isDark();

    const textColor     = dark ? '#9ca3af' : '#6b7280';
    const gridColor     = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const borderColor   = dark ? '#374151' : '#e5e7eb';
    const tooltipBg     = dark ? '#1e293b' : '#ffffff';
    const tooltipTitle  = dark ? '#9ca3af' : '#6b7280';
    const tooltipBody   = dark ? '#f1f5f9' : '#1e293b';
    const tooltipBorder = dark ? '#334155' : '#e2e8f0';

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipTitle,
          bodyColor: tooltipBody,
          borderColor: tooltipBorder,
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          titleFont: { size: 11, weight: 'normal' },
          bodyFont: { size: 13, weight: 'bold' },
          callbacks: {
            label: (ctx) => `  ${(ctx.parsed.y ?? 0).toFixed(3)} ms`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: textColor, font: { size: 11, weight: 500 } },
          grid: { color: gridColor },
          border: { color: borderColor },
        },
        y: {
          ticks: { color: textColor, font: { size: 11 } },
          grid: { color: gridColor },
          border: { color: borderColor },
          title: {
            display: true,
            text: 'Milisegundos (ms)',
            color: textColor,
            font: { size: 11 },
          },
        },
      },
    };
  });
}
