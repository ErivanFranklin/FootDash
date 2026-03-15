import { TestBed } from '@angular/core/testing';
import { ThemeService, ThemeMode } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [ThemeService]
    });
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load theme from localStorage', () => {
    localStorage.setItem('footdash_theme', 'dark');
    // we need a new instance to test initial load from storage
    const newService = TestBed.runInInjectionContext(() => new ThemeService());
    expect(newService.theme()).toBe('dark');
  });

  it('should set theme and save to localStorage', () => {
    service.setTheme('light');
    expect(service.theme()).toBe('light');
    expect(localStorage.getItem('footdash_theme')).toBe('light');
  });

  it('should default to auto if invalid value in localStorage', () => {
    localStorage.setItem('footdash_theme', 'invalid');
    const newService = TestBed.runInInjectionContext(() => new ThemeService());
    expect(newService.theme()).toBe('auto');
  });

  it('should apply dark class when theme is dark', () => {
    service.setTheme('dark');
    expect(document.body.classList.contains('dark')).toBeTrue();
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBeTrue();
  });

  it('should apply dark class according to system preference if auto', () => {
    // Mock matchMedia
    spyOn(window, 'matchMedia').and.returnValue({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as any);

    service.setTheme('auto');
    expect(document.body.classList.contains('dark')).toBeTrue();
  });
});
