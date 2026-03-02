import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HighlightsPage } from './highlights.page';
import { environment } from '../../../../environments/environment';

const API = `${environment.apiBaseUrl}/highlights`;

describe('HighlightsPage', () => {
  let component: HighlightsPage;
  let fixture: ComponentFixture<HighlightsPage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HighlightsPage, HttpClientTestingModule],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HighlightsPage);
    component = fixture.componentInstance;
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${API}?page=1&limit=20`).flush([]);
    expect(component).toBeTruthy();
  });

  // ── ngOnInit ────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('calls GET /highlights on init and populates highlights signal', () => {
      const items = [
        { 
          id: 1, 
          title: 'Arsenal Goals', 
          homeTeam: 'Arsenal', 
          awayTeam: 'Chelsea', 
          matchDate: '2025-01-01', 
          viewCount: 100, 
          source: 'YouTube', 
          duration: 90, 
          videoUrl: '', 
          thumbnailUrl: 'thumb' 
        } as any,
      ];
      fixture.detectChanges(); // triggers ngOnInit
      const req = httpMock.expectOne(`${API}?page=1&limit=20`);
      expect(req.request.method).toBe('GET');
      req.flush(items);

      expect(component.highlights()).toEqual(items as any);
    });

    it('sets loading to false after response', () => {
      fixture.detectChanges();
      httpMock.expectOne(`${API}?page=1&limit=20`).flush([]);
      expect(component.loading()).toBe(false);
    });

    it('sets loading to false on HTTP error', () => {
      fixture.detectChanges();
      httpMock.expectOne(`${API}?page=1&limit=20`).error(new ErrorEvent('Network error'));
      expect(component.loading()).toBe(false);
    });
  });

  // ── onSearch ────────────────────────────────────────────────────────────

  describe('onSearch', () => {
    it('calls search endpoint when query is non-empty', () => {
      fixture.detectChanges();
      httpMock.expectOne(`${API}?page=1&limit=20`).flush([]);

      component.onSearch({ detail: { value: 'arsenal' } });
      const req = httpMock.expectOne(`${API}/search?q=arsenal`);
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 2, title: 'Arsenal Highlights' }]);
    });

    it('calls standard endpoint when query is cleared', () => {
      fixture.detectChanges();
      httpMock.expectOne(`${API}?page=1&limit=20`).flush([]);

      component.searchQuery = 'test';
      component.onSearch({ detail: { value: '' } });
      const req = httpMock.expectOne(`${API}?page=1&limit=20`);
      req.flush([]);
      expect(component.searchQuery).toBe('');
    });
  });

  // ── formatDuration ──────────────────────────────────────────────────────

  describe('formatDuration', () => {
    it('formats 90 seconds as "1:30"', () => {
      expect(component.formatDuration(90)).toBe('1:30');
    });

    it('formats 65 seconds as "1:05" (zero-padded seconds)', () => {
      expect(component.formatDuration(65)).toBe('1:05');
    });

    it('returns "–" for zero or falsy duration', () => {
      expect(component.formatDuration(0)).toBe('–');
    });

    it('formats 3600 seconds as "60:00"', () => {
      expect(component.formatDuration(3600)).toBe('60:00');
    });
  });

  // ── hasMore signal ──────────────────────────────────────────────────────

  describe('pagination', () => {
    it('sets hasMore to true when response has 20+ items', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, title: `H${i}` }));
      fixture.detectChanges();
      httpMock.expectOne(`${API}?page=1&limit=20`).flush(items);
      expect(component.hasMore()).toBe(true);
    });

    it('sets hasMore to false when response has fewer than 20 items', () => {
      fixture.detectChanges();
      httpMock.expectOne(`${API}?page=1&limit=20`).flush([{ id: 1 }, { id: 2 }]);
      expect(component.hasMore()).toBe(false);
    });
  });
});
