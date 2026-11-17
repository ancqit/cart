import { TestBed } from '@angular/core/testing';
import { CartApi } from './cart-api';
import { Session } from './session';

describe('session', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('sends the entity home to loaded carts', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CartApi,
          useValue: { login: async () => ({ role: 'entity', cartId: null }) },
        },
      ],
    });
    const session = TestBed.inject(Session);
    await session.enter('entity-number');
    expect(session.role()).toBe('entity');
    expect(session.home()).toBe('/home/carts');
    session.leave();
    expect(session.role()).toBeNull();
  });

  it('opens the cart the token names', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CartApi,
          useValue: { login: async () => ({ role: 'cart', cartId: 'abc' }) },
        },
      ],
    });
    const session = TestBed.inject(Session);
    await session.enter('CartTok9');
    expect(session.home()).toBe('/home/carts/abc');
  });
});
