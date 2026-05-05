import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DataSource {
  name: string;
  description: string;
  url: string;
  icon: string;
  category: string;
}

interface AlgorithmRef {
  id: string;
  name: string;
  youtubeSearch: string;
  geeksUrl: string;
  wikipedia: string;
}

@Component({
  selector: 'app-referencias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './referencias.component.html',
  styleUrl: './referencias.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenciasComponent {

  readonly dataSources: DataSource[] = [
    {
      name: 'Yahoo Finance',
      description: 'Fuente principal de datos OHLCV (Open, High, Low, Close, Volume) para ETFs y activos internacionales. API utilizada para extraer series históricas de precios.',
      url: 'https://finance.yahoo.com',
      icon: '📈',
      category: 'Datos Financieros',
    },
    {
      name: 'Bolsa de Valores de Colombia (BVC)',
      description: 'Fuente oficial de datos del mercado bursátil colombiano. Se usó para extraer datos de acciones locales como ECOPETROL, BANCOLOMBIA, ISA, NUTRESA y GRUPOARGOS.',
      url: 'https://www.bvc.com.co',
      icon: '🏦',
      category: 'Datos Financieros',
    },
    {
      name: 'Supabase',
      description: 'Plataforma de base de datos PostgreSQL en la nube utilizada para almacenar todos los datos históricos de precios y resultados del análisis.',
      url: 'https://supabase.com',
      icon: '🗄️',
      category: 'Infraestructura',
    },
    {
      name: 'AWS Elastic Beanstalk',
      description: 'Servicio de despliegue de aplicaciones Node.js utilizado para hospedar la API REST del proyecto.',
      url: 'https://aws.amazon.com/elasticbeanstalk/',
      icon: '☁️',
      category: 'Infraestructura',
    },
    {
      name: 'Netlify',
      description: 'Plataforma de hosting para el frontend Angular. Provee CI/CD automático desde GitHub y CDN global.',
      url: 'https://netlify.com',
      icon: '🚀',
      category: 'Infraestructura',
    },
    {
      name: 'GeeksForGeeks — Sorting Algorithms',
      description: 'Referencia académica para la implementación, análisis de complejidad y comparación de los 12 algoritmos de ordenamiento usados en el proyecto.',
      url: 'https://www.geeksforgeeks.org/sorting-algorithms/',
      icon: '📚',
      category: 'Referencias Académicas',
    },
    {
      name: 'Wikipedia — Sorting Algorithm',
      description: 'Referencia general sobre teoría de algoritmos de ordenamiento, notación Big O y comparativas de rendimiento.',
      url: 'https://en.wikipedia.org/wiki/Sorting_algorithm',
      icon: '📖',
      category: 'Referencias Académicas',
    },
    {
      name: 'NIST — Dictionary of Algorithms',
      description: 'Diccionario oficial del Instituto Nacional de Estándares y Tecnología (NIST) con definiciones formales de cada algoritmo.',
      url: 'https://xlinux.nist.gov/dads/',
      icon: '🔬',
      category: 'Referencias Académicas',
    },
  ];

  readonly algorithms: AlgorithmRef[] = [
    {
      id: 'timsort',
      name: 'Tim Sort',
      youtubeSearch: 'https://www.youtube.com/results?search_query=timsort+algorithm+explained',
      geeksUrl: 'https://www.geeksforgeeks.org/timsort/',
      wikipedia: 'https://en.wikipedia.org/wiki/Timsort',
    },
    {
      id: 'quicksort',
      name: 'Quick Sort',
      youtubeSearch: 'https://www.youtube.com/results?search_query=quicksort+algorithm+explained',
      geeksUrl: 'https://www.geeksforgeeks.org/quick-sort/',
      wikipedia: 'https://en.wikipedia.org/wiki/Quicksort',
    },
    {
      id: 'heapsort',
      name: 'Heap Sort',
      youtubeSearch: 'https://www.youtube.com/results?search_query=heap+sort+algorithm+explained',
      geeksUrl: 'https://www.geeksforgeeks.org/heap-sort/',
      wikipedia: 'https://en.wikipedia.org/wiki/Heapsort',
    },
    {
      id: 'radixsort',
      name: 'Radix Sort',
      youtubeSearch: 'https://www.youtube.com/results?search_query=radix+sort+algorithm+explained',
      geeksUrl: 'https://www.geeksforgeeks.org/radix-sort/',
      wikipedia: 'https://en.wikipedia.org/wiki/Radix_sort',
    },
    {
      id: 'bucketsort',
      name: 'Bucket Sort',
      youtubeSearch: 'https://www.youtube.com/results?search_query=bucket+sort+algorithm+explained',
      geeksUrl: 'https://www.geeksforgeeks.org/bucket-sort-2/',
      wikipedia: 'https://en.wikipedia.org/wiki/Bucket_sort',
    },
    {
      id: 'selectionsort',
      name: 'Selection Sort',
      youtubeSearch: 'https://www.youtube.com/results?search_query=selection+sort+algorithm+explained',
      geeksUrl: 'https://www.geeksforgeeks.org/selection-sort/',
      wikipedia: 'https://en.wikipedia.org/wiki/Selection_sort',
    },
    {
      id: 'combsort',
      name: 'Comb Sort',
      youtubeSearch: 'https://www.youtube.com/results?search_query=comb+sort+algorithm+explained',
      geeksUrl: 'https://www.geeksforgeeks.org/comb-sort/',
      wikipedia: 'https://en.wikipedia.org/wiki/Comb_sort',
    },
    {
      id: 'treesort',
      name: 'Tree Sort',
      youtubeSearch: 'https://www.youtube.com/results?search_query=tree+sort+algorithm+explained',
      geeksUrl: 'https://www.geeksforgeeks.org/tree-sort/',
      wikipedia: 'https://en.wikipedia.org/wiki/Tree_sort',
    },
    {
      id: 'pigeonholesort',
      name: 'Pigeonhole Sort',
      youtubeSearch: 'https://www.youtube.com/results?search_query=pigeonhole+sort+algorithm+explained',
      geeksUrl: 'https://www.geeksforgeeks.org/pigeonhole-sort/',
      wikipedia: 'https://en.wikipedia.org/wiki/Pigeonhole_sort',
    },
    {
      id: 'bitonicsort',
      name: 'Bitonic Sort',
      youtubeSearch: 'https://www.youtube.com/results?search_query=bitonic+sort+algorithm+explained',
      geeksUrl: 'https://www.geeksforgeeks.org/bitonic-sort/',
      wikipedia: 'https://en.wikipedia.org/wiki/Bitonic_sorter',
    },
    {
      id: 'gnomesort',
      name: 'Gnome Sort',
      youtubeSearch: 'https://www.youtube.com/results?search_query=gnome+sort+algorithm+explained',
      geeksUrl: 'https://www.geeksforgeeks.org/gnome-sort-a-stupid-one/',
      wikipedia: 'https://en.wikipedia.org/wiki/Gnome_sort',
    },
    {
      id: 'binaryinsertionsort',
      name: 'Binary Insertion Sort',
      youtubeSearch: 'https://www.youtube.com/results?search_query=binary+insertion+sort+algorithm+explained',
      geeksUrl: 'https://www.geeksforgeeks.org/binary-insertion-sort/',
      wikipedia: 'https://en.wikipedia.org/wiki/Insertion_sort',
    },
  ];

  readonly categories = ['Datos Financieros', 'Infraestructura', 'Referencias Académicas'];

  getSourcesByCategory(category: string): DataSource[] {
    return this.dataSources.filter(s => s.category === category);
  }
}
