import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call ping endpoint', () => {
    service.ping().subscribe();
    const req = httpMock.expectOne(req => req.url.endsWith('/health'));
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'ok' });
  });

  it('should get teams with params', () => {
    service.getTeams({ page: 1, limit: 10, search: 'test' }).subscribe();
    const req = httpMock.expectOne(req => req.url.endsWith('/teams') && req.params.get('page') === '1');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('search')).toBe('test');
    req.flush([]);
  });

  it('should get team matches with params', () => {
    service.getTeamMatches(123, { season: 2023, limit: 5 }).subscribe();
    const req = httpMock.expectOne(req => req.url.includes('/matches/team/123'));
    expect(req.request.params.get('season')).toBe('2023');
    expect(req.request.params.get('limit')).toBe('5');
    req.flush([]);
  });

  it('should sync team matches', () => {
    service.syncTeamMatches(123, { range: 'last_5' }).subscribe();
    const req = httpMock.expectOne(req => req.url.includes('/matches/team/123/sync'));
    expect(req.request.method).toBe('POST');
    expect(req.request.params.get('range')).toBe('last_5');
    req.flush({});
  });

  it('should get a single match', () => {
    service.getMatch('m1').subscribe();
    const req = httpMock.expectOne(req => req.url.endsWith('/matches/m1'));
    req.flush({});
  });
});
