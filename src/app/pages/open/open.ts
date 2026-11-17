import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CartApi } from '../../cart-api';
import {
  addLine,
  addressOk,
  basketTotal,
  changeQty,
  coverUrl,
  describeSchedule,
  keepLines,
  money,
  readSlip,
  writeSlip,
} from '../../flow';
import { Cart, Line, Slip } from '../../models';
import { runBusy } from '../../run';
import { Session } from '../../session';
import { SlipCard } from '../../slip/slip';

@Component({
  selector: 'app-open',
  imports: [RouterLink, SlipCard],
  templateUrl: './open.html',
})
export class OpenCart {
  private readonly api = inject(CartApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly session = inject(Session);

  readonly cart = signal<Cart | null>(null);
  readonly lines = signal<Line[]>([]);
  readonly address = signal('');
  readonly slip = signal<Slip | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly ready = signal(false);
  readonly money = money;
  readonly describeSchedule = describeSchedule;
  readonly basketTotal = basketTotal;
  readonly addressOk = addressOk;
  readonly coverUrl = coverUrl;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.session.role() === 'cart' && this.session.cartId() && this.session.cartId() !== id) {
      void this.router.navigateByUrl(`/home/carts/${this.session.cartId()}`);
      return;
    }
    const saved = readSlip(id);
    if (saved) {
      this.slip.set(saved);
    }
    void this.load(id);
  }

  qtyOf(id: string): number {
    return this.lines().find((line) => line.veggieId === id)?.qty ?? 0;
  }

  add(veggieId: string): void {
    const veggie = this.cart()?.veggies.find((item) => item.id === veggieId);
    if (!veggie) {
      return;
    }
    this.lines.update((lines) => addLine(lines, veggie));
  }

  bump(id: string, delta: number): void {
    this.lines.update((lines) => changeQty(lines, id, delta));
  }

  onAddress(event: Event): void {
    this.address.set((event.target as HTMLTextAreaElement).value);
  }

  async place(event: Event): Promise<void> {
    event.preventDefault();
    const current = this.cart();
    if (!current || !addressOk(this.address()) || this.lines().length === 0) {
      return;
    }
    await runBusy(
      this.busy,
      this.error,
      async () => {
        const slip = await this.api.placeOrder(this.session.token(), {
          cart_id: current.id,
          address: this.address().replace(/\s+/g, ' ').trim(),
          lines: this.lines().map((line) => ({ veggie_id: line.veggieId, qty: line.qty })),
        });
        this.slip.set(slip);
        writeSlip(slip);
      },
      () => this.leave(),
    );
  }

  again(): void {
    this.slip.set(null);
    writeSlip(null);
    this.lines.set([]);
    this.address.set('');
  }

  private async load(id: string): Promise<void> {
    await runBusy(
      this.busy,
      this.error,
      async () => {
        const cart = await this.api.cart(this.session.token(), id);
        this.cart.set(cart);
        this.lines.update((lines) => keepLines(lines, cart.veggies));
        this.ready.set(true);
      },
      () => this.leave(),
    );
  }

  private leave(): void {
    this.session.leave();
    void this.router.navigateByUrl('/');
  }
}
