import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { CartApi } from '../../cart-api';
import { Cart, Slip } from '../../models';
import { OpenCart } from './open';

const cart: Cart = {
  id: 'c1',
  name: 'Park gate',
  stops: [
    {
      id: 's1',
      address: '12 Neem Lane near the park',
      schedule: { days: ['Mon', 'Wed'], start: '07:00', end: '09:00', note: 'Park gate' },
    },
  ],
  items: [
    {
      id: 'v1',
      kind: 'veggie',
      name: 'Spinach',
      price: 40,
      unit: 'bunch',
      photo: {
        url: 'https://media.example/cart/photos/spinach.jpg',
        content_type: 'image/jpeg',
        filename: 'spinach.jpg',
      },
    },
    {
      id: 'o1',
      kind: 'other',
      name: 'Honey',
      price: 120,
      unit: 'piece',
      photo: {
        url: 'https://media.example/cart/photos/honey.jpg',
        content_type: 'image/jpeg',
        filename: 'honey.jpg',
      },
    },
  ],
  loaded: true,
  created_at: '2026-11-17T00:00:00+00:00',
};

const slip: Slip = {
  id: 'o1',
  driver_token: 'K7M2P4QX',
  cart_id: 'c1',
  cart_name: 'Park gate',
  schedule: cart.stops[0].schedule,
  address: '12 Neem Lane near the park',
  lines: [{ item_id: 'v1', kind: 'veggie', name: 'Spinach', price: 40, unit: 'bunch', qty: 1 }],
  total: 40,
  status: 'open',
  created_at: '2026-11-17T00:00:00+00:00',
};

describe('open cart', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem(
      'cart-portal',
      JSON.stringify({ token: 'entity-number', role: 'entity', cartId: null }),
    );
  });

  it('adds a vegetable and issues a driver token', async () => {
    const placeOrder = vi.fn(async () => slip);
    await TestBed.configureTestingModule({
      imports: [OpenCart],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'c1' }) } },
        },
        {
          provide: CartApi,
          useValue: { cart: async () => cart, placeOrder },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(OpenCart);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Spinach');
    expect(root.textContent).toContain('Honey');
    expect(root.textContent).toContain('12 Neem Lane near the park');
    expect(root.textContent).toContain('₹40');
    expect(root.textContent).toContain('Fresh');
    expect(root.querySelector('img')?.getAttribute('src')).toBe(
      'https://media.example/cart/photos/spinach.jpg',
    );

    (root.querySelector('[data-item="v1"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    (root.querySelector('form.basket button[type="submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(placeOrder).toHaveBeenCalled();
    expect(root.textContent).toContain('K7M2P4QX');
    expect(root.textContent).toContain('Token for the driver');
  });

  it('adds a vegetable to the cart from the form', async () => {
    const empty: Cart = { ...cart, items: [], loaded: false };
    const stocked: Cart = { ...cart, items: [cart.items[0]], loaded: true };
    const uploadPhoto = vi.fn(async () => ({
      object_key: 'cart/photos/spinach.jpg',
      content_type: 'image/jpeg',
      filename: 'spinach.jpg',
    }));
    const addItem = vi.fn(async () => stocked);
    await TestBed.configureTestingModule({
      imports: [OpenCart],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'c1' }) } },
        },
        {
          provide: CartApi,
          useValue: { cart: async () => empty, uploadPhoto, addItem },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(OpenCart);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('#stock-form')).not.toBeNull();
    expect(root.textContent).toContain('No vegetable on this cart yet.');
    expect(root.textContent).toContain('Add vegetable');

    const page = fixture.componentInstance;
    page.itemName.set('Spinach');
    page.price.set('40');
    page.pickUnit('bunch');
    page.photo.set(new File(['spinach'], 'spinach.jpg', { type: 'image/jpeg' }));
    await page.addItem(new Event('submit'));
    fixture.detectChanges();

    expect(uploadPhoto).toHaveBeenCalled();
    expect(addItem).toHaveBeenCalledWith('entity-number', 'c1', {
      kind: 'veggie',
      name: 'Spinach',
      price: 40,
      unit: 'bunch',
      photo: {
        object_key: 'cart/photos/spinach.jpg',
        content_type: 'image/jpeg',
        filename: 'spinach.jpg',
      },
    });
    expect(root.textContent).toContain('Spinach');
    expect(root.textContent).not.toContain('No vegetable on this cart yet.');
  });
});
