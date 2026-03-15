import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AdminAnalyticsComponent } from './admin-analytics.component';
import { AdminService } from '../../../core/services/admin.service';
import { of, throwError } from 'rxjs';
import { ElementRef, Component } from '@angular/core';

@Component({
  selector: 'ion-icon',
  standalone: true,
  template: ''
})
class MockIonIcon {}

describe('AdminAnalyticsComponent', () => {
  let component: AdminAnalyticsComponent;
  let fixture: ComponentFixture<AdminAnalyticsComponent>;
  let adminServiceSpy: jasmine.SpyObj<AdminService>;

  const mockGrowth = {
    totalUsers: 100,
    proRate: 10,
    newUsers30d: 5,
    newUsersChange: 20,
    activeUsers30d: 50,
    activeUsersChange: -5
  };

  const mockTrend = [{ date: '2023-01-01', count: 10 }];
  const mockAccuracy = [
    { modelType: 'high', accuracy: 80, correct: 8, total: 10 },
    { modelType: 'mid', accuracy: 50, correct: 5, total: 10 },
    { modelType: 'low', accuracy: 20, correct: 2, total: 10 }
  ];
  const mockDistribution = { roles: { admin: 1, user: 99 } };

  beforeEach(async () => {
    adminServiceSpy = jasmine.createSpyObj('AdminService', [
      'getGrowthMetrics',
      'getRegistrationTrend',
      'getActiveUsers',
      'getPredictionAccuracy',
      'getRoleDistribution'
    ]);

    adminServiceSpy.getGrowthMetrics.and.returnValue(of(mockGrowth as any));
    adminServiceSpy.getRegistrationTrend.and.returnValue(of(mockTrend as any));
    adminServiceSpy.getActiveUsers.and.returnValue(of(mockTrend as any));
    adminServiceSpy.getPredictionAccuracy.and.returnValue(of(mockAccuracy as any));
    adminServiceSpy.getRoleDistribution.and.returnValue(of(mockDistribution as any));

    await TestBed.configureTestingModule({
      imports: [AdminAnalyticsComponent, MockIonIcon],
      providers: [
        { provide: AdminService, useValue: adminServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAnalyticsComponent);
    component = fixture.componentInstance;
  });

  it('should create and render charts', fakeAsync(() => {
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect((component as any).regChart).toBeDefined();
    expect((component as any).activeChart).toBeDefined();
    expect((component as any).accChart).toBeDefined();
    expect((component as any).distributionChart).toBeDefined();
  }));

  it('should handle zero changes in growth', fakeAsync(() => {
    adminServiceSpy.getGrowthMetrics.and.returnValue(of({
       ...mockGrowth,
       newUsersChange: 0,
       activeUsersChange: 0
    } as any));
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();
    expect(component.growth?.newUsersChange).toBe(0);
  }));

  it('should handle missing distribution data', fakeAsync(() => {
    adminServiceSpy.getRoleDistribution.and.returnValue(of(null as any));
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();
    expect((component as any).distributionChart).toBeNull();
  }));

  it('should handle missing accuracy data', fakeAsync(() => {
    adminServiceSpy.getPredictionAccuracy.and.returnValue(of([]));
    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();
    expect((component as any).accChart).toBeNull();
  }));

  it('should render with viewReady false then true', fakeAsync(() => {
    (component as any).viewReady = false;
    (component as any).renderCharts();
    expect((component as any).regChart).toBeNull();
    
    (component as any).viewReady = true;
    (component as any).renderCharts();
    expect((component as any).regChart).toBeDefined();
  }));
});
