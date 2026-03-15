import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TeamAnalyticsCardComponent } from './team-analytics-card.component';
import { AnalyticsService } from '../../services/analytics.service';
import { LoggerService } from '../../core/services/logger.service';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { SimpleChange, Component } from '@angular/core';

@Component({
  selector: 'ion-icon',
  standalone: true,
  template: ''
})
class MockIonIcon {}

describe('TeamAnalyticsCardComponent', () => {
  let component: TeamAnalyticsCardComponent;
  let fixture: ComponentFixture<TeamAnalyticsCardComponent>;
  let analyticsServiceSpy: jasmine.SpyObj<AnalyticsService>;
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>;
  let translocoServiceSpy: jasmine.SpyObj<TranslocoService>;

  const mockAnalytics = {
    teamId: 1,
    teamName: 'Test Team',
    formRating: 80,
    defensiveRating: 70,
    scoringTrend: {
      last5Matches: [1, 2, 0, 3, 1],
      trend: 'up',
      average: 1.5
    },
    performanceIndices: {
      attack: 85,
      defense: 70,
      stamina: 90
    },
    overallStats: {
      played: 20,
      won: 10,
      drawn: 5,
      lost: 5,
      points: 35,
      winPercentage: 50,
      goalsFor: 30,
      goalsAgainst: 20,
      goalDifference: 10
    },
    homePerformance: { won: 6, drawn: 2, lost: 2, winPercentage: 60 },
    awayPerformance: { won: 4, drawn: 3, lost: 3, winPercentage: 40 },
    lastUpdated: new Date()
  };

  beforeEach(async () => {
    analyticsServiceSpy = jasmine.createSpyObj('AnalyticsService', ['getTeamAnalytics']);
    loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['warn', 'error']);
    translocoServiceSpy = jasmine.createSpyObj('TranslocoService', ['translate']);

    analyticsServiceSpy.getTeamAnalytics.and.returnValue(of(mockAnalytics as any));
    translocoServiceSpy.translate.and.callFake(((key: any) => key) as any);

    await TestBed.configureTestingModule({
      imports: [TeamAnalyticsCardComponent, TranslocoModule, MockIonIcon],
      providers: [
        { provide: AnalyticsService, useValue: analyticsServiceSpy },
        { provide: LoggerService, useValue: loggerServiceSpy },
        { provide: TranslocoService, useValue: translocoServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TeamAnalyticsCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', fakeAsync(() => {
    component.teamId = 1;
    fixture.detectChanges();
    tick(200);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  }));

  it('should load analytics during init', fakeAsync(() => {
    component.teamId = 1;
    fixture.detectChanges();
    tick(200);
    fixture.detectChanges();
    expect(analyticsServiceSpy.getTeamAnalytics).toHaveBeenCalledWith(1);
    expect(component.analytics).toEqual(mockAnalytics as any);
  }));

  it('should handle service errors', fakeAsync(() => {
    analyticsServiceSpy.getTeamAnalytics.and.returnValue(throwError(() => new Error('API error')));
    component.teamId = 1;
    component.loadAnalytics();
    tick();
    fixture.detectChanges();
    expect(component.error).toBe('Failed to load team analytics');
  }));

  it('should create charts after view init', fakeAsync(() => {
    component.teamId = 1;
    fixture.detectChanges();
    tick(200);
    fixture.detectChanges();

    (component as any).createFormChart();
    (component as any).createPerformanceChart();

    expect((component as any).formChart).toBeDefined();
    expect((component as any).performanceChart).toBeDefined();
  }));
});
