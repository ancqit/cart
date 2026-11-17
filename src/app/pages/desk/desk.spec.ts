import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartApi } from '../../cart-api';
import { DeskPage } from './desk';

describe('desk', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem(
      'cart-portal',
      JSON.stringify({ token: 'loader-number', role: 'loader', cartId: null }),
    );
  });

  it('has a small input for the cart token', async () => {
    await TestBed.configureTestingModule({
      imports: [DeskPage],
      providers: [provideRouter([]), { provide: CartApi, useValue: { carts: async () => [] } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(DeskPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('#cart-token') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.classList.contains('token-input')).toBe(true);
    expect(root.textContent).toContain('This token is the cart.');
    expect(root.textContent).toContain('Add another address');
  });
});
