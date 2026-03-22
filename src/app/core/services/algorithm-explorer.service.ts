import { Injectable } from '@angular/core';
import type { SortRecord } from '../models';

// ── Markdown documentation per algorithm (with Mermaid diagrams) ──

const ALGORITHM_DOCS: Record<string, string> = {
  timsort: `
# TimSort

**TimSort** es un algoritmo de ordenamiento híbrido derivado de **Merge Sort** e **Insertion Sort**, diseñado para funcionar de manera eficiente en datos del mundo real.

## Complejidad

| Caso | Complejidad |
|------|------------|
| Mejor | O(n) |
| Promedio | O(n log n) |
| Peor | O(n log n) |
| Espacio | O(n) |

## Diagrama de Flujo

\`\`\`mermaid
graph TD
    A[Inicio: Array desordenado] --> B{Tamaño < 64?}
    B -->|Sí| C[Insertion Sort directo]
    B -->|No| D[Dividir en runs naturales]
    D --> E[Ordenar cada run con Insertion Sort]
    E --> F[Fusionar runs con Merge Sort]
    F --> G[Array ordenado]
    C --> G
\`\`\`

## ¿Por qué es eficiente?

TimSort detecta **runs** (subsecuencias ya ordenadas) en los datos de entrada. Para datos financieros históricos, donde los precios siguen tendencias naturales, esto es particularmente efectivo ya que muchas subsecuencias ya están parcialmente ordenadas.

Es el **algoritmo por defecto** en Python (\`sorted()\`) y Java (\`Arrays.sort()\`).
`,

  quicksort: `
# QuickSort

**QuickSort** es un algoritmo de ordenamiento basado en la estrategia **Divide y Vencerás**. Selecciona un elemento como **pivote** y particiona el array alrededor de él.

## Complejidad

| Caso | Complejidad |
|------|------------|
| Mejor | O(n log n) |
| Promedio | O(n log n) |
| Peor | O(n²) |
| Espacio | O(log n) |

## Diagrama de Flujo

\`\`\`mermaid
graph TD
    A[Inicio: Array desordenado] --> B[Seleccionar pivote]
    B --> C[Particionar: menores a izquierda, mayores a derecha]
    C --> D{¿Sub-arrays tienen más de 1 elemento?}
    D -->|Sí| B
    D -->|No| E[Combinar particiones]
    E --> F[Array ordenado]
\`\`\`

## Consideraciones

- En el **peor caso** (datos ya ordenados + mal pivote), degrada a O(n²)
- Se recomienda usar **aleatorización del pivote** o **mediana de tres**
- Es **in-place** lo que lo hace eficiente en memoria
`,

  selectionsort: `
# Selection Sort

**Selection Sort** encuentra el mínimo en cada iteración y lo coloca en su posición final.

## Complejidad

| Caso | Complejidad |
|------|------------|
| Mejor | O(n²) |
| Promedio | O(n²) |
| Peor | O(n²) |
| Espacio | O(1) |

## Diagrama de Flujo

\`\`\`mermaid
graph TD
    A[Inicio] --> B[i = 0]
    B --> C[Buscar mínimo en array restante]
    C --> D[Intercambiar con posición i]
    D --> E{¿i < n-1?}
    E -->|Sí| F[i++]
    F --> C
    E -->|No| G[Array ordenado]
\`\`\`

## Características
- Siempre realiza O(n²) comparaciones
- Solo realiza O(n) intercambios
- Simple pero ineficiente para conjuntos grandes
`,

  insertionsort: `
# Insertion Sort

**Insertion Sort** construye el array ordenado uno a uno, insertando cada nuevo elemento en su posición correcta.

## Complejidad

| Caso | Complejidad |
|------|------------|
| Mejor | O(n) |
| Promedio | O(n²) |
| Peor | O(n²) |
| Espacio | O(1) |

## Diagrama de Flujo

\`\`\`mermaid
graph TD
    A[Inicio] --> B[Tomar siguiente elemento]
    B --> C[Comparar con elementos anteriores]
    C --> D{¿Menor que anterior?}
    D -->|Sí| E[Desplazar anterior a la derecha]
    E --> C
    D -->|No| F[Insertar en posición actual]
    F --> G{¿Más elementos?}
    G -->|Sí| B
    G -->|No| H[Array ordenado]
\`\`\`

## Caso de uso ideal
- Muy eficiente para arrays **casi ordenados**
- Excelente para conjuntos pequeños (n < 30)
- Usado internamente por TimSort para runs pequeños
`,

  mergesort: `
# Merge Sort

**Merge Sort** divide recursivamente el array y fusiona las mitades ya ordenadas.

## Complejidad

| Caso | Complejidad |
|------|------------|
| Mejor | O(n log n) |
| Promedio | O(n log n) |
| Peor | O(n log n) |
| Espacio | O(n) |

## Diagrama de Flujo

\`\`\`mermaid
graph TD
    A[Array original] --> B[Dividir en dos mitades]
    B --> C[Mitad izquierda]
    B --> D[Mitad derecha]
    C --> E{¿Tamaño > 1?}
    D --> F{¿Tamaño > 1?}
    E -->|Sí| B
    F -->|Sí| B
    E -->|No| G[Fusionar ordenadamente]
    F -->|No| G
    G --> H[Array ordenado]
\`\`\`

## Ventajas
- Garantiza O(n log n) en **todos** los casos
- Es **estable** (mantiene el orden relativo de iguales)
- Ideal para datos externos (disco) y listas enlazadas
`,

  bubblesort: `
# Bubble Sort

**Bubble Sort** intercambia pares adyacentes repetidamente hasta que el array esté ordenado.

## Complejidad

| Caso | Complejidad |
|------|------------|
| Mejor | O(n) |
| Promedio | O(n²) |
| Peor | O(n²) |
| Espacio | O(1) |

## Diagrama de Flujo

\`\`\`mermaid
graph TD
    A[Inicio] --> B[Recorrer array]
    B --> C{¿Elemento > siguiente?}
    C -->|Sí| D[Intercambiar]
    C -->|No| E[Avanzar]
    D --> E
    E --> F{¿Fin del recorrido?}
    F -->|No| C
    F -->|Sí| G{¿Hubo intercambios?}
    G -->|Sí| B
    G -->|No| H[Array ordenado]
\`\`\`

## Nota pedagógica
- Principalmente con valor educativo
- Puede detectar datos ya ordenados en O(n)
`,

  shellsort: `
# Shell Sort

**Shell Sort** es una generalización de Insertion Sort que compara elementos separados por una brecha decreciente.

## Complejidad

| Caso | Complejidad |
|------|------------|
| Mejor | O(n log n) |
| Promedio | O(n^1.25) |
| Peor | O(n²) |
| Espacio | O(1) |

## Diagrama de Flujo

\`\`\`mermaid
graph TD
    A[Inicio: gap = n/2] --> B[Aplicar Insertion Sort con gap actual]
    B --> C{¿gap > 1?}
    C -->|Sí| D[gap = gap / 2]
    D --> B
    C -->|No| E[Array ordenado]
\`\`\`

## Características
- Elimina eficientemente las "tortugas" (valores pequeños al final)
- In-place con buen rendimiento práctico
`,

  heapsort: `
# Heap Sort

**Heap Sort** construye un heap binario máximo y extrae repetidamente el máximo.

## Complejidad

| Caso | Complejidad |
|------|------------|
| Mejor | O(n log n) |
| Promedio | O(n log n) |
| Peor | O(n log n) |
| Espacio | O(1) |

## Diagrama de Flujo

\`\`\`mermaid
graph TD
    A[Array desordenado] --> B[Construir Max-Heap]
    B --> C[Extraer máximo del heap]
    C --> D[Colocar al final del array]
    D --> E[Re-heapificar]
    E --> F{¿Heap vacío?}
    F -->|No| C
    F -->|Sí| G[Array ordenado]
\`\`\`

## Ventajas
- O(n log n) garantizado sin peor caso cuadrático
- In-place (O(1) espacio auxiliar)
`,

  countingsort: `
# Counting Sort

**Counting Sort** cuenta las frecuencias de cada valor y reconstruye el array.

## Complejidad

| Caso | Complejidad |
|------|------------|
| Mejor | O(n + k) |
| Promedio | O(n + k) |
| Peor | O(n + k) |
| Espacio | O(n + k) |

\`\`\`mermaid
graph TD
    A[Array de entrada] --> B[Contar frecuencias]
    B --> C[Calcular posiciones acumuladas]
    C --> D[Construir array de salida]
    D --> E[Array ordenado]
\`\`\`

## Nota
- No es un algoritmo de comparación
- Lineal cuando k (rango) es pequeño respecto a n
`,

  radixsort: `
# Radix Sort

**Radix Sort** ordena dígito a dígito usando un algoritmo estable (como Counting Sort) en cada pasada.

## Complejidad

| Caso | Complejidad |
|------|------------|
| Mejor | O(d × (n + k)) |
| Promedio | O(d × (n + k)) |
| Peor | O(d × (n + k)) |
| Espacio | O(n + k) |

\`\`\`mermaid
graph TD
    A[Array de entrada] --> B[Procesar dígito menos significativo]
    B --> C[Counting Sort estable por ese dígito]
    C --> D{¿Más dígitos?}
    D -->|Sí| B
    D -->|No| E[Array ordenado]
\`\`\`
`,

  bucketsort: `
# Bucket Sort

**Bucket Sort** distribuye elementos en cubos y ordena cada cubo individualmente.

## Complejidad

| Caso | Complejidad |
|------|------------|
| Mejor | O(n + k) |
| Promedio | O(n + k) |
| Peor | O(n²) |
| Espacio | O(n + k) |

\`\`\`mermaid
graph TD
    A[Array de entrada] --> B[Distribuir en k cubos]
    B --> C[Ordenar cada cubo]
    C --> D[Concatenar cubos]
    D --> E[Array ordenado]
\`\`\`

## Ideal para
- Datos uniformemente distribuidos
- Retornos financieros normalizados
`,

  combsort: `
# Comb Sort

**Comb Sort** mejora Bubble Sort usando una brecha decreciente (factor ≈ 1.3).

## Complejidad

| Caso | Complejidad |
|------|------------|
| Mejor | O(n log n) |
| Promedio | O(n²/2^p) |
| Peor | O(n²) |
| Espacio | O(1) |

\`\`\`mermaid
graph TD
    A[Inicio: gap = n] --> B[gap = floor gap / 1.3]
    B --> C[Comparar elementos separados por gap]
    C --> D{¿Elemento > elemento + gap?}
    D -->|Sí| E[Intercambiar]
    D -->|No| F[Avanzar]
    E --> F
    F --> G{¿Fin del recorrido?}
    G -->|No| C
    G -->|Sí| H{¿gap > 1 o hubo intercambios?}
    H -->|Sí| B
    H -->|No| I[Array ordenado]
\`\`\`

## Ventaja clave
- Elimina "tortugas" de Bubble Sort eficientemente
- Significativamente más rápido que Bubble en la práctica
`,
};

// ── Source code per algorithm ──

const ALGORITHM_CODE: Record<string, string> = {
  timsort: `function timSort(arr: number[]): number[] {
  const RUN = 32;
  const n = arr.length;

  // Insertion Sort para runs pequeños
  for (let i = 0; i < n; i += RUN) {
    insertionSort(arr, i, Math.min(i + RUN - 1, n - 1));
  }

  // Merge runs progresivamente
  for (let size = RUN; size < n; size *= 2) {
    for (let left = 0; left < n; left += 2 * size) {
      const mid = Math.min(left + size - 1, n - 1);
      const right = Math.min(left + 2 * size - 1, n - 1);
      if (mid < right) {
        merge(arr, left, mid, right);
      }
    }
  }
  return arr;
}`,

  quicksort: `function quickSort(arr: number[], lo = 0, hi = arr.length - 1): number[] {
  if (lo < hi) {
    const pivot = partition(arr, lo, hi);
    quickSort(arr, lo, pivot - 1);
    quickSort(arr, pivot + 1, hi);
  }
  return arr;
}

function partition(arr: number[], lo: number, hi: number): number {
  const pivot = arr[hi];
  let i = lo - 1;

  for (let j = lo; j < hi; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
  return i + 1;
}`,

  selectionsort: `function selectionSort(arr: number[]): number[] {
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
  }
  return arr;
}`,

  insertionsort: `function insertionSort(arr: number[]): number[] {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;

    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}`,

  mergesort: `function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return [...result, ...left.slice(i), ...right.slice(j)];
}`,

  bubblesort: `function bubbleSort(arr: number[]): number[] {
  const n = arr.length;
  let swapped: boolean;

  for (let i = 0; i < n - 1; i++) {
    swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break; // Optimización: ya están ordenados
  }
  return arr;
}`,

  shellsort: `function shellSort(arr: number[]): number[] {
  let gap = Math.floor(arr.length / 2);

  while (gap > 0) {
    for (let i = gap; i < arr.length; i++) {
      const temp = arr[i];
      let j = i;

      while (j >= gap && arr[j - gap] > temp) {
        arr[j] = arr[j - gap];
        j -= gap;
      }
      arr[j] = temp;
    }
    gap = Math.floor(gap / 2);
  }
  return arr;
}`,

  heapsort: `function heapSort(arr: number[]): number[] {
  const n = arr.length;

  // Construir Max-Heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(arr, n, i);
  }

  // Extraer elementos uno a uno
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    heapify(arr, i, 0);
  }
  return arr;
}

function heapify(arr: number[], n: number, i: number): void {
  let largest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;

  if (left < n && arr[left] > arr[largest]) largest = left;
  if (right < n && arr[right] > arr[largest]) largest = right;

  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(arr, n, largest);
  }
}`,

  countingsort: `function countingSort(arr: number[]): number[] {
  const max = Math.max(...arr);
  const min = Math.min(...arr);
  const range = max - min + 1;
  const count = new Array(range).fill(0);
  const output = new Array(arr.length);

  // Contar frecuencias
  for (const val of arr) count[val - min]++;

  // Calcular posiciones acumuladas
  for (let i = 1; i < range; i++) count[i] += count[i - 1];

  // Construir salida (iterando en reversa para estabilidad)
  for (let i = arr.length - 1; i >= 0; i--) {
    output[count[arr[i] - min] - 1] = arr[i];
    count[arr[i] - min]--;
  }
  return output;
}`,

  radixsort: `function radixSort(arr: number[]): number[] {
  const max = Math.max(...arr);

  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    countingSortByDigit(arr, exp);
  }
  return arr;
}

function countingSortByDigit(arr: number[], exp: number): void {
  const n = arr.length;
  const output = new Array(n);
  const count = new Array(10).fill(0);

  for (const val of arr) {
    count[Math.floor(val / exp) % 10]++;
  }
  for (let i = 1; i < 10; i++) count[i] += count[i - 1];

  for (let i = n - 1; i >= 0; i--) {
    const digit = Math.floor(arr[i] / exp) % 10;
    output[count[digit] - 1] = arr[i];
    count[digit]--;
  }
  arr.splice(0, n, ...output);
}`,

  bucketsort: `function bucketSort(arr: number[]): number[] {
  const n = arr.length;
  if (n <= 1) return arr;

  const max = Math.max(...arr);
  const min = Math.min(...arr);
  const bucketCount = Math.floor(Math.sqrt(n));
  const bucketSize = (max - min) / bucketCount + 1;

  const buckets: number[][] = Array.from({ length: bucketCount }, () => []);

  // Distribuir en cubos
  for (const val of arr) {
    const idx = Math.min(
      Math.floor((val - min) / bucketSize),
      bucketCount - 1
    );
    buckets[idx].push(val);
  }

  // Ordenar cada cubo y concatenar
  return buckets.flatMap(b => b.sort((a, c) => a - c));
}`,

  combsort: `function combSort(arr: number[]): number[] {
  let gap = arr.length;
  const shrink = 1.3;
  let sorted = false;

  while (!sorted) {
    gap = Math.floor(gap / shrink);
    if (gap <= 1) {
      gap = 1;
      sorted = true;
    }

    for (let i = 0; i + gap < arr.length; i++) {
      if (arr[i] > arr[i + gap]) {
        [arr[i], arr[i + gap]] = [arr[i + gap], arr[i]];
        sorted = false;
      }
    }
  }
  return arr;
}`,
};

/**
 * AlgorithmMockService — Simulates backend endpoints for the Algorithm Explorer.
 * Uses Angular Signals for reactive state management.
 */
@Injectable({ providedIn: 'root' })
export class AlgorithmMockService {

  /**
   * GET /api/docs/:algoritmo
   * Returns markdown documentation including Mermaid diagrams.
   */
  getDocumentation(algorithmId: string): string {
    return ALGORITHM_DOCS[algorithmId] ?? `# ${algorithmId}\n\nDocumentación no disponible para este algoritmo.`;
  }

  /**
   * Returns the source code string for highlighting.
   */
  getSourceCode(algorithmId: string): string {
    return ALGORITHM_CODE[algorithmId] ?? `// Código fuente no disponible para: ${algorithmId}`;
  }

  /**
   * POST /api/sort/execute
   * Simulates a 2-second delay and returns mock sorted financial data.
   */
  executeAlgorithm(algorithmId: string): Promise<{
    executionTimeMs: number;
    recordsSorted: number;
    data: SortRecord[];
  }> {
    return new Promise((resolve) => {
      // Simulate real execution time with 2s delay
      const delay = 1500 + Math.random() * 1000;
      setTimeout(() => {
        const data = this.generateMockData(50);
        // Sort by date ascending (to simulate the algorithm actually sorting)
        data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        resolve({
          executionTimeMs: parseFloat((Math.random() * 30 + 5).toFixed(2)),
          recordsSorted: data.length,
          data,
        });
      }, delay);
    });
  }

  private generateMockData(count: number): SortRecord[] {
    const symbols = ['ECOPETROL', 'BANCOLOMBIA', 'GEB', 'NUTRESA', 'ISA', 'PFAVAL', 'GRUPOSURA'];
    const records: SortRecord[] = [];
    const baseDate = new Date('2024-01-02');

    for (let i = 0; i < count; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);

      const basePrice = 2000 + Math.random() * 80000;
      const open = parseFloat(basePrice.toFixed(2));
      const change = (Math.random() - 0.5) * basePrice * 0.05;
      const close = parseFloat((basePrice + change).toFixed(2));
      const high = parseFloat((Math.max(open, close) + Math.random() * basePrice * 0.02).toFixed(2));
      const low = parseFloat((Math.min(open, close) - Math.random() * basePrice * 0.02).toFixed(2));
      const volume = Math.floor(Math.random() * 10_000_000 + 500_000);

      records.push({
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        date: date.toISOString().slice(0, 10),
        open,
        high,
        low,
        close,
        volume,
      });
    }
    return records;
  }
}
