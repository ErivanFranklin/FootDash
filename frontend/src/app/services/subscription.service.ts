import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  startSubscription(priceId?: string) {
    return this.http.post<{ url: string }>(`${this.apiUrl}/payments/create-checkout-session`, { priceId })
      .pipe(
        switchMap(response => {
           window.location.href = response.url;
           return [];
        })
      );
  }
}
