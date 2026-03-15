import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';

import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;
  const translocoMock = {
    setActiveLang: jasmine.createSpy('setActiveLang'),
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: TranslocoService, useValue: translocoMock }],
    });
    service = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    localStorage.clear();
    translocoMock.setActiveLang.calls.reset();
  });

  it('initializes from localStorage when available', () => {
    localStorage.setItem('footdash_lang', 'pt');

    const fresh = TestBed.runInInjectionContext(() => new LanguageService());

    expect(fresh.currentLang()).toBe('pt');
    expect(translocoMock.setActiveLang).toHaveBeenCalledWith('pt');
    expect(document.documentElement.lang).toBe('pt');
  });

  it('ignores unsupported language changes', () => {
    const current = service.currentLang();

    service.setLanguage('de');

    expect(service.currentLang()).toBe(current);
    expect(translocoMock.setActiveLang).not.toHaveBeenCalledWith('de');
  });

  it('returns available language options', () => {
    const langs = service.getAvailableLanguages();
    expect(langs.map((l) => l.code)).toEqual(['en', 'pt', 'es']);
  });
});