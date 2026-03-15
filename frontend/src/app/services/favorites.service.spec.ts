import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(FavoritesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads favorites with and without type filter', () => {
    let all: any;
    let teamsOnly: any;

    service.loadFavorites().subscribe((data) => (all = data));
    const allReq = httpMock.expectOne('/api/favorites');
    expect(allReq.request.method).toBe('GET');
    allReq.flush([{ id: 1, entityType: 'match', entityId: 9 }]);

    service.loadFavorites('team').subscribe((data) => (teamsOnly = data));
    const teamReq = httpMock.expectOne('/api/favorites?type=team');
    expect(teamReq.request.method).toBe('GET');
    teamReq.flush([{ id: 2, entityType: 'team', entityId: 8 }]);

    expect(all.length).toBe(1);
    expect(teamsOnly.length).toBe(1);
  });

  it('adds favorite and prepends to local stream', () => {
    service.loadFavorites().subscribe();
    httpMock.expectOne('/api/favorites').flush([
      { id: 10, userId: 1, entityType: 'team', entityId: 3, createdAt: 'now' },
    ]);

    service.addFavorite('team', 7).subscribe();
    const req = httpMock.expectOne('/api/favorites');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ entityType: 'team', entityId: 7 });
    req.flush({ id: 11, userId: 1, entityType: 'team', entityId: 7, createdAt: 'now' });

    expect(service.isFavoriteLocal('team', 7)).toBeTrue();
  });

  it('removes favorite and updates local stream', () => {
    service.loadFavorites().subscribe();
    httpMock.expectOne('/api/favorites').flush([
      { id: 10, userId: 1, entityType: 'team', entityId: 3, createdAt: 'now' },
      { id: 11, userId: 1, entityType: 'match', entityId: 7, createdAt: 'now' },
    ]);

    service.removeFavorite('team', 3).subscribe();
    const req = httpMock.expectOne('/api/favorites/team/3');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });

    expect(service.isFavoriteLocal('team', 3)).toBeFalse();
    expect(service.isFavoriteLocal('match', 7)).toBeTrue();
  });

  it('checks remote favorite status', () => {
    let response: any;

    service.isFavorite('match', 99).subscribe((value) => (response = value));
    const req = httpMock.expectOne('/api/favorites/check/match/99');
    expect(req.request.method).toBe('GET');
    req.flush({ isFavorite: true });

    expect(response.isFavorite).toBeTrue();
  });
});
