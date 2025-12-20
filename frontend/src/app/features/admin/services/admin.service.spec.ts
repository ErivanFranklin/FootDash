import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';

describe('AdminService (Frontend)', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;
  const apiUrl = '/api/admin';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminService],
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('User Management', () => {
    it('should get all users', () => {
      const mockUsers = {
        data: [{ id: 1, email: 'test@example.com', role: 'user' }],
        total: 1,
        limit: 50,
        offset: 0,
      };

      service.getAllUsers(50, 0).subscribe((response) => {
        expect(response).toEqual(mockUsers);
      });

      const req = httpMock.expectOne(`${apiUrl}/users?limit=50&offset=0`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('should search users by email', () => {
      const mockUsers = [{ id: 1, email: 'test@example.com', role: 'user' }];

      service.searchUsers('test@example.com').subscribe((response) => {
        expect(response).toEqual(mockUsers);
      });

      const req = httpMock.expectOne(`${apiUrl}/users/search?email=test%40example.com`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('should get user details', () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };

      service.getUserDetails(1).subscribe((response) => {
        expect(response).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${apiUrl}/users/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it('should block user', () => {
      const mockResponse = { message: 'User blocked successfully', userId: 1 };

      service.blockUser(1).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/users/1/block`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should unblock user', () => {
      const mockResponse = { message: 'User unblocked successfully', userId: 1 };

      service.unblockUser(1).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/users/1/unblock`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should delete user', () => {
      const mockResponse = { message: 'User deleted successfully', userId: 1 };

      service.deleteUser(1).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/users/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('Report Management', () => {
    it('should get all reports', () => {
      const mockReports = {
        data: [{ id: 1, reason: 'Spam', status: 'pending' }],
        total: 1,
        limit: 50,
        offset: 0,
      };

      service.getAllReports(50, 0).subscribe((response) => {
        expect(response).toEqual(mockReports);
      });

      const req = httpMock.expectOne(`${apiUrl}/reports?limit=50&offset=0`);
      expect(req.request.method).toBe('GET');
      req.flush(mockReports);
    });

    it('should filter reports by status', () => {
      const mockReports = {
        data: [{ id: 1, reason: 'Spam', status: 'pending' }],
        total: 1,
        limit: 50,
        offset: 0,
      };

      service.getAllReports(50, 0, 'pending').subscribe((response) => {
        expect(response).toEqual(mockReports);
      });

      const req = httpMock.expectOne(`${apiUrl}/reports?limit=50&offset=0&status=pending`);
      expect(req.request.method).toBe('GET');
      req.flush(mockReports);
    });

    it('should get report details', () => {
      const mockReport = { id: 1, reason: 'Spam', status: 'pending' };

      service.getReportDetails(1).subscribe((response) => {
        expect(response).toEqual(mockReport);
      });

      const req = httpMock.expectOne(`${apiUrl}/reports/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockReport);
    });

    it('should approve report', () => {
      const mockResponse = {
        message: 'Report approved and action taken',
        reportId: 1,
        action: 'block_user',
      };

      service.approveReport(1, 'block_user').subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/reports/1/approve`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ action: 'block_user' });
      req.flush(mockResponse);
    });

    it('should reject report', () => {
      const mockResponse = { message: 'Report rejected', reportId: 1 };

      service.rejectReport(1).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/reports/1/reject`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('System Monitoring', () => {
    it('should get system health', () => {
      const mockHealth = {
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected',
          users: { total: 100, admins: 2 },
        },
        reports: { total: 25, pending: 5 },
        websockets: { activeConnections: 10 },
      };

      service.getSystemHealth().subscribe((response) => {
        expect(response).toEqual(mockHealth);
      });

      const req = httpMock.expectOne(`${apiUrl}/health`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHealth);
    });
  });
});
