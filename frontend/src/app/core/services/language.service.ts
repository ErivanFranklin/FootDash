import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private translocoService = inject(TranslocoService);
  private readonly LANG_KEY = 'footdash_lang';

  // Expose current language as a signal for reactive UI updates
  currentLang = signal<string>('en');

  constructor() {
    this.initLanguage();
  }

  private initLanguage() {
    const savedLang = localStorage.getItem(this.LANG_KEY);
    const browserLang = this.getBrowserLang();
    const defaultLang = 'en';
    
    // Priority: Saved > Browser > Default
    const initialLang = savedLang || (this.isSupported(browserLang) ? browserLang : defaultLang);
    
    this.setLanguage(initialLang);
  }

  setLanguage(lang: string) {
    if (!this.isSupported(lang)) return;

    this.translocoService.setActiveLang(lang);
    localStorage.setItem(this.LANG_KEY, lang);
    this.currentLang.set(lang);
    document.documentElement.lang = lang;
  }

  getAvailableLanguages() {
    return [
      { code: 'en', label: 'English', flag: '🇺🇸' },
      { code: 'pt', label: 'Português (Brasil)', flag: '🇧🇷' },
      { code: 'es', label: 'Español', flag: '🇪🇸' }
    ];
  }

  private getBrowserLang(): string {
    const lang = navigator.language.split('-')[0];
    return lang;
  }

  private isSupported(lang: string): boolean {
    const supported = ['en', 'pt', 'es'];
    return supported.includes(lang);
  }
}
