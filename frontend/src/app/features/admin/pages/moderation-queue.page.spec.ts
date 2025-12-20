import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModerationQueuePage } from './moderation-queue.page';
import { AdminService } from '../services/admin.service';
import { of, throwError } from 'rxjs';

describe('ModerationQueuePage', () => {
  let component: ModerationQueuePage;
  let fixture: ComponentFixture<ModerationQueuePage>;
  let adminService: AdminService;

  const mockReports = [
    {
      id: 1,
      reason: 'Inappropriate language',
      status: 'pending',
      createdAt: '2025-12-20T10:00:00Z',
      resolvedAt: null,
      reporterEmail: 'reporter@example.com',
      targetEmail: 'offender@example.com',
    },
    {
      id: 2,
      reason: 'Spam',
      status: 'resolved',
      createdAt: '2025-12-20T09:00:00Z',
      resolvedAt: '2025-12-20T09:30:00Z',
      reporterEmail: 'reporter2@example.com',
      targetEmail: 'spammer@example.com',
    },
  ];

  beforeEach(async () => {
    const mockAdminService = {
      getAllReports: jest.fn(),
      getReportDetails: jest.fn(),
      approveReport: jest.fn(),
      rejectReport: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ModerationQueuePage],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ModerationQueuePage);
    component = fixture.componentInstance;
    adminService = TestBed.inject(AdminService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load reports on init', () => {
      jest.spyOn(adminService, 'getAllReports').mockReturnValue(
        of({ data: mockReports, total: 2, limit: 50, offset: 0 }),
      );

      component.ngOnInit();

      expect(component.reports).toEqual(mockReports);
      expect(component.loading).toBe(false);
    });
  });

  describe('loadReports', () => {
    it('should fetch reports with current status filter', () => {
      jest.spyOn(adminService, 'getAllReports').mockReturnValue(
        of({ data: [mockReports[0]], total: 1, limit: 50, offset: 0 }),
      );
      component.statusFilter = 'pending';

      component.loadReports();

      expect(adminService.getAllReports).toHaveBeenCalledWith(50, 0, 'pending');
      expect(component.reports).toEqual([mockReports[0]]);
    });
  });

  describe('onStatusChange', () => {
    it('should clear selected report and reload', () => {
      jest.spyOn(component, 'loadReports');
      component.selectedReport = mockReports[0];

      component.onStatusChange();

      expect(component.selectedReport).toBeNull();
      expect(component.loadReports).toHaveBeenCalled();
    });
  });

  describe('viewReportDetails', () => {
    it('should set selected report', () => {
      component.viewReportDetails(mockReports[0]);

      expect(component.selectedReport).toEqual(mockReports[0]);
    });
  });

  describe('approveReport', () => {
    it('should approve report with action after confirmation', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      jest.spyOn(adminService, 'approveReport').mockReturnValue(
        of({ message: 'Report approved', reportId: 1, action: 'block_user' }),
      );
      jest.spyOn(component, 'loadReports');
      component.selectedReport = mockReports[0];

      component.approveReport(1, 'block_user');

      expect(adminService.approveReport).toHaveBeenCalledWith(1, 'block_user');
      expect(component.loadReports).toHaveBeenCalled();
      expect(component.selectedReport).toBeNull();
    });

    it('should not approve if confirmation cancelled', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);

      component.approveReport(1, 'block_user');

      expect(adminService.approveReport).not.toHaveBeenCalled();
    });

    it('should handle approve error', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      jest.spyOn(adminService, 'approveReport').mockReturnValue(
        throwError(() => new Error('Approval failed')),
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      component.approveReport(1, 'block_user');

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('rejectReport', () => {
    it('should reject report after confirmation', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      jest.spyOn(adminService, 'rejectReport').mockReturnValue(
        of({ message: 'Report rejected', reportId: 1 }),
      );
      jest.spyOn(component, 'loadReports');
      component.selectedReport = mockReports[0];

      component.rejectReport(1);

      expect(adminService.rejectReport).toHaveBeenCalledWith(1);
      expect(component.loadReports).toHaveBeenCalled();
      expect(component.selectedReport).toBeNull();
    });

    it('should not reject if confirmation cancelled', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);

      component.rejectReport(1);

      expect(adminService.rejectReport).not.toHaveBeenCalled();
    });
  });

  describe('closeDetails', () => {
    it('should clear selected report', () => {
      component.selectedReport = mockReports[0];

      component.closeDetails();

      expect(component.selectedReport).toBeNull();
    });
  });

  describe('getStatusColor', () => {
    it('should return correct color for each status', () => {
      expect(component.getStatusColor('pending')).toBe('warning');
      expect(component.getStatusColor('resolved')).toBe('success');
      expect(component.getStatusColor('rejected')).toBe('medium');
      expect(component.getStatusColor('unknown')).toBe('primary');
    });
  });
});
