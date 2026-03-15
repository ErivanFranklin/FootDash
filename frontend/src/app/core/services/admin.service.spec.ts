import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests admin stats', () => {
    service.getStats().subscribe();
    const req = httpMock.expectOne('/api/admin/stats');
    expect(req.request.method).toBe('GET');
    req.flush({ totalUsers: 1, totalAdmins: 1, totalProUsers: 0, newUsersLast7Days: 0 });
  });

  it('builds listUsers params including optional filters', () => {
    service.listUsers(25, 10, 'john', 'ADMIN', 'true').subscribe();

    const req = httpMock.expectOne((r) =>
      r.url === '/api/admin/users' &&
      r.params.get('limit') === '25' &&
      r.params.get('offset') === '10' &&
      r.params.get('search') === 'john' &&
      r.params.get('role') === 'ADMIN' &&
      r.params.get('isPro') === 'true',
    );

    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, limit: 25, offset: 10 });
  });

  it('sends role update with userId query param', () => {
    service.updateUserRole(9, 'MODERATOR').subscribe();

    const req = httpMock.expectOne((r) =>
      r.url === '/api/admin/users/role' && r.params.get('userId') === '9',
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ role: 'MODERATOR' });
    req.flush({ id: 9, role: 'MODERATOR' });
  });

  it('sends pro update with userId query param', () => {
    service.updateUserPro(7, true).subscribe();

    const req = httpMock.expectOne((r) =>
      r.url === '/api/admin/users/pro' && r.params.get('userId') === '7',
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ isPro: true });
    req.flush({ id: 7, isPro: true });
  });

  it('requests analytics endpoints with expected params', () => {
    service.getRegistrationTrend(14).subscribe();
    const regReq = httpMock.expectOne((r) => r.url === '/api/admin/analytics/registrations' && r.params.get('days') === '14');
    expect(regReq.request.method).toBe('GET');
    regReq.flush([]);

    service.getActiveUsers(30).subscribe();
    const activeReq = httpMock.expectOne((r) => r.url === '/api/admin/analytics/active-users' && r.params.get('days') === '30');
    expect(activeReq.request.method).toBe('GET');
    activeReq.flush([]);

    service.getPredictionAccuracy().subscribe();
    const accuracyReq = httpMock.expectOne('/api/admin/analytics/prediction-accuracy');
    expect(accuracyReq.request.method).toBe('GET');
    accuracyReq.flush([]);

    service.getGrowthMetrics().subscribe();
    const growthReq = httpMock.expectOne('/api/admin/analytics/growth');
    expect(growthReq.request.method).toBe('GET');
    growthReq.flush({});

    service.getRoleDistribution().subscribe();
    const roleReq = httpMock.expectOne('/api/admin/analytics/role-distribution');
    expect(roleReq.request.method).toBe('GET');
    roleReq.flush({});
  });

  it('handles empty response in listUsers', () => {
    service.listUsers().subscribe((res) => {
      expect(res.items).toEqual([]);
      expect(res.total).toBe(0);
    });

    const req = httpMock.expectOne((r) => r.url === '/api/admin/users');
    req.flush({ items: [], total: 0, limit: 50, offset: 0 });
  });

  it('sets only provided params in listUsers', () => {
    service.listUsers(10, 0, '  ', '', '').subscribe();

    const req = httpMock.expectOne((r) => {
      const p = r.params;
      return r.url === '/api/admin/users' &&
             p.get('limit') === '10' &&
             p.get('offset') === '0' &&
             !p.has('search') &&
             !p.has('role') &&
             !p.has('isPro');
    });
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0 });
  });

  it('sends correct updates for updateUserPro false', () => {
    service.updateUserPro(123, false).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/admin/users/pro' && r.params.get('userId') === '123');
    expect(req.request.body).toEqual({ isPro: false });
    req.flush({ id: 123, isPro: false });
  });
});
