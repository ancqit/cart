import { Injectable } from '@angular/core';
import { API_URL } from './api-base';
import { Cart, Kind, OrderLine, Role, Schedule, Slip, StoredPhoto } from './models';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

interface Ticket {
  upload_url: string;
  object_key: string;
  content_type: string;
  headers?: Record<string, string>;
  method?: string;
  max_bytes?: number;
}

const PHOTO_BYTES = 8 * 1024 * 1024;

function guessImageType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function toError(response: Response): Promise<ApiError> {
  let message = 'The portal could not do that.';
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === 'string' && body.detail) {
      message = body.detail;
    }
  } catch {
    // Keep the quiet line.
  }
  return new ApiError(message, response.status);
}

@Injectable({ providedIn: 'root' })
export class CartApi {
  async login(token: string): Promise<{ role: Role; cartId: string | null }> {
    const body = await this.send<{ ok: boolean; role: Role; cart_id?: string }>(
      '/cart/login',
      '',
      'POST',
      { token },
    );
    if (body.role !== 'entity' && body.role !== 'loader' && body.role !== 'cart' && body.role !== 'driver') {
      throw new ApiError('The portal could not do that.', 500);
    }
    return { role: body.role, cartId: body.cart_id ?? null };
  }

  carts(token: string): Promise<Cart[]> {
    return this.send<{ carts: Cart[] }>('/cart/carts', token, 'GET').then((body) => body.carts);
  }

  cart(token: string, id: string): Promise<Cart> {
    return this.send<{ cart: Cart }>(`/cart/carts/${id}`, token, 'GET').then((body) => body.cart);
  }

  createCart(
    token: string,
    body: { token: string; name: string; stops: { address: string; schedule: Schedule }[] },
  ): Promise<Cart> {
    return this.send<{ cart: Cart }>('/cart/carts', token, 'POST', body).then((payload) => payload.cart);
  }

  addStop(
    token: string,
    id: string,
    body: { address: string; schedule: Schedule },
  ): Promise<Cart> {
    return this.send<{ cart: Cart }>(`/cart/carts/${id}/stops`, token, 'POST', body).then((payload) => payload.cart);
  }

  removeStop(token: string, cartId: string, stopId: string): Promise<void> {
    return this.send<void>(`/cart/carts/${cartId}/stops/${stopId}`, token, 'DELETE');
  }

  addItem(
    token: string,
    id: string,
    body: { kind: Kind; name: string; price: number; unit: string; photo: StoredPhoto },
  ): Promise<Cart> {
    return this.send<{ cart: Cart }>(`/cart/carts/${id}/items`, token, 'POST', body).then((payload) => payload.cart);
  }

  removeItem(token: string, cartId: string, itemId: string): Promise<void> {
    return this.send<void>(`/cart/carts/${cartId}/items/${itemId}`, token, 'DELETE');
  }

  removeCart(token: string, id: string): Promise<void> {
    return this.send<void>(`/cart/carts/${id}`, token, 'DELETE');
  }

  placeOrder(
    token: string,
    body: { cart_id: string; stop_id: string; lines: OrderLine[] },
  ): Promise<Slip> {
    return this.send<{ slip: Slip }>('/cart/orders', token, 'POST', body).then((payload) => payload.slip);
  }

  slip(token: string): Promise<Slip> {
    return this.send<{ slip: Slip }>('/cart/slip', token, 'GET').then((body) => body.slip);
  }

  arrive(token: string): Promise<Slip> {
    return this.send<{ slip: Slip }>('/cart/orders/arrive', token, 'POST').then((body) => body.slip);
  }

  async uploadPhoto(token: string, file: File): Promise<StoredPhoto> {
    if (file.size > PHOTO_BYTES) {
      throw new ApiError('A photograph must be 8 MB or smaller.', 400);
    }
    const contentType = file.type && file.type !== 'application/octet-stream' ? file.type : guessImageType(file.name);
    const ticket = await this.send<Ticket>('/cart/upload-url', token, 'POST', {
      contentType,
      filename: file.name,
    });
    if ((ticket.max_bytes ?? PHOTO_BYTES) < file.size) {
      throw new ApiError('A photograph must be 8 MB or smaller.', 400);
    }
    let put: Response;
    try {
      put = await fetch(ticket.upload_url, {
        method: ticket.method || 'PUT',
        headers: ticket.headers ?? { 'content-type': ticket.content_type },
        body: file,
      });
    } catch {
      throw new ApiError('The photograph did not upload.', 0);
    }
    if (!put.ok) {
      throw new ApiError('The photograph did not upload.', put.status);
    }
    return {
      object_key: ticket.object_key,
      content_type: ticket.content_type,
      filename: file.name,
    };
  }

  private async send<T>(path: string, token: string, method: string, json?: unknown): Promise<T> {
    const headers = new Headers();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    if (json !== undefined) {
      headers.set('content-type', 'application/json');
    }
    let response: Response;
    try {
      response = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: json !== undefined ? JSON.stringify(json) : undefined,
      });
    } catch {
      throw new ApiError('The portal could not reach the carts.', 0);
    }
    if (!response.ok) {
      throw await toError(response);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }
}
