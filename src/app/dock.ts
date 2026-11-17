import { Role } from './models';

export interface DockItem {
  path: string;
  label: string;
}

export function dockFor(role: Role | null, cartId: string | null): DockItem[] {
  if (role === 'loader') {
    return [{ path: '/home/desk', label: 'Carts' }];
  }
  if (role === 'driver') {
    return [{ path: '/home/drive', label: 'Arrival' }];
  }
  if (role === 'cart' && cartId) {
    return [{ path: `/home/carts/${cartId}`, label: 'Cart' }];
  }
  return [{ path: '/home/carts', label: 'Carts' }];
}
