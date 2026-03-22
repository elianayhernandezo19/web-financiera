import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * ThemeService — gestiona el modo oscuro/claro de la aplicación con Signals.
 *
 * Mantiene `isDark` como signal reactivo y sincroniza la clase `.dark`
 * en <html> mediante un effect(). Cualquier componente puede inyectar
 * este servicio, leer `isDark()` y llamar `toggle()` para alternar.
 *
 * Por qué signal + effect y no localStorage:
 *   El estado de tema es ephemerally UI-only en esta versión. Si se quisiera
 *   persistencia, se añadiría una lectura de localStorage en el constructor
 *   antes de inicializar el signal.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);

  /** true = dark mode (por defecto), false = light mode */
  readonly isDark = signal<boolean>(true);

  constructor() {
    // El effect se registra en el contexto de inyección del constructor,
    // que es el lugar correcto para efectos de larga duración en servicios root.
    effect(() => {
      this.doc.documentElement.classList.toggle('dark', this.isDark());
    });
  }

  /** Alterna entre dark y light mode */
  toggle(): void {
    this.isDark.update((v) => !v);
  }
}
