import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth-service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  const targetUrl = state.url && state.url !== '/' ? state.url : '/home';
  sessionStorage.setItem('returnUrl', targetUrl);
  router.navigate(['/login']);
  return false;
};
