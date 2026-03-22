import type { AlgorithmInfo } from '../models';

/**
 * Catálogo estático de los 12 algoritmos de ordenamiento con sus fichas técnicas.
 * Al ser datos inmutables se declaran como `const` (sin signal) y se reutilizan
 * directamente en los componentes que los necesiten.
 */
export const ALGORITHMS: AlgorithmInfo[] = [
  {
    id: 'timsort',
    name: 'TimSort',
    complexity: { best: '', average: '', worst: '', space: '' },
    stable: true,
    description:
      'Híbrido de Merge Sort e Insertion Sort. Algoritmo por defecto en Python y Java. Muy eficiente en datos parcialmente ordenados, como series de precios históricos.',
  },
  {
    id: 'quicksort',
    name: 'QuickSort',
    complexity: { best: '', average: '', worst: '', space: '' },
    stable: false,
    description:
      'Divide y vencerás con selección de pivote. Excelente rendimiento promedio in-place, pero puede degradar a O(n²) en datos ya ordenados sin aleatorización del pivote.',
  },
  {
    id: 'selectionsort',
    name: 'Selection Sort',
    complexity: { best: '', average: '', worst: '', space: '' },
    stable: false,
    description:
      'Busca el mínimo restante en cada pasada y lo ubica en su posición final. Simple e in-place, pero cuadrático en todos los casos; útil solo para conjuntos muy pequeños.',
  },
  {
    id: 'insertionsort',
    name: 'Insertion Sort',
    complexity: { best: '', average: '', worst: '', space: '' },
    stable: true,
    description:
      'Construye el array ordenado insertando cada elemento en su posición correcta. Muy eficiente para datos casi ordenados o para lotes pequeños (n < 30), donde supera a QuickSort.',
  },
  {
    id: 'mergesort',
    name: 'Merge Sort',
    complexity: { best: '', average: '', worst: '', space: '' },
    stable: true,
    description:
      'Divide recursivamente y fusiona subarreglos ordenados. Garantiza O(n log n) en todos los casos y es estable; ideal para ordenar listas enlazadas y datos externos (disco).',
  },
  {
    id: 'bubblesort',
    name: 'Bubble Sort',
    complexity: { best: '', average: '', worst: '', space: '' },
    stable: true,
    description:
      'Intercambia pares adyacentes repetidamente hasta que no queden más intercambios. Detecta datos ya ordenados en O(n). Principalmente con valor pedagógico; ineficiente en la práctica.',
  },
  {
    id: 'shellsort',
    name: 'Shell Sort',
    complexity: { best: '', average: '', worst: '', space: '' },
    stable: false,
    description:
      'Generalización de Insertion Sort que ordena elementos separados por una brecha decreciente. Buen equilibrio entre simplicidad e implementación in-place con rendimiento práctico superior.',
  },
  {
    id: 'heapsort',
    name: 'Heap Sort',
    complexity: { best: '', average: '', worst: '', space: '' },
    stable: false,
    description:
      'Construye un heap binario máximo y extrae el máximo repetidamente. Garantiza O(n log n) sin el peor caso de QuickSort y con espacio O(1), al costo de ser inestable.',
  },
  {
    id: 'countingsort',
    name: 'Counting Sort',
    complexity: { best: '', average: '', worst: '', space: '' },
    stable: true,
    description:
      'Cuenta las frecuencias de cada valor y reconstruye el array ordenado. Lineal cuando k (rango de valores enteros) es pequeño respecto a n; no es de comparación.',
  },
  {
    id: 'radixsort',
    name: 'Radix Sort',
    complexity: { best: '', average: '', worst: '', space: '' },
    stable: true,
    description:
      'Ordena dígito a dígito (LSD o MSD) usando un algoritmo estable como Counting Sort en cada pasada. Efectivo con enteros o cadenas de longitud fija; lineal con k constante.',
  },
  {
    id: 'bucketsort',
    name: 'Bucket Sort',
    complexity: { best: '', average: '', worst: '', space: '' },
    stable: true,
    description:
      'Distribuye elementos en k "cubos" y ordena cada cubo individualmente. Óptimo para datos uniformemente distribuidos en un rango conocido, como retornos normalizados.',
  },
  {
    id: 'combsort',
    name: 'Comb Sort',
    complexity: { best: '', average: '', worst: '', space: '' },
    stable: false,
    description:
      'Mejora de Bubble Sort que usa una brecha decreciente (factor ≈ 1.3) para eliminar "tortugas" (valores pequeños al final del array). Significativamente más rápido que Bubble en la práctica.',
  },
];
