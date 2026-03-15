import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(CommentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates a comment and maps the nested response payload', () => {
    let comment: any;

    service
      .createComment({ content: 'hello', matchId: 4 })
      .subscribe((result) => (comment = result));

    const req = httpMock.expectOne('/api/comments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'hello', matchId: 4 });
    req.flush({ success: true, comment: { id: 1, content: 'hello' } });

    expect(comment).toEqual({ id: 1, content: 'hello' });
  });

  it('requests match comments with pagination params', () => {
    let response: any;

    service
      .getMatchComments(9, 2, 15)
      .subscribe((result) => (response = result));

    const req = httpMock.expectOne(
      (request) =>
        request.url === '/api/comments/match/9' &&
        request.params.get('page') === '2' &&
        request.params.get('limit') === '15',
    );

    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      comments: [{ id: 1 }],
      total: 3,
      page: 2,
      limit: 15,
      hasMore: true,
    });

    expect(response.total).toBe(3);
    expect(response.hasMore).toBeTrue();
  });

  it('requests prediction comments and maps pagination response', () => {
    let response: any;

    service
      .getPredictionComments(7)
      .subscribe((result) => (response = result));

    const req = httpMock.expectOne(
      (request) =>
        request.url === '/api/comments/prediction/7' &&
        request.params.get('page') === '1' &&
        request.params.get('limit') === '20',
    );

    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      comments: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    });

    expect(response.comments).toEqual([]);
    expect(response.hasMore).toBeFalse();
  });

  it('requests replies and returns mapped pagination fields', () => {
    service.getReplies(5, 3, 4).subscribe();

    const req = httpMock.expectOne(
      (request) =>
        request.url === '/api/comments/5/replies' &&
        request.params.get('page') === '3' &&
        request.params.get('limit') === '4',
    );

    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      comments: [],
      total: 0,
      page: 3,
      limit: 4,
      hasMore: false,
    });
  });

  it('updates and deletes comments via the expected endpoints', () => {
    let updated: any;
    let deletedValue = 'pending';

    service
      .updateComment(4, { content: 'updated' })
      .subscribe((result) => (updated = result));
    const updateReq = httpMock.expectOne('/api/comments/4');
    expect(updateReq.request.method).toBe('PUT');
    expect(updateReq.request.body).toEqual({ content: 'updated' });
    updateReq.flush({ success: true, comment: { id: 4, content: 'updated' } });

    service.deleteComment(4).subscribe((result) => {
      deletedValue = String(result);
    });
    const deleteReq = httpMock.expectOne('/api/comments/4');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({ success: true, message: 'deleted' });

    expect(updated).toEqual({ id: 4, content: 'updated' });
    expect(deletedValue).toBe('undefined');
  });

  it('gets match and prediction comment counts', () => {
    let matchCount = 0;
    let predictionCount = 0;

    service.getMatchCommentCount(3).subscribe((count) => (matchCount = count));
    const matchReq = httpMock.expectOne('/api/comments/count/match/3');
    expect(matchReq.request.method).toBe('GET');
    matchReq.flush({ success: true, count: 8 });

    service
      .getPredictionCommentCount(6)
      .subscribe((count) => (predictionCount = count));
    const predictionReq = httpMock.expectOne('/api/comments/count/prediction/6');
    expect(predictionReq.request.method).toBe('GET');
    predictionReq.flush({ success: true, count: 5 });

    expect(matchCount).toBe(8);
    expect(predictionCount).toBe(5);
  });
});