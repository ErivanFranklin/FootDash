import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;
  
  // Using Signals for state management
  currentUser = signal<User | null>(null);

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/profile`).pipe(
      tap(user => this.currentUser.set(user)),
      catchError(err => {
          this.currentUser.set(null);
          throw err;
      })
    );
  }

  isPro(): boolean {
      return this.currentUser()?.isPro ?? false;
  }
}
