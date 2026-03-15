import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { FollowService } from './follow.service';

describe('FollowService', () => {
  let service: FollowService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(FollowService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('follows and unfollows a user', () => {
    let follow: any;
    let unfollowed = 'pending';

    service.followUser({ followingId: 12 }).subscribe((result) => (follow = result));
    const followReq = httpMock.expectOne('/api/follow');
    expect(followReq.request.method).toBe('POST');
    expect(followReq.request.body).toEqual({ followingId: 12 });
    followReq.flush({ success: true, follow: { id: 1, followingId: 12 } });

    service.unfollowUser(12).subscribe((result) => {
      unfollowed = String(result);
    });
    const unfollowReq = httpMock.expectOne('/api/follow/12');
    expect(unfollowReq.request.method).toBe('DELETE');
    unfollowReq.flush({ success: true, message: 'ok' });

    expect(follow).toEqual({ id: 1, followingId: 12 });
    expect(unfollowed).toBe('undefined');
  });

  it('requests followers and following lists with pagination params', () => {
    let followers: any;
    let following: any;

    service.getFollowers(7, 2, 10).subscribe((result) => (followers = result));
    const followersReq = httpMock.expectOne(
      (request) =>
        request.url === '/api/follow/followers/7' &&
        request.params.get('page') === '2' &&
        request.params.get('limit') === '10',
    );
    expect(followersReq.request.method).toBe('GET');
    followersReq.flush({ success: true, users: [{ id: 1 }], total: 1, page: 2, limit: 10, hasMore: false });

    service.getFollowing(7).subscribe((result) => (following = result));
    const followingReq = httpMock.expectOne(
      (request) =>
        request.url === '/api/follow/following/7' &&
        request.params.get('page') === '1' &&
        request.params.get('limit') === '20',
    );
    expect(followingReq.request.method).toBe('GET');
    followingReq.flush({ success: true, users: [], total: 0, page: 1, limit: 20, hasMore: false });

    expect(followers.total).toBe(1);
    expect(following.users).toEqual([]);
  });

  it('gets follow stats and follow status', () => {
    let stats: any;
    let isFollowing = false;

    service.getFollowStats(5).subscribe((result) => (stats = result));
    const statsReq = httpMock.expectOne('/api/follow/stats/5');
    expect(statsReq.request.method).toBe('GET');
    statsReq.flush({ success: true, stats: { userId: 5, followersCount: 3, followingCount: 4 } });

    service.isFollowing(9).subscribe((result) => (isFollowing = result));
    const checkReq = httpMock.expectOne('/api/follow/check/9');
    expect(checkReq.request.method).toBe('GET');
    checkReq.flush({ success: true, isFollowing: true });

    expect(stats.followersCount).toBe(3);
    expect(isFollowing).toBeTrue();
  });
});