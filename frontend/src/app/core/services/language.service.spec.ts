import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';
import { TranslocoService } from '@jsverse/transloco';

describe('LanguageService', () => {
  let service: LanguageService;
  let translocoSpy: jasmine.SpyObj<TranslocoService>;

  beforeEach(() => {
    localStorage.clear();
    translocoSpy = jasmine.createSpyObj('TranslocoService', ['setActiveLang']);

    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslocoService, useValue: translocoSpy }
      ]
    });
    service = TestBed.inject(LanguageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default language if nothing is saved', () => {
    // Should default to 'en' or browser lang
    expect(service.currentLang()).toBeDefined();
  });

  it('should set language and save to localStorage', () => {
    service.setLanguage('pt');
    expect(service.currentLang()).toBe('pt');
    expect(localStorage.getItem('footdash_lang')).toBe('pt');
    expect(translocoSpy.setActiveLang).toHaveBeenCalledWith('pt');
  });

  it('should not set unsupported language', () => {
    const initialLang = service.currentLang();
    service.setLanguage('fr'); // not supported
    expect(service.currentLang()).toBe(initialLang);
  });

  it('should return available languages', () => {
    const langs = service.getAvailableLanguages();
    expect(langs.length).toBeGreaterThan(0);
    expect(langs.find(l => l.code === 'en')).toBeDefined();
  });
});
