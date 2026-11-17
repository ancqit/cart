import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from './models';
import { Session } from './session';

export const portalGuard: CanActivateFn = () => {
  const session = inject(Session);
  const router = inject(Router);
  return session.role() ? true : router.createUrlTree(['/']);
};

function allow(roles: Role[]): CanActivateFn {
  return () => {
    const session = inject(Session);
    const router = inject(Router);
    const role = session.role();
    if (!role) {
      return router.createUrlTree(['/']);
    }
    return roles.includes(role) ? true : router.createUrlTree([session.home()]);
  };
}

export const entityGuard = allow(['entity']);
export const orderGuard = allow(['entity', 'cart']);
export const loaderGuard = allow(['loader']);
export const driverGuard = allow(['driver']);
