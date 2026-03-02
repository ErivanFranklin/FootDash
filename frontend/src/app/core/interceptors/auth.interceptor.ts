
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

  // Always send credentials (cookies) for auth endpoints
  let cloned = req.clone({ withCredentials: true });

  if (currentToken) {
    cloned = cloned.clone({
      setHeaders: { Authorization: `Bearer ${currentToken}` },
    });
  }

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 and this is NOT a refresh/login/register call, try to refresh
      const isAuthUrl =
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register');

      if (error.status === 401 && !isAuthUrl) {
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
