import { Component, input, computed } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { ExecutionEntry } from '../../../../core/models/sort-result.model';

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
 * SortChartComponent — diagrama de barras comparativo de tiempos de ejecución.
 *
 * Por qué computed() para chartData:
 *   Deriva automáticamente el formato ChartData<'bar'> cada vez que el signal
 *   `entries` cambia, sin necesidad de ngOnChanges ni subscripciones manuales.
 *   Chart.js detecta el cambio de referencia del objeto y actualiza la gráfica.
 */
@Component({
  selector: 'app-sort-chart',
  // BaseChartDirective es standalone — se importa directamente sin módulo
  imports: [BaseChartDirective],
  templateUrl: './sort-chart.component.html',
})
export class SortChartComponent {
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
        borderRadius: 6,
      },
    ],
  }));

  /** Opciones estáticas del gráfico — tema oscuro consistent con Tailwind */
  readonly chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#9ca3af',
        bodyColor: '#f9fafb',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          // ctx.parsed.y puede ser null en Chart.js para puntos faltantes
          label: (ctx) => `  ${(ctx.parsed.y ?? 0).toFixed(3)} ms`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af', font: { size: 11 } },
        grid: { color: '#1f2937' },
        border: { color: '#374151' },
      },
      y: {
        ticks: { color: '#9ca3af', font: { size: 11 } },
        grid: { color: '#1f2937' },
        border: { color: '#374151' },
        title: {
          display: true,
          text: 'Milisegundos (ms)',
          color: '#6b7280',
          font: { size: 11 },
        },
      },
    },
  };
}
