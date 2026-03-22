import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Componente raíz — shell mínimo que solo provee el punto de montaje del router.
 * Sin estado ni lógica: todo vive en los feature components lazy-loaded.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
