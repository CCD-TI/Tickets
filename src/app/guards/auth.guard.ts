import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, ActivatedRouteSnapshot } from '@angular/router';

export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    const mail = localStorage.getItem('userEmail');
    const dni = localStorage.getItem('userDNI');

    let userRole: string | null = null;

    if (mail && dni) {
      userRole = 'user';
    } else {
      console.log("session actual: ", (await authService.getSession()).data.session)

      const user = await authService.getCurrentUser();
      console.log("estas en el guard: ", user);
      if (!user) {
        console.log('AuthGuard: No autenticado, redirigiendo a login');
        return router.createUrlTree(['/login']);
      }
      userRole = user.role;
    }

    const allowedRoles = route.data['role'] as string[] | undefined;
    if (!allowedRoles || allowedRoles.includes(userRole)) {
      console.log(`AuthGuard: Acceso permitido para rol ${userRole}`);
      return true;
    }
    switch (userRole) {
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