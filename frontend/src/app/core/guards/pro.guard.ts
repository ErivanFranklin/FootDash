import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { map, catchError, of } from 'rxjs';

export const proGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);
  const feature = (route.data?.['proFeature'] as string) || state.url;

  const toUpgrade = () =>
    router.createUrlTree(['/pro'], {
      queryParams: { returnUrl: state.url, feature },
    });

  // If we already have the user state
  if (userService.currentUser()) {
    if (userService.isPro()) {
        return true;
    }
    return toUpgrade();
  }

  // If not, fetch profile
  return userService.getProfile().pipe(
    map(user => {
      if (user && user.isPro) {
        return true;
      }
      return toUpgrade();
    }),
    catchError(() => {
       return of(toUpgrade());
    })
  );
};
