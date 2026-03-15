import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { SearchService } from './search.service';

describe('SearchService', () => {
  let service: SearchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(SearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('searches with query params and stores recent query', () => {
    let response: any;

    service
      .search('arsenal', 'teams', 2, 5)
      .subscribe((result) => (response = result));

    const req = httpMock.expectOne(
      (request) =>
        request.url === '/api/search' &&
        request.params.get('q') === 'arsenal' &&
        request.params.get('type') === 'teams' &&
        request.params.get('page') === '2' &&
        request.params.get('limit') === '5',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      results: [{ id: 1, type: 'team', title: 'Arsenal', url: '/teams/1', score: 1 }],
      total: 1,
      page: 2,
      limit: 5,
      query: 'arsenal',
      type: 'teams',
    });

    expect(response.total).toBe(1);
    expect(service.recentSearches$.value[0]).toBe('arsenal');
  });

  it('addRecent de-duplicates and limits to max entries', () => {
    for (let i = 0; i < 12; i += 1) {
      service.addRecent(`q${i}`);
    }
    service.addRecent('Q1');

    expect(service.recentSearches$.value.length).toBe(10);
    expect(service.recentSearches$.value[0]).toBe('Q1');
    expect(service.recentSearches$.value.filter((x) => x.toLowerCase() === 'q1').length).toBe(1);
  });

  it('removes and clears recent searches', () => {
    service.addRecent('first');
    service.addRecent('second');

    service.removeRecent('FIRST');
    expect(service.recentSearches$.value).toEqual(['second']);

    service.clearRecent();
    expect(service.recentSearches$.value).toEqual([]);
  });

  it('loads empty recent list if local storage is invalid JSON', () => {
    localStorage.setItem('footdash_recent_searches', 'not-json');
    const fresh = TestBed.runInInjectionContext(() => new SearchService());
    expect(fresh.recentSearches$.value).toEqual([]);
  });

  it('returns icon and color for known and unknown result types', () => {
    expect(SearchService.iconForType('team')).toBe('shield-outline');
    expect(SearchService.iconForType('unknown')).toBe('search-outline');
    expect(SearchService.colorForType('match')).toBe('success');
    expect(SearchService.colorForType('unknown')).toBe('medium');
  });
});