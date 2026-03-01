
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  // Always send credentials (cookies) for auth endpoints
  let cloned = req.clone({ withCredentials: true });

  if (token) {
    cloned = cloned.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
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
