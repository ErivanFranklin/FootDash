import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type SearchType = 'all' | 'teams' | 'users' | 'matches';

export interface SearchResultItem {
  id: number;
  type: 'team' | 'user' | 'match';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  url: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResultItem[];
  total: number;
  page: number;
  limit: number;
  query: string;
  type: SearchType;
}

const RECENT_SEARCHES_KEY = 'footdash_recent_searches';
const MAX_RECENT = 10;

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiBaseUrl;

  readonly recentSearches$ = new BehaviorSubject<string[]>(this.loadRecent());

  search(
    query: string,
    type: SearchType = 'all',
    page = 1,
    limit = 20,
  ): Observable<SearchResponse> {
    const params = new HttpParams()
      .set('q', query)
      .set('type', type)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http
      .get<SearchResponse>(`${this.api}/search`, { params })
      .pipe(tap(() => this.addRecent(query)));
  }

  addRecent(query: string): void {
    const recent = this.loadRecent().filter(
      (q) => q.toLowerCase() !== query.toLowerCase(),
    );
    recent.unshift(query);
    const trimmed = recent.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(trimmed));
    this.recentSearches$.next(trimmed);
  }

  removeRecent(query: string): void {
    const recent = this.loadRecent().filter(
      (q) => q.toLowerCase() !== query.toLowerCase(),
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
    this.recentSearches$.next(recent);
  }

  clearRecent(): void {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    this.recentSearches$.next([]);
  }

  private loadRecent(): string[] {
    try {
      return JSON.parse(
        localStorage.getItem(RECENT_SEARCHES_KEY) ?? '[]',
      ) as string[];
    } catch {
      return [];
    }
  }

  static iconForType(type: string): string {
    switch (type) {
      case 'team':
        return 'shield-outline';
      case 'user':
        return 'person-outline';
      case 'match':
        return 'football-outline';
      default:
        return 'search-outline';
    }
  }

  static colorForType(type: string): string {
    switch (type) {
      case 'team':
        return 'primary';
      case 'user':
        return 'tertiary';
      case 'match':
        return 'success';
      default:
        return 'medium';
    }
  }
}
