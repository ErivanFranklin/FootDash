import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Activity,
  PaginatedActivities,
  FeedQuery,
  ActivityType
} from '../../models/social';

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private apiUrl = `${environment.apiUrl}/feed`;

  constructor(private http: HttpClient) {}

  getUserFeed(query: FeedQuery = {}): Observable<PaginatedActivities> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.activityType) params = params.set('activityType', query.activityType);
    
    return this.http.get<{ success: boolean } & PaginatedActivities>(
      this.apiUrl,
      { params }
    ).pipe(map(response => ({
      activities: response.activities,
      total: response.total,
      page: response.page,
      limit: response.limit,
      hasMore: response.hasMore
    })));
  }

  getGlobalFeed(query: FeedQuery = {}): Observable<PaginatedActivities> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.activityType) params = params.set('activityType', query.activityType);
    
    return this.http.get<{ success: boolean } & PaginatedActivities>(
      `${this.apiUrl}/global`,
      { params }
    ).pipe(map(response => ({
      activities: response.activities,
      total: response.total,
      page: response.page,
      limit: response.limit,
      hasMore: response.hasMore
    })));
  }

  getMatchFeed(matchId: number, query: FeedQuery = {}): Observable<PaginatedActivities> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.activityType) params = params.set('activityType', query.activityType);
    
    return this.http.get<{ success: boolean } & PaginatedActivities>(
      `${this.apiUrl}/match/${matchId}`,
      { params }
    ).pipe(map(response => ({
      activities: response.activities,
      total: response.total,
      page: response.page,
      limit: response.limit,
      hasMore: response.hasMore
    })));
  }

  getUserActivity(userId: number, query: FeedQuery = {}): Observable<PaginatedActivities> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.activityType) params = params.set('activityType', query.activityType);
    
    return this.http.get<{ success: boolean } & PaginatedActivities>(
      `${this.apiUrl}/user/${userId}`,
      { params }
    ).pipe(map(response => ({
      activities: response.activities,
      total: response.total,
      page: response.page,
      limit: response.limit,
      hasMore: response.hasMore
    })));
  }
}
