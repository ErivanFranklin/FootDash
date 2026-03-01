import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type FavoriteEntityType = 'team' | 'match' | 'player';

export interface Favorite {
  id: number;
  userId: number;
  entityType: FavoriteEntityType;
  entityId: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private apiUrl = `${environment.apiBaseUrl}/favorites`;
  private http = inject(HttpClient);

  private favoritesSubject = new BehaviorSubject<Favorite[]>([]);
  favorites$ = this.favoritesSubject.asObservable();

  loadFavorites(type?: FavoriteEntityType): Observable<Favorite[]> {
    const url = type ? `${this.apiUrl}?type=${type}` : this.apiUrl;
    return this.http.get<Favorite[]>(url).pipe(
      tap((favs) => this.favoritesSubject.next(favs)),
    );
  }

  addFavorite(entityType: FavoriteEntityType, entityId: number): Observable<Favorite> {
    return this.http.post<Favorite>(this.apiUrl, { entityType, entityId }).pipe(
      tap((fav) => {
        const current = this.favoritesSubject.value;
        this.favoritesSubject.next([fav, ...current]);
      }),
    );
  }

  removeFavorite(entityType: FavoriteEntityType, entityId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${entityType}/${entityId}`).pipe(
      tap(() => {
        const current = this.favoritesSubject.value;
        this.favoritesSubject.next(
          current.filter(
            (f) => !(f.entityType === entityType && f.entityId === entityId),
          ),
        );
      }),
    );
  }

  isFavorite(entityType: FavoriteEntityType, entityId: number): Observable<{ isFavorite: boolean }> {
    return this.http.get<{ isFavorite: boolean }>(
      `${this.apiUrl}/check/${entityType}/${entityId}`,
    );
  }

  isFavoriteLocal(entityType: FavoriteEntityType, entityId: number): boolean {
    return this.favoritesSubject.value.some(
      (f) => f.entityType === entityType && f.entityId === entityId,
    );
  }
}
