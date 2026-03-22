import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  AfterViewChecked,
  OnDestroy,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import { DecimalPipe, DatePipe, NgClass } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { ALGORITHMS, AlgorithmMockService, ApiService } from '@core';
import type { SortRecord, AlgorithmInfo } from '@core';
import { firstValueFrom } from 'rxjs';

import { marked } from 'marked';
import mermaid from 'mermaid';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';

// Register TypeScript for highlight.js
hljs.registerLanguage('typescript', typescript);

// Configure mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  flowchart: { curve: 'basis', padding: 12, nodeSpacing: 30, rankSpacing: 40 },
  themeVariables: {
    primaryColor: '#10b981',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#34d399',
    lineColor: '#64748b',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    fontSize: '12px',
  },
});

/**
 * Reliably get the intrinsic width or height of a Mermaid-generated SVG.
 * Mermaid v11 may set width="100%" with style="max-width: 1543px;".
 * We need the real pixel size, not percentages.
 */
function getSvgIntrinsicSize(svg: SVGSVGElement, dim: 'width' | 'height'): number {
  // 1) Explicit pixel attribute (skip percentages)
  const attrStr = svg.getAttribute(dim) || '';
  if (attrStr && !attrStr.includes('%')) {
    const val = parseFloat(attrStr);
    if (val > 0) return val;
  }

  // 2) style.maxWidth / style.maxHeight (Mermaid v11 sets max-width in style)
  const styleProp = dim === 'width' ? 'maxWidth' : 'maxHeight';
  const styleVal = parseFloat(svg.style[styleProp] || '');
  if (styleVal > 0) return styleVal;

  // 3) viewBox
  const vb = svg.viewBox?.baseVal;
  if (vb) {
    const v = dim === 'width' ? vb.width : vb.height;
    if (v > 0) return v;
  }

  // 4) getBBox (SVG internal coordinate system)
  try {
    const bbox = svg.getBBox();
    const v = dim === 'width' ? (bbox.x + bbox.width) : (bbox.y + bbox.height);
    if (v > 0) return v;
  } catch { /* getBBox can throw if SVG not in DOM */ }

  // 5) getBoundingClientRect (layout size, last resort)
  const rect = svg.getBoundingClientRect();
  return dim === 'width' ? rect.width : rect.height;
}

@Component({
  selector: 'app-algorithm-explorer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [DecimalPipe, DatePipe, NgClass],
  templateUrl: './algorithm-explorer.component.html',
  styleUrl: './algorithm-explorer.component.scss',
})
export class AlgorithmExplorerComponent implements AfterViewChecked, OnDestroy {
  private readonly mockService = inject(AlgorithmMockService);
  private readonly apiService = inject(ApiService);
  private readonly sanitizer = inject(DomSanitizer);

  @ViewChild('docsContainer') docsContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('fsViewport') fsViewport?: ElementRef<HTMLDivElement>;
  @ViewChild('fsContent') fsContent?: ElementRef<HTMLDivElement>;

  // ── Static data ──
  readonly algorithms: readonly AlgorithmInfo[] = ALGORITHMS;

  // ── UI State ──
  readonly selectedAlgorithmId = signal<string>('timsort');
  readonly activeTab = signal<'docs' | 'code'>('docs');
  readonly isExecuting = signal<boolean>(false);
  readonly isExpanded = signal<boolean>(false);

  // ── Execution Results ──
  readonly executionTimeMs = signal<number | null>(null);
  readonly recordsSorted = signal<number | null>(null);
  readonly resultData = signal<SortRecord[]>([]);

  // ── Paginator ──
  readonly currentPage = signal<number>(1);
  readonly pageSize = 15;

  // ── Content ──
  readonly renderedMarkdown = signal<string>('');
  readonly sourceCode = signal<string>('');
  readonly highlightedCode = signal<string>('');

  // ── Fullscreen Diagram ──
  readonly fullscreenSvg = signal<SafeHtml | null>(null);
  private fullscreenRawSvg: string | null = null;

  // ── Mermaid rendering tracking ──
  private needsMermaidRender = false;
  private mermaidRendered = false;
  private fsEventsAttached = false;
  private fsCleanup: (() => void) | null = null;

  // ── Computed ──
  readonly selectedAlgorithm = computed(() =>
    this.algorithms.find(a => a.id === this.selectedAlgorithmId()) ?? this.algorithms[0]
  );

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.resultData().length / this.pageSize))
  );

  readonly paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.resultData().slice(start, start + this.pageSize);
  });

  constructor() {
    // Load initial content
    this.loadContent('timsort');
  }

  ngAfterViewChecked(): void {
    if (this.needsMermaidRender && !this.mermaidRendered && this.docsContainer) {
      this.renderMermaidDiagrams();
    }
    if (this.fullscreenSvg() && this.fsViewport && this.fsContent && !this.fsEventsAttached) {
      this.attachFsZoomPan();
    }
  }

  ngOnDestroy(): void {
    this.fsCleanup?.();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.fullscreenSvg()) {
      this.closeFullscreen();
    }
  }

  // ── Actions ──

  toggleExpand(): void {
    this.isExpanded.update(v => !v);
  }

  onAlgorithmChange(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.selectedAlgorithmId.set(id);
    this.loadContent(id);

    // Reset execution results
    this.executionTimeMs.set(null);
    this.recordsSorted.set(null);
    this.resultData.set([]);
    this.currentPage.set(1);
  }

  onTabChange(tab: 'docs' | 'code'): void {
    this.activeTab.set(tab);
    if (tab === 'docs') {
      this.needsMermaidRender = true;
      this.mermaidRendered = false;
    }
  }

  async onExecute(): Promise<void> {
    if (this.isExecuting()) return;

    this.isExecuting.set(true);
    this.executionTimeMs.set(null);
    this.recordsSorted.set(null);
    this.resultData.set([]);
    this.currentPage.set(1);

    try {
      const response = await firstValueFrom(this.apiService.executeAlgorithmLab(this.selectedAlgorithmId()));
      if (response && response.data) {
        this.executionTimeMs.set(response.data.executionTimeMs);
        this.recordsSorted.set(response.data.totalRecords ?? response.data.size);
        this.resultData.set(response.data.data);
      }
    } catch (err) {
      console.error('Execution error:', err);
    } finally {
      this.isExecuting.set(false);
    }
  }

  onPageChange(direction: 'prev' | 'next'): void {
    const current = this.currentPage();
    if (direction === 'prev' && current > 1) {
      this.currentPage.set(current - 1);
    } else if (direction === 'next' && current < this.totalPages()) {
      this.currentPage.set(current + 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  openFullscreen(svgHtml: string): void {
    this.fullscreenRawSvg = svgHtml;
    this.fullscreenSvg.set(this.sanitizer.bypassSecurityTrustHtml(svgHtml));
    this.fsEventsAttached = false;
    this.fsCleanup?.();
    this.fsCleanup = null;
  }

  closeFullscreen(): void {
    this.fullscreenSvg.set(null);
    this.fullscreenRawSvg = null;
    this.fsEventsAttached = false;
    this.fsCleanup?.();
    this.fsCleanup = null;
  }

  // ── Internal ──

  private async loadContent(algorithmId: string): Promise<void> {
    // Load documentation
    try {
      const response = await firstValueFrom(this.apiService.getAlgorithmDocs(algorithmId));
      if (response && response.data) {
        const markdown = response.data.content;
        const html = marked.parse(markdown) as string;
        this.renderedMarkdown.set(html);
      }
    } catch (err) {
      console.error('Error loading docs from API, falling back to mock:', err);
      const markdown = this.mockService.getDocumentation(algorithmId);
      const html = marked.parse(markdown) as string;
      this.renderedMarkdown.set(html);
    }

    // Load source code
    const code = this.mockService.getSourceCode(algorithmId);
    this.sourceCode.set(code);

    // Highlight source code
    const highlighted = hljs.highlight(code, { language: 'typescript' });
    this.highlightedCode.set(highlighted.value);

    // Request mermaid render on next view check
    this.needsMermaidRender = true;
    this.mermaidRendered = false;
  }

  private async renderMermaidDiagrams(): Promise<void> {
    this.mermaidRendered = true;
    this.needsMermaidRender = false;

    if (!this.docsContainer) return;

    const container = this.docsContainer.nativeElement;
    const codeBlocks = container.querySelectorAll('code.language-mermaid');

    for (let i = 0; i < codeBlocks.length; i++) {
      const codeEl = codeBlocks[i];
      const pre = codeEl.parentElement;
      if (!pre) continue;

      let graphDefinition = codeEl.textContent ?? '';
      graphDefinition = graphDefinition.replace(/\r/g, '');
      // Replace literal \n with <br> for Mermaid multi-line node labels
      graphDefinition = graphDefinition.replace(/\\n/g, '<br>');

      const uniqueHash = Math.random().toString(36).substring(2, 9);
      const id = `mermaid-${this.selectedAlgorithmId()}-${i}-${uniqueHash}`;

      try {
        const { svg } = await mermaid.render(id, graphDefinition);
        const wrapper = this.createDiagramWrapper(svg, i);
        pre.replaceWith(wrapper);
      } catch (err) {
        console.warn('Mermaid render error for diagram:', err);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mermaid-error';
        errorDiv.innerHTML = `<strong>Error en diagrama Mermaid</strong><pre>${this.escapeHtml(graphDefinition)}</pre>`;
        pre.replaceWith(errorDiv);
      }
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private createDiagramWrapper(svg: string, diagramIndex: number): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'mermaid-container';

    wrapper.innerHTML = `
      <div class="mermaid-toolbar">
        <span class="mermaid-toolbar__label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          Diagrama ${diagramIndex + 1}
        </span>
        <div class="mermaid-toolbar__actions">
          <button class="mermaid-btn" data-action="zoom-out" title="Alejar (-)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <span class="mermaid-zoom-label">100%</span>
          <button class="mermaid-btn" data-action="zoom-in" title="Acercar (+)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <span class="mermaid-toolbar__sep"></span>
          <button class="mermaid-btn" data-action="fit" title="Ajustar al contenedor">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
          </button>
          <button class="mermaid-btn" data-action="fullscreen" title="Pantalla completa">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          </button>
        </div>
      </div>
      <div class="mermaid-viewport">
        <div class="mermaid-content">${svg}</div>
      </div>
      <div class="mermaid-hint">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        Scroll para zoom · Arrastra para mover
      </div>
    `;

    this.attachZoomPanEvents(wrapper);
    return wrapper;
  }

  private attachZoomPanEvents(wrapper: HTMLElement): void {
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const viewport = wrapper.querySelector('.mermaid-viewport') as HTMLElement;
    const content = wrapper.querySelector('.mermaid-content') as HTMLElement;
    const zoomLabel = wrapper.querySelector('.mermaid-zoom-label') as HTMLElement;

    const applyTransform = () => {
      content.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
      zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
    };

    const autoFit = () => {
      const svgEl = content.querySelector('svg');
      if (!svgEl) return;
      const vpW = viewport.clientWidth;
      const vpH = viewport.clientHeight;
      if (vpW === 0 || vpH === 0) return;

      // Robust SVG intrinsic size detection
      const svgW = getSvgIntrinsicSize(svgEl, 'width');
      const svgH = getSvgIntrinsicSize(svgEl, 'height');
      if (svgW === 0 || svgH === 0) return;

      const pad = 24;
      const fitW = (vpW - pad) / svgW;
      const fitH = (vpH - pad) / svgH;
      zoom = Math.min(fitW, fitH);
      zoom = Math.max(0.05, zoom);

      // Center the diagram
      const scaledW = svgW * zoom;
      const scaledH = svgH * zoom;
      panX = (vpW - scaledW) / 2;
      panY = (vpH - scaledH) / 2;

      applyTransform();
    };

    // Auto-fit with retry (viewport may not be laid out immediately)
    const tryAutoFit = (retries = 5) => {
      requestAnimationFrame(() => {
        const svgEl = content.querySelector('svg');
        const w = getSvgIntrinsicSize(svgEl!, 'width');
        if (viewport.clientWidth > 0 && svgEl && w > 10) {
          autoFit();
        } else if (retries > 0) {
          setTimeout(() => tryAutoFit(retries - 1), 80);
        }
      });
    };
    tryAutoFit();

    // Wheel zoom (centered on pointer)
    viewport.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const rect = viewport.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const oldZoom = zoom;
      zoom = Math.max(0.05, Math.min(5, zoom * factor));
      const ratio = zoom / oldZoom;
      panX = mx - ratio * (mx - panX);
      panY = my - ratio * (my - panY);
      applyTransform();
    }, { passive: false });

    // Pointer drag
    viewport.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0) return;
      isDragging = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      viewport.setPointerCapture(e.pointerId);
      viewport.classList.add('is-dragging');
    });

    viewport.addEventListener('pointermove', (e: PointerEvent) => {
      if (!isDragging) return;
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      applyTransform();
    });

    viewport.addEventListener('pointerup', (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      viewport.releasePointerCapture(e.pointerId);
      viewport.classList.remove('is-dragging');
    });

    // Toolbar buttons
    wrapper.querySelectorAll('.mermaid-btn').forEach(btn => {
      btn.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        const action = (btn as HTMLElement).dataset['action'];
        const cx = viewport.clientWidth / 2;
        const cy = viewport.clientHeight / 2;
        switch (action) {
          case 'zoom-in': {
            const oldZoom = zoom;
            zoom = Math.min(5, zoom * 1.3);
            const r = zoom / oldZoom;
            panX = cx - r * (cx - panX);
            panY = cy - r * (cy - panY);
            applyTransform();
            break;
          }
          case 'zoom-out': {
            const oldZoom = zoom;
            zoom = Math.max(0.05, zoom * 0.7);
            const r = zoom / oldZoom;
            panX = cx - r * (cx - panX);
            panY = cy - r * (cy - panY);
            applyTransform();
            break;
          }
          case 'fit':
            autoFit();
            break;
          case 'fullscreen':
            this.openFullscreen(content.innerHTML);
            break;
        }
      });
    });
  }

  private attachFsZoomPan(): void {
    this.fsEventsAttached = true;
    this.fsCleanup?.();

    const viewport = this.fsViewport!.nativeElement;
    const content = this.fsContent!.nativeElement;

    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const zoomLabel = viewport.closest('.fs-container')?.querySelector('.fs-zoom-label') as HTMLElement | null;

    const applyTransform = () => {
      content.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
      if (zoomLabel) zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
    };

    const autoFitFs = () => {
      const svgEl = content.querySelector('svg');
      if (!svgEl) return;
      const vpW = viewport.clientWidth;
      const vpH = viewport.clientHeight;
      if (vpW === 0 || vpH === 0) return;

      const svgW = getSvgIntrinsicSize(svgEl, 'width');
      const svgH = getSvgIntrinsicSize(svgEl, 'height');
      if (svgW === 0 || svgH === 0) return;

      const pad = 64;
      const fitW = (vpW - pad) / svgW;
      const fitH = (vpH - pad) / svgH;
      zoom = Math.min(fitW, fitH); // scale up to fill — no cap
      zoom = Math.max(0.05, zoom);

      const scaledW = svgW * zoom;
      const scaledH = svgH * zoom;
      panX = (vpW - scaledW) / 2;
      panY = (vpH - scaledH) / 2;
      applyTransform();
    };

    // Auto-fit with retry
    const tryFit = (retries = 4) => {
      requestAnimationFrame(() => {
        if (viewport.clientWidth > 0 && content.querySelector('svg')) {
          autoFitFs();
        } else if (retries > 0) {
          setTimeout(() => tryFit(retries - 1), 60);
        }
      });
    };
    tryFit();

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const rect = viewport.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const oldZoom = zoom;
      zoom = Math.max(0.05, Math.min(5, zoom * factor));
      const ratio = zoom / oldZoom;
      panX = mx - ratio * (mx - panX);
      panY = my - ratio * (my - panY);
      applyTransform();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      isDragging = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      viewport.setPointerCapture(e.pointerId);
      viewport.classList.add('is-dragging');
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      applyTransform();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      viewport.releasePointerCapture(e.pointerId);
      viewport.classList.remove('is-dragging');
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', onPointerUp);

    // Fullscreen toolbar buttons
    const fsContainer = viewport.closest('.fs-container');
    const btnHandler = (e: Event) => {
      const action = (e.currentTarget as HTMLElement).dataset['fsAction'];
      const cx = viewport.clientWidth / 2;
      const cy = viewport.clientHeight / 2;
      switch (action) {
        case 'zoom-in': {
          const oldZ = zoom;
          zoom = Math.min(5, zoom * 1.3);
          const r = zoom / oldZ;
          panX = cx - r * (cx - panX);
          panY = cy - r * (cy - panY);
          applyTransform();
          break;
        }
        case 'zoom-out': {
          const oldZ = zoom;
          zoom = Math.max(0.05, zoom * 0.7);
          const r = zoom / oldZ;
          panX = cx - r * (cx - panX);
          panY = cy - r * (cy - panY);
          applyTransform();
          break;
        }
        case 'fit':
          autoFitFs();
          break;
      }
    };

    const fsBtns = fsContainer?.querySelectorAll('[data-fs-action]') ?? [];
    fsBtns.forEach(btn => btn.addEventListener('click', btnHandler));

    this.fsCleanup = () => {
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', onPointerUp);
      fsBtns.forEach(btn => btn.removeEventListener('click', btnHandler));
    };
  }
}
