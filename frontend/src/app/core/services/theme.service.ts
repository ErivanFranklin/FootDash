import { Injectable, inject, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'footdash_theme';
  readonly theme = signal<ThemeMode>(this.loadTheme());

  constructor() {
    // React to theme changes and apply to DOM
    effect(() => this.applyTheme(this.theme()));
    // Apply on init
    this.applyTheme(this.theme());
  }

  setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
    localStorage.setItem(this.STORAGE_KEY, mode);
  }

  private loadTheme(): ThemeMode {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored;
    return 'auto';
  }

  private applyTheme(mode: ThemeMode): void {
    const prefersDark = mode === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : mode === 'dark';

    document.body.classList.toggle('dark', prefersDark);
    document.documentElement.classList.toggle('ion-palette-dark', prefersDark);
  }
}
