import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SystemMonitoringPage } from './system-monitoring.page';
import { AdminService } from '../services/admin.service';
import { of, throwError } from 'rxjs';

describe('SystemMonitoringPage', () => {
  let component: SystemMonitoringPage;
  let fixture: ComponentFixture<SystemMonitoringPage>;
  let adminService: AdminService;

  const mockSystemHealth = {
    timestamp: new Date().toISOString(),
    database: {
      status: 'connected',
      users: { total: 100, admins: 2 },
    },
    reports: { total: 25, pending: 5 },
    websockets: { activeConnections: 15 },
  };

  beforeEach(async () => {
    const mockAdminService = {
      getSystemHealth: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SystemMonitoringPage],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemMonitoringPage);
    component = fixture.componentInstance;
    adminService = TestBed.inject(AdminService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load system health on init', () => {
      jest.spyOn(adminService, 'getSystemHealth').mockReturnValue(of(mockSystemHealth));

      component.ngOnInit();

      expect(component.systemHealth).toEqual(mockSystemHealth);
      expect(component.loading).toBe(false);
      expect(component.lastRefresh).not.toBeNull();
    });
  });

  describe('loadSystemHealth', () => {
    it('should fetch system health data', () => {
      jest.spyOn(adminService, 'getSystemHealth').mockReturnValue(of(mockSystemHealth));

      component.loadSystemHealth();

      expect(component.systemHealth).toEqual(mockSystemHealth);
      expect(component.loading).toBe(false);
    });

    it('should handle load error', () => {
      jest.spyOn(adminService, 'getSystemHealth').mockReturnValue(
        throwError(() => new Error('Load failed')),
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      component.loadSystemHealth();

      expect(component.loading).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('toggleAutoRefresh', () => {
    it('should start auto refresh interval when enabled', (done) => {
      jest.spyOn(adminService, 'getSystemHealth').mockReturnValue(of(mockSystemHealth));
      component.autoRefresh = true;

      component.toggleAutoRefresh();

      expect(component.refreshInterval).toBeDefined();

      // Clean up interval
      if (component.refreshInterval) {
        clearInterval(component.refreshInterval);
      }
      done();
    });

    it('should stop auto refresh interval when disabled', () => {
      jest.spyOn(global, 'setInterval').mockReturnValue(123 as any);
      jest.spyOn(global, 'clearInterval');
      component.autoRefresh = true;
      component.toggleAutoRefresh();

      component.autoRefresh = false;
      component.toggleAutoRefresh();

      expect(clearInterval).toHaveBeenCalled();
    });

    it('should not set interval if already null', () => {
      component.autoRefresh = false;
      component.refreshInterval = null;

      component.toggleAutoRefresh();

      expect(component.refreshInterval).toBeNull();
    });
  });

  describe('ngOnDestroy', () => {
    it('should clear interval on destroy', () => {
      const mockInterval = setInterval(() => {}, 5000);
      component.refreshInterval = mockInterval as any;
      const clearSpy = jest.spyOn(global, 'clearInterval');

      component.ngOnDestroy();

      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('getDbStatusColor', () => {
    it('should return success color when connected', () => {
      component.systemHealth = mockSystemHealth;

      const result = component.getDbStatusColor();

      expect(result).toBe('success');
    });

    it('should return danger color when not connected', () => {
      component.systemHealth = {
        ...mockSystemHealth,
        database: { ...mockSystemHealth.database, status: 'disconnected' },
      };

      const result = component.getDbStatusColor();

      expect(result).toBe('danger');
    });

    it('should return danger when systemHealth is null', () => {
      component.systemHealth = null;

      const result = component.getDbStatusColor();

      expect(result).toBe('danger');
    });
  });
});
