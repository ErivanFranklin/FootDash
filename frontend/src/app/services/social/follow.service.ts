import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Follow,
  CreateFollowRequest,
  FollowStats,
  PaginatedUsers
} from '../../models/social';

@Injectable({
  providedIn: 'root'
})
export class FollowService {
  private apiUrl = `${environment.apiUrl}/follow`;

  constructor(private http: HttpClient) {}

  followUser(request: CreateFollowRequest): Observable<Follow> {
    return this.http.post<{ success: boolean; follow: Follow }>(this.apiUrl, request)
      .pipe(map(response => response.follow));
  }

  unfollowUser(userId: number): Observable<void> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${userId}`
    ).pipe(map(() => undefined));
  }

  getFollowers(userId: number, page: number = 1, limit: number = 20): Observable<PaginatedUsers> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<{ success: boolean } & PaginatedUsers>(
      `${this.apiUrl}/followers/${userId}`,
      { params }
    ).pipe(map(response => ({
      users: response.users,
      total: response.total,
      page: response.page,
      limit: response.limit,
      hasMore: response.hasMore
    })));
  }

  getFollowing(userId: number, page: number = 1, limit: number = 20): Observable<PaginatedUsers> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<{ success: boolean } & PaginatedUsers>(
      `${this.apiUrl}/following/${userId}`,
      { params }
    ).pipe(map(response => ({
      users: response.users,
      total: response.total,
      page: response.page,
      limit: response.limit,
      hasMore: response.hasMore
    })));
  }

  getFollowStats(userId: number): Observable<FollowStats> {
    return this.http.get<{ success: boolean; stats: FollowStats }>(
      `${this.apiUrl}/stats/${userId}`
    ).pipe(map(response => response.stats));
  }

  isFollowing(userId: number): Observable<boolean> {
    return this.http.get<{ success: boolean; isFollowing: boolean }>(
      `${this.apiUrl}/check/${userId}`
    ).pipe(map(response => response.isFollowing));
  }
}
