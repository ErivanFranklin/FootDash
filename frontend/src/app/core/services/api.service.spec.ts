import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('pings health endpoint', () => {
    service.ping().subscribe();
    const req = httpMock.expectOne('/api/health');
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true });
  });

  it('builds team list query params', () => {
    service.getTeams({ page: 2, limit: 25, search: 'arsenal' }).subscribe();
    const req = httpMock.expectOne(
      (r) =>
        r.url === '/api/teams' &&
        r.params.get('page') === '2' &&
        r.params.get('limit') === '25' &&
        r.params.get('search') === 'arsenal',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('calls team and sync endpoints', () => {
    service.getTeam(9).subscribe();
    const getReq = httpMock.expectOne('/api/teams/9');
    expect(getReq.request.method).toBe('GET');
    getReq.flush({});

    service.syncTeam(9).subscribe();
    const syncReq = httpMock.expectOne('/api/teams/9/sync');
    expect(syncReq.request.method).toBe('POST');
    syncReq.flush({});
  });

  it('builds team matches and sync params', () => {
    const opts = {
      season: 2026,
      range: 'next',
      limit: 7,
      from: '2026-01-01',
      to: '2026-01-31',
    };
    service.getTeamMatches(5, opts).subscribe();
    const matchesReq = httpMock.expectOne(
      (r) =>
        r.url === '/api/matches/team/5' &&
        r.params.get('season') === '2026' &&
        r.params.get('range') === 'next' &&
        r.params.get('limit') === '7' &&
        r.params.get('from') === '2026-01-01' &&
        r.params.get('to') === '2026-01-31',
    );
    expect(matchesReq.request.method).toBe('GET');
    matchesReq.flush([]);

    service.syncTeamMatches(5, opts).subscribe();
    const syncReq = httpMock.expectOne('/api/matches/team/5/sync?season=2026&range=next&limit=7&from=2026-01-01&to=2026-01-31');
    expect(syncReq.request.method).toBe('POST');
    syncReq.flush({});
  });

  it('gets single match and user profile', () => {
    service.getMatch(33).subscribe();
    const matchReq = httpMock.expectOne('/api/matches/33');
    expect(matchReq.request.method).toBe('GET');
    matchReq.flush({});

    service.getUserProfile(14).subscribe();
    const userReq = httpMock.expectOne('/api/users/14/profile');
    expect(userReq.request.method).toBe('GET');
    userReq.flush({});
  });
});