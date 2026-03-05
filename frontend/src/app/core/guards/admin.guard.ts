import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { catchError, map, of } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  const currentUser = userService.currentUser();
  if (currentUser) {
    return currentUser.role === 'ADMIN' ? true : router.createUrlTree(['/home']);
  }

  return userService.getProfile().pipe(
    map(user => (user?.role === 'ADMIN' ? true : router.createUrlTree(['/home']))),
    catchError(() => of(router.createUrlTree(['/home']))),
  );
};
