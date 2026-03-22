import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  AfterViewChecked,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { DecimalPipe, DatePipe, NgClass } from '@angular/common';

import { ALGORITHMS, AlgorithmMockService } from '@core';
import type { SortRecord, AlgorithmInfo } from '@core';

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
  themeVariables: {
    primaryColor: '#10b981',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#34d399',
    lineColor: '#64748b',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
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
export class AlgorithmExplorerComponent implements AfterViewChecked {
  private readonly mockService = inject(AlgorithmMockService);

  @ViewChild('docsContainer') docsContainer!: ElementRef<HTMLDivElement>;

  // ── Static data ──
  readonly algorithms: readonly AlgorithmInfo[] = ALGORITHMS;

  // ── UI State ──
  readonly selectedAlgorithmId = signal<string>('timsort');
  readonly activeTab = signal<'docs' | 'code'>('docs');
  readonly isExecuting = signal<boolean>(false);

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

  // ── Mermaid rendering tracking ──
  private needsMermaidRender = false;
  private mermaidRendered = false;

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
  }

  // ── Actions ──

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
      const result = await this.mockService.executeAlgorithm(this.selectedAlgorithmId());
      this.executionTimeMs.set(result.executionTimeMs);
      this.recordsSorted.set(result.recordsSorted);
      this.resultData.set(result.data);
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

  // ── Internal ──

  private loadContent(algorithmId: string): void {
    // Load documentation
    const markdown = this.mockService.getDocumentation(algorithmId);
    const html = marked.parse(markdown) as string;
    this.renderedMarkdown.set(html);

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

      const graphDefinition = codeEl.textContent ?? '';
      const id = `mermaid-${this.selectedAlgorithmId()}-${i}`;

      try {
        const { svg } = await mermaid.render(id, graphDefinition);
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-diagram';
        wrapper.innerHTML = svg;
        pre.replaceWith(wrapper);
      } catch (err) {
        console.warn('Mermaid render error:', err);
      }
    }
  }
}
