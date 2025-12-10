import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  PaginatedComments
} from '../../models/social';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private apiUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) {}

  createComment(request: CreateCommentRequest): Observable<Comment> {
    return this.http.post<{ success: boolean; comment: Comment }>(this.apiUrl, request)
      .pipe(map(response => response.comment));
  }

  getMatchComments(matchId: number, page: number = 1, limit: number = 20): Observable<PaginatedComments> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<{ success: boolean } & PaginatedComments>(
      `${this.apiUrl}/match/${matchId}`,
      { params }
    ).pipe(map(response => ({
      comments: response.comments,
      total: response.total,
      page: response.page,
      limit: response.limit,
      hasMore: response.hasMore
    })));
  }

  getPredictionComments(predictionId: number, page: number = 1, limit: number = 20): Observable<PaginatedComments> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<{ success: boolean } & PaginatedComments>(
      `${this.apiUrl}/prediction/${predictionId}`,
      { params }
    ).pipe(map(response => ({
      comments: response.comments,
      total: response.total,
      page: response.page,
      limit: response.limit,
      hasMore: response.hasMore
    })));
  }

  getReplies(commentId: number, page: number = 1, limit: number = 20): Observable<PaginatedComments> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<{ success: boolean } & PaginatedComments>(
      `${this.apiUrl}/${commentId}/replies`,
      { params }
    ).pipe(map(response => ({
      comments: response.comments,
      total: response.total,
      page: response.page,
      limit: response.limit,
      hasMore: response.hasMore
    })));
  }

  updateComment(commentId: number, request: UpdateCommentRequest): Observable<Comment> {
    return this.http.put<{ success: boolean; comment: Comment }>(
      `${this.apiUrl}/${commentId}`,
      request
    ).pipe(map(response => response.comment));
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${commentId}`
    ).pipe(map(() => undefined));
  }

  getMatchCommentCount(matchId: number): Observable<number> {
    return this.http.get<{ success: boolean; count: number }>(
      `${this.apiUrl}/count/match/${matchId}`
    ).pipe(map(response => response.count));
  }

  getPredictionCommentCount(predictionId: number): Observable<number> {
    return this.http.get<{ success: boolean; count: number }>(
      `${this.apiUrl}/count/prediction/${predictionId}`
    ).pipe(map(response => response.count));
  }
}
