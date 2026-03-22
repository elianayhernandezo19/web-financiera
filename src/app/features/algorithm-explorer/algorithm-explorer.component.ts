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
  flowchart: { curve: 'basis', padding: 16 },
  themeVariables: {
    primaryColor: '#10b981',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#34d399',
    lineColor: '#64748b',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    fontSize: '13px',
  },
});

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
  readonly fullscreenSvg = signal<string | null>(null);

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
    this.fullscreenSvg.set(svgHtml);
    this.fsEventsAttached = false;
    this.fsCleanup?.();
    this.fsCleanup = null;
  }

  closeFullscreen(): void {
    this.fullscreenSvg.set(null);
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

      // Fix common markdown issues for Mermaid:
      // 1. Remove carriage returns (\r) which violently crash Mermaid's jison grammar parser in Windows/HTTP environments
      graphDefinition = graphDefinition.replace(/\r/g, '');

      // 2. Replace escaped \n string literals with HTML <br/> since Mermaid Node Strings need <br/>
      graphDefinition = graphDefinition.replace(/\\n/g, '<br/>');

      const uniqueHash = Math.random().toString(36).substring(2, 9);
      const id = `mermaid-${this.selectedAlgorithmId()}-${i}-${uniqueHash}`;

      try {
        const { svg } = await mermaid.render(id, graphDefinition);
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-diagram';
        // Add styling to make sure it looks professional and visible
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = 'center';
        wrapper.style.margin = '2rem 0';
        wrapper.style.padding = '1rem';
        wrapper.style.background = 'rgba(0, 0, 0, 0.2)';
        wrapper.style.borderRadius = '8px';
        wrapper.innerHTML = svg;

        // Ensure svg resizes correctly
        const svgEl = wrapper.querySelector('svg');
        if (svgEl) {
          svgEl.style.maxWidth = '100%';
          svgEl.style.height = 'auto';
        }

        pre.replaceWith(wrapper);
      } catch (err) {
        console.warn('Mermaid render error for diagram:', graphDefinition, err);
        const errorDiv = document.createElement('div');
        errorDiv.style.border = '1px solid #ef4444';
        errorDiv.style.background = 'rgba(239, 68, 68, 0.1)';
        errorDiv.style.padding = '1rem';
        errorDiv.style.borderRadius = '8px';
        errorDiv.innerHTML = `
          <strong style="color: #ef4444;">Detección de Error en Diagrama Mermaid:</strong>
          <pre style="color: #f8fafc; font-size: 11px; margin-top: 0.5rem; white-space: pre-wrap;">${graphDefinition}</pre>
        `;
        pre.replaceWith(errorDiv);
      }
    }
  }
}
