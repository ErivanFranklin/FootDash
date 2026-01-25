import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { map, catchError, of } from 'rxjs';

export const proGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  // If we already have the user state
  if (userService.currentUser()) {
    if (userService.isPro()) {
        return true;
    }
    return router.createUrlTree(['/pro']);
  }

  // If not, fetch profile
  return userService.getProfile().pipe(
    map(user => {
      if (user && user.isPro) {
        return true;
      }
      return router.createUrlTree(['/pro']);
    }),
    catchError(() => {
       return of(router.createUrlTree(['/home'])); // Or login
    })
  );
};
