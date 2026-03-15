import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark');
    document.documentElement.classList.remove('ion-palette-dark');

    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark');
    document.documentElement.classList.remove('ion-palette-dark');
  });

  it('applies dark mode classes and persists theme', async () => {
    service.setTheme('dark');
    await Promise.resolve();

    expect(localStorage.getItem('footdash_theme')).toBe('dark');
    expect(service.theme()).toBe('dark');
    expect(document.body.classList.contains('dark')).toBeTrue();
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBeTrue();
  });

  it('applies light mode classes and persists theme', async () => {
    service.setTheme('light');
    await Promise.resolve();

    expect(localStorage.getItem('footdash_theme')).toBe('light');
    expect(service.theme()).toBe('light');
  });

  it('defaults to auto when stored theme is invalid', () => {
    localStorage.setItem('footdash_theme', 'invalid');

    const fresh = TestBed.runInInjectionContext(() => new ThemeService());

    expect(fresh.theme()).toBe('auto');
  });
});