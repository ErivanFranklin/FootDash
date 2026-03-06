
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(Store);
  const router = inject(Router);
  const auth = inject(AuthService);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    switchMap((isAuth) => {
      const svcAuth = auth.isAuthenticated();
      console.warn('[AuthGuard]', state.url, '→ store:', isAuth, '| svc:', svcAuth);
      if (isAuth || svcAuth) {
        return of(true);
      }

      // New tabs start with empty in-memory token; try restoring from
      // refresh-token cookie before sending the user to login.
      console.warn('[AuthGuard] Attempting tryRestoreSession for', state.url);
      return auth.tryRestoreSession().pipe(
        map((restored) => {
          if (restored) return true;
          return router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          });
        }),
        catchError(() =>
          of(
            router.createUrlTree(['/login'], {
              queryParams: { returnUrl: state.url },
            }),
          ),
        ),
      );
    }),
  );
};
