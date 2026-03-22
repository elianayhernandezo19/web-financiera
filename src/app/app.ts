import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { ThemeService } from '@core';

/**
 * Componente raíz — shell de la aplicación con Navbar fija.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly theme: ThemeService = inject(ThemeService);
  private router = inject(Router);

  /** Autores del proyecto — se renderizan como badges en el Navbar */
  readonly authors = ['Juan David', 'Eliana Yiset', 'Andrés Felipe'] as const;

  /** Signal reacitvo a la ruta actual para intercambiar el botón del header */
  readonly isAlgorithmsRoute = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event) => (event as NavigationEnd).urlAfterRedirects.includes('/algorithms'))
    ),
    { initialValue: this.router.url.includes('/algorithms') }
  );
}

