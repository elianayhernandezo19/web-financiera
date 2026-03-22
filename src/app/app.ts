import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ThemeService } from '@core';

/**
 * Componente raíz — shell de la aplicación con Navbar fija.
 *
 * Responsabilidades aquí (intencionalmente mínimas):
 *   - Renderizar el Header/Navbar persistente con el toggle de tema
 *   - Montar el router-outlet para los feature components lazy-loaded
 *   - Exponer ThemeService al template
 *
 * Todo el estado de negocio vive en DashboardComponent (lazy-loaded).
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly theme: ThemeService = inject(ThemeService);

  /** Autores del proyecto — se renderizan como badges en el Navbar */
  readonly authors = ['Juan David', 'Eliana Yiset', 'Andrés Felipe'] as const;
}

