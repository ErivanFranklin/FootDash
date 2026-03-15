import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AnalyticsChartsComponent } from './analytics-charts.component';
import { AnalyticsService } from '../../services/analytics.service';
import { TranslocoService } from '@jsverse/transloco';
import { LoggerService } from '../../core/services/logger.service';
import { of, throwError } from 'rxjs';
import { TeamAnalytics } from '../../models/analytics.model';
import { SimpleChange } from '@angular/core';

describe('AnalyticsChartsComponent', () => {
  let component: AnalyticsChartsComponent;
  let fixture: ComponentFixture<AnalyticsChartsComponent>;
  let analyticsServiceSpy: jasmine.SpyObj<AnalyticsService>;
  let translocoServiceSpy: jasmine.SpyObj<TranslocoService>;
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>;

  const mockAnalytics: TeamAnalytics = {
    teamId: 1,
    teamName: 'Test Team',
    season: '2023/2024',
    formRating: 75,
    homePerformance: {
      played: 10, won: 6, drawn: 2, lost: 2,
      goalsFor: 20, goalsAgainst: 10, goalDifference: 10, points: 20, winPercentage: 60
    },
    awayPerformance: {
      played: 10, won: 4, drawn: 3, lost: 3,
      goalsFor: 15, goalsAgainst: 12, goalDifference: 3, points: 15, winPercentage: 40
    },
    overallStats: {
      played: 20, won: 10, drawn: 5, lost: 5,
      goalsFor: 35, goalsAgainst: 22, goalDifference: 13, points: 35, winPercentage: 50
    },
    scoringTrend: {
      last5Matches: [2, 1, 3, 0, 2],
      average: 1.6,
      trend: 'up'
    },
    defensiveRating: 80,
    lastUpdated: new Date()
  };

  beforeEach(async () => {
    analyticsServiceSpy = jasmine.createSpyObj('AnalyticsService', ['getTeamAnalytics']);
    translocoServiceSpy = jasmine.createSpyObj('TranslocoService', ['translate']);
    loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['error']);

    await TestBed.configureTestingModule({
      imports: [AnalyticsChartsComponent],
      providers: [
        { provide: AnalyticsService, useValue: analyticsServiceSpy },
        { provide: TranslocoService, useValue: translocoServiceSpy },
        { provide: LoggerService, useValue: loggerServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsChartsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load analytics if teamId is provided and analytics is null', fakeAsync(() => {
      analyticsServiceSpy.getTeamAnalytics.and.returnValue(of(mockAnalytics));
      component.teamId = 1;
      (component as any).analytics = null;
      
      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(component.loading).toBeFalse();
      expect(analyticsServiceSpy.getTeamAnalytics).toHaveBeenCalledWith(1);
      expect(component.analytics).toEqual(mockAnalytics as any);
    }));

    it('should use provided analytics and not call service', fakeAsync(() => {
      component.analytics = mockAnalytics;
      
      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(component.loading).toBeFalse();
      expect(analyticsServiceSpy.getTeamAnalytics).not.toHaveBeenCalled();
    }));

    it('should handle error when loading analytics', fakeAsync(() => {
      analyticsServiceSpy.getTeamAnalytics.and.returnValue(throwError(() => new Error('API Error')));
      component.teamId = 1;
      (component as any).analytics = null;
      
      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(component.loading).toBeFalse();
      expect(component.error).toBe('Failed to load analytics');
      expect(loggerServiceSpy.error).toHaveBeenCalled();
    }));
  });

  describe('OnChanges', () => {
    it('should update and create charts when analytics input changes', fakeAsync(() => {
      (component as any).analytics = null;
      component.analytics = mockAnalytics;
      component.ngOnChanges({
        analytics: new SimpleChange(null, mockAnalytics, false)
      });
      tick();
      fixture.detectChanges();

      expect(component.loading).toBeFalse();
      expect(component.analytics).toEqual(mockAnalytics as any);
    }));

    it('should load analytics when teamId input changes', fakeAsync(() => {
      analyticsServiceSpy.getTeamAnalytics.and.returnValue(of(mockAnalytics));
      (component as any).analytics = null;
      component.teamId = 1;

      component.ngOnChanges({
        teamId: new SimpleChange(null, 1, false)
      });
      tick();
      fixture.detectChanges();

      expect(component.loading).toBeFalse();
      expect(analyticsServiceSpy.getTeamAnalytics).toHaveBeenCalledWith(1);
      expect(component.analytics).toEqual(mockAnalytics as any);
    }));
  });

  describe('Cleanup', () => {
    it('should destroy charts on ngOnDestroy', () => {
      // Mock some charts in the private array if possible, or just call it
      const destroySpy = jasmine.createSpy('destroy');
      (component as any).charts = [{ destroy: destroySpy }];
      
      component.ngOnDestroy();
      
      expect(destroySpy).toHaveBeenCalled();
      expect((component as any).charts.length).toBe(0);
    });
  });

  describe('Theme handling', () => {
    it('should detect dark mode', () => {
      document.body.classList.add('dark');
      expect((component as any).isDarkMode()).toBeTrue();
      
      document.body.classList.remove('dark');
      expect((component as any).isDarkMode()).toBeFalse();
    });

    it('should return correct colors for light mode', () => {
      document.body.classList.remove('dark');
      const colors = (component as any).chartColors();
      expect(colors.text).toBe('#333333');
    });

    it('should return correct colors for dark mode', () => {
      document.body.classList.add('dark');
      const colors = (component as any).chartColors();
      expect(colors.text).toBe('#ffffff');
      document.body.classList.remove('dark');
    });
  });
});
