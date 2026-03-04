
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthService } from '../services/auth.service';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, first, switchMap, throwError } from 'rxjs';
import { selectToken } from '../../store/auth/auth.selectors';
import { authSetToken } from '../../store/auth/auth.actions';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);
  const auth = inject(AuthService);

  // Read token synchronously from the Store's latest emission
  let currentToken: string | null = null;
  store.select(selectToken).pipe(first()).subscribe(t => (currentToken = t));
  const runtimeToken = auth.getToken();
  const tokenForRequest = currentToken || runtimeToken;

  // Always send credentials (cookies) for auth endpoints
  let cloned = req.clone({ withCredentials: true });

  if (tokenForRequest && auth.isAuthenticated()) {
    cloned = cloned.clone({
      setHeaders: { Authorization: `Bearer ${tokenForRequest}` },
    });
  }

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 and this is NOT a refresh/login/register call, try to refresh
      const isAuthUrl =
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register');
      const isPassiveNotificationPoll =
        req.url.includes('/alerts/unread') ||
        req.url.includes('/alerts/counts/by-type');

      const hasSessionToken = auth.isAuthenticated();

      if (
        error.status === 401 &&
        !isAuthUrl &&
        !isPassiveNotificationPoll &&
        hasSessionToken
      ) {
        return auth.refreshAccessToken().pipe(
          switchMap((newToken) => {
            if (!newToken) {
              return throwError(() => error);
            }
            // Sync new token into the Store
            const decoded = (auth as any).jwtHelper?.decodeToken?.(newToken);
            store.dispatch(authSetToken({ token: newToken, userId: decoded?.sub ?? 0 }));

            // Retry original request with new token
            const retried = req.clone({
              withCredentials: true,
              setHeaders: { Authorization: `Bearer ${newToken}` },
            });
            return next(retried);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
