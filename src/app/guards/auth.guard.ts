import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, ActivatedRouteSnapshot } from '@angular/router';

export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    const user = authService.userState();
    if (!user) {
      console.log('AuthGuard: No autenticado, redirigiendo a login');
      return router.createUrlTree(['/login']);
    }

    const allowedRoles = route.data['role'] as string[];
    if (allowedRoles && allowedRoles.includes(user.role)) {
      console.log(`AuthGuard: Acceso permitido para rol ${user.role}`);
      return true;
    }

    console.log(`AuthGuard: Rol ${user.role} no permitido, redirigiendo`);
    // Redirigir según el rol si no tiene acceso
    switch (user.role) {
      case 'user':
        return router.createUrlTree(['/panel-user']);
      case 'trabajador':
        return router.createUrlTree(['/panel-worker']);
      case 'admin':
        return router.createUrlTree(['/panel-admin']);
      default:
        return router.createUrlTree(['/login']);
    }
  } catch (error) {
    console.error('Error en authGuard:', error);
    return router.createUrlTree(['/login']);
  }
};