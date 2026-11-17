import { Injectable, computed, inject, signal } from '@angular/core';
import { CartApi } from './cart-api';
import { clearSlip } from './flow';
import { Role } from './models';

const storageKey = 'cart-portal';

interface Saved {
  token: string;
  role: Role;
  cartId: string | null;
}

function isRole(value: unknown): value is Role {
  return value === 'entity' || value === 'loader' || value === 'cart' || value === 'driver';
}

function readSaved(): Saved | null {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<Saved>;
    if (!parsed || typeof parsed.token !== 'string' || !isRole(parsed.role)) {
      return null;
    }
    return {
      token: parsed.token,
      role: parsed.role,
      cartId: typeof parsed.cartId === 'string' ? parsed.cartId : null,
    };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class Session {
  private readonly api = inject(CartApi);
  private readonly saved = signal<Saved | null>(readSaved());

  readonly token = computed(() => this.saved()?.token ?? '');
  readonly role = computed(() => this.saved()?.role ?? null);
  readonly cartId = computed(() => this.saved()?.cartId ?? null);
  readonly title = computed(() => {
    switch (this.role()) {
      case 'loader':
        return 'Loader';
      case 'driver':
        return 'Driver';
      case 'cart':
        return 'Cart';
      case 'entity':
        return 'Entity';
      default:
        return '';
    }
  });

  async enter(raw: string): Promise<void> {
    const token = raw.trim();
    const result = await this.api.login(token);
    this.write({ token, role: result.role, cartId: result.cartId });
  }

  home(): string {
    const role = this.role();
    if (role === 'loader') {
      return '/home/desk';
    }
    if (role === 'driver') {
      return '/home/drive';
    }
    if (role === 'cart' && this.cartId()) {
      return `/home/carts/${this.cartId()}`;
    }
    return '/home/carts';
  }

  leave(): void {
    this.saved.set(null);
    clearSlip();
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // The number is already cleared in memory.
    }
  }

  private write(next: Saved): void {
    this.saved.set(next);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // The room still works for this visit.
    }
  }
}
