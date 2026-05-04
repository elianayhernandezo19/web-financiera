import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService, ThemeService } from '@core';
import type {
  CorrelationMatrixResponse, CandlesResponse, SmaSeries,
} from '@core';

type VizTab = 'heatmap' | 'candles' | 'report';

/**
 * VisualizationComponent - Requerimiento 4.
 *
 * Tres sub-vistas en tabs:
 *   1) Heatmap de matriz de correlación (Pearson NxN)
 *   2) Gráfico de velas con medias móviles simples (SMA)
 *   3) Reporte consolidado y exportable a PDF (window.print)
 *
 * Mantiene la estética glass + emerald del resto de la app.
 * El gráfico de velas se renderiza en SVG nativo (sin librerías de candlestick).
 */
@Component({
  selector: 'app-visualization',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './visualization.component.html',
  styleUrl: './visualization.component.scss',
})
export class VisualizationComponent {
  private readonly api        = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly theme    = inject(ThemeService);

  // -- Estado general --
  readonly activeTab = signal<VizTab>('heatmap');
  readonly availableSymbols = signal<string[]>([]);

  // ===================================================================
  //   TAB 1 - Heatmap de correlación
  // ===================================================================
  readonly selectedSymbols = signal<string[]>([]);
  readonly heatmapMetric   = signal<'close' | 'returns'>('close');
  readonly heatmapLoading  = signal<boolean>(false);
  readonly heatmapError    = signal<string | null>(null);
  readonly heatmapResult   = signal<CorrelationMatrixResponse | null>(null);

  // Símbolo en proceso de añadir/quitar (controlado por select)
  readonly symbolToAdd = signal<string>('');

  // ===================================================================
  //   TAB 2 - Velas + SMA
  // ===================================================================
  readonly candleSymbol  = signal<string>('');
  readonly candleLimit   = signal<number>(120);
  readonly candleSMAs    = signal<string>('20,50'); // editable como string CSV
  readonly candleLoading = signal<boolean>(false);
  readonly candleError   = signal<string | null>(null);
  readonly candleResult  = signal<CandlesResponse | null>(null);

  // Geometría del SVG (se calcula reactivamente)
  // Más alto para acomodar el panel de volumen debajo del de velas.
  readonly candleViewBox = computed<{ width: number; height: number }>(() => ({
    width: 1200, height: 520,
  }));

  // ===================================================================
  //   Inicialización
  // ===================================================================
  constructor() { this.loadSymbols(); }

  private loadSymbols(): void {
    this.api.getVisualizationSymbols()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => {
          if (r.success && r.data?.length) {
            this.availableSymbols.set(r.data);
            // Pre-poblar 4 símbolos sugeridos para heatmap
            const sugeridos = ['VOO', 'SPY', 'QQQ', 'GLD'].filter(s => r.data.includes(s));
            const ini = sugeridos.length >= 2 ? sugeridos.slice(0, 4)
                                              : r.data.slice(0, 4);
            this.selectedSymbols.set(ini);
            this.candleSymbol.set(r.data[0] ?? '');
            this.symbolToAdd.set(r.data[0] ?? '');
          }
        },
        error: e => this.heatmapError.set(e.message),
      });
  }

  // ===================================================================
  //   Acciones Tab 1 - Heatmap
  // ===================================================================
  agregarSymbol(): void {
    const s = this.symbolToAdd();
    if (!s) return;
    const list = this.selectedSymbols();
    if (list.includes(s)) return;
    if (list.length >= 12) {
      this.heatmapError.set('Maximo 12 activos para no saturar la matriz.');
      return;
    }
    this.selectedSymbols.set([...list, s]);
    this.heatmapError.set(null);
  }

  quitarSymbol(s: string): void {
    this.selectedSymbols.set(this.selectedSymbols().filter(x => x !== s));
  }

  calcularMatriz(): void {
    const symbols = this.selectedSymbols();
    if (symbols.length < 2) {
      this.heatmapError.set('Selecciona al menos 2 activos.');
      return;
    }
    this.heatmapError.set(null);
    this.heatmapLoading.set(true);
    this.heatmapResult.set(null);

    this.api.getCorrelationMatrix(symbols, this.heatmapMetric())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => {
          this.heatmapLoading.set(false);
          if (r.success && r.data) this.heatmapResult.set(r.data);
          else this.heatmapError.set(r.message ?? 'Respuesta vacia.');
        },
        error: e => { this.heatmapLoading.set(false); this.heatmapError.set(e.message); },
      });
  }

  /** Color de una celda del heatmap segun el valor de correlación. */
  cellColor(value: number): string {
    // -1 -> rojo, 0 -> blanco/transparente, +1 -> verde emerald
    const v = Math.max(-1, Math.min(1, value));
    if (v >= 0) {
      const alpha = v.toFixed(2);
      return `rgba(16, 185, 129, ${alpha})`;
    } else {
      const alpha = (-v).toFixed(2);
      return `rgba(239, 68, 68, ${alpha})`;
    }
  }

  /** Color del texto: claro u oscuro segun intensidad del fondo. */
  cellTextColor(value: number): string {
    return Math.abs(value) > 0.55 ? '#ffffff' : 'inherit';
  }

  // ===================================================================
  //   Acciones Tab 2 - Velas + SMA
  // ===================================================================
  cargarVelas(): void {
    const symbol = this.candleSymbol();
    if (!symbol) { this.candleError.set('Selecciona un activo.'); return; }
    const smas = this.candleSMAs()
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => Number.isFinite(n) && n >= 2);

    this.candleError.set(null);
    this.candleLoading.set(true);
    this.candleResult.set(null);

    this.api.getCandlesWithSMA(symbol, smas, this.candleLimit())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => {
          this.candleLoading.set(false);
          if (r.success && r.data) this.candleResult.set(r.data);
          else this.candleError.set(r.message ?? 'Respuesta vacia.');
        },
        error: e => { this.candleLoading.set(false); this.candleError.set(e.message); },
      });
  }

  // -- Calculo de geometría para el SVG de velas (memoizado) --

  readonly candleGeometry = computed(() => {
    const r = this.candleResult();
    if (!r) return null;

    const W = this.candleViewBox().width;
    const H = this.candleViewBox().height;

    // Layout: panel de precios arriba (75%), panel de volumen abajo (20%)
    // separados por un pequeño gap. Todo el SVG comparte el mismo eje X.
    const PAD = { top: 20, right: 70, bottom: 32, left: 70 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const PRICE_RATIO = 0.74;
    const VOL_RATIO   = 0.20;
    const GAP         = innerH * (1 - PRICE_RATIO - VOL_RATIO);

    const priceTop    = PAD.top;
    const priceHeight = innerH * PRICE_RATIO;
    const volTop      = priceTop + priceHeight + GAP;
    const volHeight   = innerH * VOL_RATIO;

    const c = r.candles;
    const n = c.dates.length;
    if (n === 0) return null;

    // -- Min/max de la region de precios (incluye SMAs) --
    let yMin = Infinity, yMax = -Infinity;
    for (let i = 0; i < n; i++) {
      if (c.lows[i]  < yMin) yMin = c.lows[i];
      if (c.highs[i] > yMax) yMax = c.highs[i];
    }
    for (const sma of r.smas) {
      for (const v of sma.values) {
        if (v == null) continue;
        if (v < yMin) yMin = v;
        if (v > yMax) yMax = v;
      }
    }
    // Margen visual del 3% arriba/abajo
    const margin = (yMax - yMin) * 0.03;
    yMin -= margin; yMax += margin;
    const range = yMax - yMin || 1;

    const yScale = (v: number) => priceTop + priceHeight - ((v - yMin) / range) * priceHeight;

    // -- Eje X compartido --
    // Espaciado entre velas (en lugar de entre puntos) -> usar n+0.5
    const xStep  = innerW / Math.max(n, 1);
    const xScale = (i: number) => PAD.left + (i + 0.5) * xStep;
    // Ancho del cuerpo de la vela: mas grueso, minimo 3px, maximo 16px
    const candleWidth = Math.min(16, Math.max(3, xStep * 0.75));

    // -- Construir velas --
    const candles = [];
    for (let i = 0; i < n; i++) {
      const x = xScale(i);
      const isUp = c.closes[i] >= c.opens[i];
      const yHigh = yScale(c.highs[i]);
      const yLow  = yScale(c.lows[i]);
      const yOpen = yScale(c.opens[i]);
      const yClose = yScale(c.closes[i]);
      const top = Math.min(yOpen, yClose);
      const bot = Math.max(yOpen, yClose);
      candles.push({
        x, isUp,
        yHigh, yLow,
        rectY: top,
        rectH: Math.max(1, bot - top),
        rectX: x - candleWidth / 2,
        rectW: candleWidth,
        date: c.dates[i],
        open: c.opens[i], high: c.highs[i],
        low: c.lows[i],   close: c.closes[i],
      });
    }

    // -- Paths de SMAs (sobre el panel de precios) --
    const smaPalette = ['#3b82f6', '#f59e0b', '#a855f7', '#06b6d4'];
    const smaPaths = r.smas.map((s, idx) => {
      const segs: string[] = [];
      let prevValid = false;
      for (let i = 0; i < n; i++) {
        const v = s.values[i];
        if (v == null) { prevValid = false; continue; }
        const px = xScale(i);
        const py = yScale(v);
        segs.push((prevValid ? 'L' : 'M') + px.toFixed(2) + ',' + py.toFixed(2));
        prevValid = true;
      }
      return {
        window: s.window,
        d: segs.join(' '),
        color: smaPalette[idx % smaPalette.length],
      };
    });

    // -- Panel de volumen --
    let volMax = 0;
    for (let i = 0; i < n; i++) if (c.volumes[i] > volMax) volMax = c.volumes[i];
    if (volMax === 0) volMax = 1;

    const volBars = [];
    for (let i = 0; i < n; i++) {
      const x = xScale(i);
      const isUp = c.closes[i] >= c.opens[i];
      const h = (c.volumes[i] / volMax) * volHeight;
      volBars.push({
        x: x - candleWidth / 2,
        y: volTop + volHeight - h,
        w: candleWidth,
        h: Math.max(1, h),
        isUp,
      });
    }

    // -- Ejes --
    const yTickCount = 5;
    const yTicks = [];
    for (let k = 0; k < yTickCount; k++) {
      const v = yMin + (k * range) / (yTickCount - 1);
      yTicks.push({ v, y: yScale(v) });
    }
    // Eje secundario para volumen (3 labels)
    const volTicks = [
      { v: 0,        y: volTop + volHeight },
      { v: volMax/2, y: volTop + volHeight / 2 },
      { v: volMax,   y: volTop },
    ];

    // X labels - 6 fechas equiespaciadas
    const xCount = Math.min(6, n);
    const xTicks = [];
    for (let k = 0; k < xCount; k++) {
      const i = Math.round((k * (n - 1)) / Math.max(xCount - 1, 1));
      xTicks.push({ x: xScale(i), label: c.dates[i] });
    }

    return {
      W, H, PAD,
      priceTop, priceHeight, volTop, volHeight,
      candles, smaPaths, volBars,
      yTicks, volTicks, xTicks,
      yMin, yMax, volMax,
    };
  });

  /** Formatea numeros grandes de volumen: 1234567 -> "1.2M". */
  formatVolume(v: number): string {
    if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return v.toFixed(0);
  }

  // ===================================================================
  //   Tab 3 - Exportar PDF
  // ===================================================================
  exportarPDF(): void {
    // Aprovecha el dialogo nativo de impresion del navegador con
    // un stylesheet @media print que oculta el shell y solo muestra
    // el contenido marcado con la clase .print-area.
    window.print();
  }

  // -- Helpers --
  trackSymbol = (_: number, s: string) => s;
  trackCandle = (i: number) => i;

  /** Etiqueta corta para el badge de la categoria de correlacion. */
  classifyCorrelation(v: number): string {
    if (v >= 0.7)   return 'fuerte (+)';
    if (v >= 0.3)   return 'moderada (+)';
    if (v >  -0.3)  return 'baja';
    if (v >  -0.7)  return 'moderada (-)';
    return 'fuerte (-)';
  }

  /**
   * Devuelve solo los numeros de ventana de las SMAs como string legible,
   * p.ej. "[20, 50]". Se usa en el reporte PDF para evitar volcar el JSON
   * completo (con los arrays de valores y nulls) en el documento.
   */
  smaWindowsLabel(smas: SmaSeries[]): string {
    return '[' + smas.map(s => s.window).join(', ') + ']';
  }
}
