import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LeaguesPage } from './leagues.page';
import { environment } from '../../../../environments/environment';

const API = `${environment.apiBaseUrl}/leagues`;

describe('LeaguesPage', () => {
  let component: LeaguesPage;
  let fixture: ComponentFixture<LeaguesPage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaguesPage, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LeaguesPage);
    component = fixture.componentInstance;
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    fixture.detectChanges();
    httpMock.expectOne(API).flush([]);
    expect(component).toBeTruthy();
  });

  // ── ngOnInit / loadLeagues ───────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('calls GET /leagues on init', () => {
      fixture.detectChanges();
      const req = httpMock.expectOne(API);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  // ── featured / other grouping ────────────────────────────────────────────

  describe('league grouping', () => {
    const mockLeagues = [
      { id: 1, name: 'Premier League', externalId: 39, country: 'England', logo: null, type: 'League', isFeatured: true },
      { id: 2, name: 'La Liga',        externalId: 140, country: 'Spain',   logo: null, type: 'League', isFeatured: true },
      { id: 3, name: 'Minor Cup',      externalId: 999, country: null,       logo: null, type: 'Cup',    isFeatured: false },
    ];

    it('separates featured leagues from others', () => {
      fixture.detectChanges();
      httpMock.expectOne(API).flush(mockLeagues);

      expect(component.featuredLeagues().length).toBe(2);
      expect(component.otherLeagues().length).toBe(1);
    });

    it('populates featuredLeagues with isFeatured=true entries', () => {
      fixture.detectChanges();
      httpMock.expectOne(API).flush(mockLeagues);

      expect(component.featuredLeagues().every((l) => l.isFeatured)).toBe(true);
    });

    it('populates otherLeagues with isFeatured=false entries', () => {
      fixture.detectChanges();
      httpMock.expectOne(API).flush(mockLeagues);

      expect(component.otherLeagues().every((l) => !l.isFeatured)).toBe(true);
    });

    it('handles empty response — both signals are empty', () => {
      fixture.detectChanges();
      httpMock.expectOne(API).flush([]);

      expect(component.featuredLeagues()).toEqual([]);
      expect(component.otherLeagues()).toEqual([]);
    });
  });

  // ── refresh ──────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('reloads leagues and calls complete after timeout', (done) => {
      fixture.detectChanges();
      httpMock.expectOne(API).flush([]);

      let completed = false;
      const mockEvent = { target: { complete: () => { completed = true; } } };
      component.refresh(mockEvent);
      httpMock.expectOne(API).flush([]);

      // complete is called inside setTimeout(500)
      setTimeout(() => {
        expect(completed).toBe(true);
        done();
      }, 600);
    });
  });
});
