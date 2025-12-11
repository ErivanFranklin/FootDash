import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Reaction,
  CreateReactionRequest,
  ReactionSummary,
  ReactionTargetType
} from '../../models/social';

@Injectable({
  providedIn: 'root'
})
export class ReactionsService {
  private apiUrl = `${environment.apiBaseUrl}/reactions`;

  private http = inject(HttpClient);

  addReaction(request: CreateReactionRequest): Observable<Reaction> {
    return this.http.post<{ success: boolean; reaction: Reaction }>(this.apiUrl, request)
      .pipe(map(response => response.reaction));
  }

  removeReaction(targetType: ReactionTargetType, targetId: number): Observable<void> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${targetType}/${targetId}`
    ).pipe(map(() => undefined));
  }

  getReactionSummary(targetType: ReactionTargetType, targetId: number): Observable<ReactionSummary> {
    return this.http.get<{ success: boolean; summary: ReactionSummary }>(
      `${this.apiUrl}/${targetType}/${targetId}`
    ).pipe(map(response => response.summary));
  }

  getReactionsList(targetType: ReactionTargetType, targetId: number): Observable<Reaction[]> {
    return this.http.get<{ success: boolean; reactions: Reaction[] }>(
      `${this.apiUrl}/${targetType}/${targetId}/list`
    ).pipe(map(response => response.reactions));
  }

  getUserReaction(targetType: ReactionTargetType, targetId: number): Observable<Reaction | null> {
    return this.http.get<{ success: boolean; reaction: Reaction | null }>(
      `${this.apiUrl}/user/${targetType}/${targetId}`
    ).pipe(map(response => response.reaction));
  }
}
