import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * ThemeService — gestiona el modo oscuro/claro de la aplicación con Signals.
 *
 * Mantiene `isDark` como signal reactivo y sincroniza la clase `.dark`
 * en <html> mediante un effect(). Persistencia en localStorage para que
 * la preferencia sobreviva a recargas de página.
 *
 * Orden de prioridad para el tema inicial:
 *   1. localStorage ('theme-dark')
 *   2. prefers-color-scheme del sistema
 *   3. Dark mode por defecto (fallback)
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly STORAGE_KEY = 'theme-dark';

  /** true = dark mode, false = light mode */
  readonly isDark = signal<boolean>(this.resolveInitialTheme());

  constructor() {
    // Sincroniza la clase `.dark` en <html> cada vez que isDark cambie
    effect(() => {
      const dark = this.isDark();
      this.doc.documentElement.classList.toggle('dark', dark);
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dark));
      } catch {
        // localStorage puede no estar disponible (SSR, incognito, etc.)
      }
    });
  }

  /** Alterna entre dark y light mode */
  toggle(): void {
    this.isDark.update((v) => !v);
  }

  /**
   * Resuelve el tema inicial:
   *   1. Valor guardado en localStorage
   *   2. Preferencia del sistema (prefers-color-scheme)
   *   3. Dark mode como fallback
   */
  private resolveInitialTheme(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored !== null) return JSON.parse(stored);
    } catch {
      // Fallo silencioso
    }

    // Fallback: detectar preferencia del sistema
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    return true; // Dark por defecto
  }
}
