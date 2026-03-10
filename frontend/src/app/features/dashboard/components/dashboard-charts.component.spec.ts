import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { DashboardChartsComponent } from './dashboard-charts.component';
import { AnalyticsService } from '../../../services/analytics.service';
import { GamificationService } from '../../../services/gamification.service';
import { FavoritesService } from '../../../services/favorites.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoggerService } from '../../../core/services/logger.service';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

describe('DashboardChartsComponent', () => {
  let component: DashboardChartsComponent;
  let fixture: ComponentFixture<DashboardChartsComponent>;

  const mockAnalyticsService = {
    getPredictionStats: jasmine.createSpy('getPredictionStats').and.returnValue(of({ totalPredictions: 15, accuracy: 72 })),
    getTeamAnalytics: jasmine.createSpy('getTeamAnalytics').and.returnValue(of({ formRating: 80, scoringTrend: { last5Matches: [1, 2, 0, 3, 1] }, teamName: 'Arsenal' })),
  };

  const mockGamificationService = {
    getLeaderboard: jasmine.createSpy('getLeaderboard').and.returnValue(of([
      { userId: 1, rank: 3, points: 120, predictionsCount: 10, accuracy: 55 },
    ])),
    getAllBadges: jasmine.createSpy('getAllBadges').and.returnValue(of([
      { id: 1, earned: true },
      { id: 2, earned: false },
      { id: 3, earned: true },
    ])),
  };

  const mockFavoritesService = {
    loadFavorites: jasmine.createSpy('loadFavorites').and.returnValue(of([])),
  };

  const mockAuthService = {
    getToken: () => 'test-token',
    getCurrentUserId: () => 1,
  };

  const mockLogger = {
    log: jasmine.createSpy('log'),
    warn: jasmine.createSpy('warn'),
    error: jasmine.createSpy('error'),
  };

  beforeEach(waitForAsync(() => {
    mockAnalyticsService.getPredictionStats.and.returnValue(of({ totalPredictions: 15, accuracy: 72 }));

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), DashboardChartsComponent, RouterTestingModule],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: GamificationService, useValue: mockGamificationService },
        { provide: FavoritesService, useValue: mockFavoritesService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardChartsComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load prediction stats from analytics service', fakeAsync(() => {
    fixture.detectChanges();
    tick(100);

    expect(mockAnalyticsService.getPredictionStats).toHaveBeenCalled();
    expect(component.predictionsMade).toBe(15);
    expect(component.accuracy).toBe(72);
  }));

  it('should load badge counts', fakeAsync(() => {
    fixture.detectChanges();
    tick(100);

    expect(mockGamificationService.getAllBadges).toHaveBeenCalled();
    expect(component.badgesTotal).toBe(3);
    expect(component.badgesEarned).toBe(2);
  }));

  it('should load rank from leaderboard', fakeAsync(() => {
    fixture.detectChanges();
    tick(100);

    expect(component.rank).toBe(3);
    expect(component.points).toBe(120);
  }));

  it('should set success color when accuracy >= 60', fakeAsync(() => {
    fixture.detectChanges();
    tick(100);

    expect(component.accuracyColor).toBe('var(--ion-color-success)');
  }));

  it('should use demo values when prediction stats fail in dev', fakeAsync(() => {
    mockAnalyticsService.getPredictionStats.and.returnValue(throwError(() => new Error('Network error')));
    fixture.detectChanges();
    tick(100);

    // In non-production, demo values should be seeded
    expect(component.predictionsMade).toBeGreaterThan(0);
  }));
});
