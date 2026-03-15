import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { ReactionsService } from './reactions.service';
import { ReactionTargetType, ReactionType } from '../../models/social';

describe('ReactionsService', () => {
  let service: ReactionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(ReactionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds and removes reactions through the expected endpoints', () => {
    let reaction: any;
    let removed = 'pending';

    service
      .addReaction({
        targetType: ReactionTargetType.COMMENT,
        targetId: 4,
        reactionType: ReactionType.LIKE,
      })
      .subscribe((result) => (reaction = result));

    const addReq = httpMock.expectOne('/api/reactions');
    expect(addReq.request.method).toBe('POST');
    expect(addReq.request.body).toEqual({
      targetType: ReactionTargetType.COMMENT,
      targetId: 4,
      reactionType: ReactionType.LIKE,
    });
    addReq.flush({ success: true, reaction: { id: 1, reactionType: ReactionType.LIKE } });

    service
      .removeReaction(ReactionTargetType.COMMENT, 4)
      .subscribe((result) => {
        removed = String(result);
      });
    const removeReq = httpMock.expectOne('/api/reactions/comment/4');
    expect(removeReq.request.method).toBe('DELETE');
    removeReq.flush({ success: true, message: 'removed' });

    expect(reaction).toEqual({ id: 1, reactionType: ReactionType.LIKE });
    expect(removed).toBe('undefined');
  });

  it('gets reaction summary, list, and current user reaction', () => {
    let summary: any;
    let reactions: any;
    let userReaction: any;

    service
      .getReactionSummary(ReactionTargetType.MATCH, 8)
      .subscribe((result) => (summary = result));
    const summaryReq = httpMock.expectOne('/api/reactions/match/8');
    expect(summaryReq.request.method).toBe('GET');
    summaryReq.flush({ success: true, summary: { totalCount: 2 } });

    service
      .getReactionsList(ReactionTargetType.MATCH, 8)
      .subscribe((result) => (reactions = result));
    const listReq = httpMock.expectOne('/api/reactions/match/8/list');
    expect(listReq.request.method).toBe('GET');
    listReq.flush({ success: true, reactions: [{ id: 3 }] });

    service
      .getUserReaction(ReactionTargetType.MATCH, 8)
      .subscribe((result) => (userReaction = result));
    const userReq = httpMock.expectOne('/api/reactions/user/match/8');
    expect(userReq.request.method).toBe('GET');
    userReq.flush({ success: true, reaction: null });

    expect(summary.totalCount).toBe(2);
    expect(reactions).toEqual([{ id: 3 }]);
    expect(userReaction).toBeNull();
  });
});