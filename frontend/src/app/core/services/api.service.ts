import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = (environment.apiBaseUrl || '').replace(/\/$/, '');

  // Basic ping of backend root
  ping(): Observable<any> {
    return this.http.get(`${this.base}/`);
  }

  // Teams
  getTeams(): Observable<any> {
    return this.http.get(`${this.base}/teams`);
  }

  getTeam(teamId: number | string): Observable<any> {
    return this.http.get(`${this.base}/teams/${teamId}`);
  }

  syncTeam(teamId: number | string): Observable<any> {
    return this.http.post(`${this.base}/teams/${teamId}/sync`, {});
  }

  // Matches/Fixtures for a team
  getTeamMatches(teamId: number | string, opts?: { season?: number | string; range?: string; limit?: number | string; from?: string; to?: string; }): Observable<any> {
    let params = new HttpParams();
    if (opts?.season != null) params = params.set('season', String(opts.season));
    if (opts?.range) params = params.set('range', opts.range);
    if (opts?.limit != null) params = params.set('limit', String(opts.limit));
    if (opts?.from) params = params.set('from', opts.from);
    if (opts?.to) params = params.set('to', opts.to);
    return this.http.get(`${this.base}/matches/team/${teamId}`, { params });
  }

  syncTeamMatches(teamId: number | string, opts?: { season?: number | string; range?: string; limit?: number | string; from?: string; to?: string; }): Observable<any> {
    let params = new HttpParams();
    if (opts?.season != null) params = params.set('season', String(opts.season));
    if (opts?.range) params = params.set('range', opts.range);
    if (opts?.limit != null) params = params.set('limit', String(opts.limit));
    if (opts?.from) params = params.set('from', opts.from);
    if (opts?.to) params = params.set('to', opts.to);
    return this.http.post(`${this.base}/matches/team/${teamId}/sync`, {}, { params });
  }

  // Single match
  getMatch(matchId: number | string): Observable<any> {
    return this.http.get(`${this.base}/matches/${matchId}`);
  }
}
