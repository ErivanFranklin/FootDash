import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';
import { TranslocoService } from '@jsverse/transloco';

describe('LanguageService', () => {
  let service: LanguageService;
  let translocoSpy: jasmine.SpyObj<TranslocoService>;

  beforeEach(() => {
    translocoSpy = jasmine.createSpyObj('TranslocoService', ['setActiveLang', 'getActiveLang']);
    
    localStorage.clear();

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

  it('should initialize with default English if no storage/browser lang', () => {
    expect(service.currentLang()).toBe('en');
  });

  it('should set language and update localStorage', () => {
    service.setLanguage('pt');
    expect(service.currentLang()).toBe('pt');
    expect(localStorage.getItem('footdash_lang')).toBe('pt');
    expect(translocoSpy.setActiveLang).toHaveBeenCalledWith('pt');
    expect(document.documentElement.lang).toBe('pt');
  });

  it('should not set unsupported language', () => {
    service.setLanguage('fr');
    expect(service.currentLang()).not.toBe('fr');
  });

  it('should return available languages', () => {
    const langs = service.getAvailableLanguages();
    expect(langs.length).toBe(3);
    expect(langs[0].code).toBe('en');
  });
});
