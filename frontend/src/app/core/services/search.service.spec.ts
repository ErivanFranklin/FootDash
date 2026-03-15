import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SearchService, SearchResponse } from './search.service';
import { environment } from '../../../environments/environment';

describe('SearchService', () => {
  let service: SearchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SearchService]
    });
    service = TestBed.inject(SearchService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should perform search and add to recent', () => {
    const mockResponse: SearchResponse = {
      results: [],
      total: 0,
      page: 1,
      limit: 20,
      query: 'test',
      type: 'all'
    };

    service.search('test').subscribe(res => {
      expect(res).toEqual(mockResponse);
      expect(service.recentSearches$.value).toContain('test');
    });

    const req = httpMock.expectOne(req => req.url.includes('/search') && req.params.get('q') === 'test');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should add recent searches and maintain limit', () => {
    for (let i = 0; i < 15; i++) {
      service.addRecent('search ' + i);
    }
    expect(service.recentSearches$.value.length).toBe(10);
    expect(service.recentSearches$.value[0]).toBe('search 14');
  });

  it('should remove recent search', () => {
    service.addRecent('test');
    service.removeRecent('test');
    expect(service.recentSearches$.value).not.toContain('test');
  });

  it('should clear recent searches', () => {
    service.addRecent('test');
    service.clearRecent();
    expect(service.recentSearches$.value.length).toBe(0);
  });

  it('should return correct icon for type', () => {
    expect(SearchService.iconForType('team')).toBe('shield-outline');
    expect(SearchService.iconForType('user')).toBe('person-outline');
    expect(SearchService.iconForType('match')).toBe('football-outline');
    expect(SearchService.iconForType('unknown')).toBe('search-outline');
  });
});
