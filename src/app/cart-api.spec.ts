import { CartApi } from './cart-api';
import { Slip } from './models';

const slip: Slip = {
  id: 'o1',
  driver_token: 'K7M2P4QX',
  cart_id: 'c1',
  cart_name: 'Park gate',
  schedule: { days: ['Mon'], start: '07:00', end: '09:00', note: '' },
  address: '12 Neem Lane near the park',
  lines: [{ veggie_id: 'v1', name: 'Spinach', price: 40, unit: 'bunch', qty: 2 }],
  total: 80,
  status: 'open',
  created_at: '2026-11-17T00:00:00+00:00',
};

describe('cart api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the number to herback', async () => {
    const calls: Array<{ url: string; body: string }> = [];
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push({ url: String(url), body: String(init?.body ?? '') });
      return new Response(JSON.stringify({ ok: true, role: 'loader' }), { status: 200 });
    });
    const result = await new CartApi().login('loader-number');
    expect(result).toEqual({ role: 'loader', cartId: null });
    expect(calls[0].url).toBe('/api/cart/login');
    expect(calls[0].body).toContain('loader-number');
  });

  it('places an order with the bearer number', async () => {
    let auth = '';
    vi.stubGlobal('fetch', async (_url: string, init?: RequestInit) => {
      auth = new Headers(init?.headers).get('authorization') ?? '';
      return new Response(JSON.stringify({ slip }), { status: 201 });
    });
    const result = await new CartApi().placeOrder('entity-number', {
      cart_id: 'c1',
      address: slip.address,
      lines: [{ veggie_id: 'v1', qty: 2 }],
    });
    expect(auth).toBe('Bearer entity-number');
    expect(result.driver_token).toBe('K7M2P4QX');
    expect(result.total).toBe(80);
  });
});
