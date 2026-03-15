import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { FeedService } from './feed.service';
import { ActivityType } from '../../models/social';

describe('FeedService', () => {
  let service: FeedService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(FeedService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets user feed with mapped response and query params', () => {
    let response: any;
    service
      .getUserFeed({ page: 2, limit: 5, activityType: ActivityType.COMMENT })
      .subscribe((res) => (response = res));

    const req = httpMock.expectOne((r) =>
      r.url === '/api/feed' &&
      r.params.get('page') === '2' &&
      r.params.get('limit') === '5' &&
      r.params.get('activityType') === ActivityType.COMMENT,
    );

    req.flush({
      success: true,
      activities: [{ id: 1 }],
      total: 1,
      page: 2,
      limit: 5,
      hasMore: true,
    });

    expect(response.total).toBe(1);
    expect(response.hasMore).toBeTrue();
  });

  it('gets global feed endpoint', () => {
    service.getGlobalFeed({ page: 1, limit: 10 }).subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === '/api/feed/global' &&
      r.params.get('page') === '1' &&
      r.params.get('limit') === '10',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, activities: [], total: 0, page: 1, limit: 10, hasMore: false });
  });

  it('gets match feed endpoint', () => {
    service.getMatchFeed(11, { page: 3 }).subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === '/api/feed/match/11' && r.params.get('page') === '3',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, activities: [], total: 0, page: 3, limit: 20, hasMore: false });
  });

  it('gets user activity endpoint', () => {
    service.getUserActivity(99, { limit: 7 }).subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === '/api/feed/user/99' && r.params.get('limit') === '7',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, activities: [], total: 0, page: 1, limit: 7, hasMore: false });
  });
});
