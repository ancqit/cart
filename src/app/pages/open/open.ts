import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CartApi } from '../../cart-api';
import {
  UNITS,
  Unit,
  addLine,
  basketTotal,
  changeQty,
  coverUrl,
  describeSchedule,
  keepLines,
  money,
  nameOk,
  parsePrice,
  readSlip,
  writeSlip,
} from '../../flow';
import { Cart, Kind, Line, Slip } from '../../models';
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
  private readonly photoInput = viewChild<ElementRef<HTMLInputElement>>('photoInput');

  readonly cart = signal<Cart | null>(null);
  readonly vegetables = computed(() => this.cart()?.items.filter((item) => item.kind === 'veggie') ?? []);
  readonly others = computed(() => this.cart()?.items.filter((item) => item.kind === 'other') ?? []);
  readonly lines = signal<Line[]>([]);
  readonly stopId = signal('');
  readonly kind = signal<Kind>('veggie');
  readonly itemName = signal('');
  readonly price = signal('');
  readonly chosenUnit = signal<Unit>('kg');
  readonly photo = signal<File | null>(null);
  readonly slip = signal<Slip | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly ready = signal(false);
  readonly money = money;
  readonly describeSchedule = describeSchedule;
  readonly basketTotal = basketTotal;
  readonly coverUrl = coverUrl;
  readonly units = UNITS;

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
    return this.lines().find((line) => line.itemId === id)?.qty ?? 0;
  }

  chooseStop(id: string): void {
    this.stopId.set(id);
  }

  pickKind(kind: Kind): void {
    this.kind.set(kind);
  }

  onItem(event: Event): void {
    this.itemName.set((event.target as HTMLInputElement).value);
  }

  onPrice(event: Event): void {
    this.price.set((event.target as HTMLInputElement).value);
  }

  pickUnit(unit: Unit): void {
    this.chosenUnit.set(unit);
  }

  onPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.photo.set(input.files?.[0] ?? null);
  }

  async addItem(event: Event): Promise<void> {
    event.preventDefault();
    const current = this.cart();
    const file = this.photo();
    const price = parsePrice(this.price());
    if (!current) {
      return;
    }
    if (!nameOk(this.itemName())) {
      this.error.set('Name must be 2 to 40 characters.');
      return;
    }
    if (price === null) {
      this.error.set('Price must be a number from 0 to 10000.');
      return;
    }
    if (!file) {
      this.error.set('A fresh photograph is required.');
      return;
    }
    await runBusy(
      this.busy,
      this.error,
      async () => {
        const photo = await this.api.uploadPhoto(this.session.token(), file);
        const cart = await this.api.addItem(this.session.token(), current.id, {
          kind: this.kind(),
          name: this.itemName().replace(/\s+/g, ' ').trim(),
          price,
          unit: this.chosenUnit(),
          photo,
        });
        this.cart.set(cart);
        this.itemName.set('');
        this.price.set('');
        this.photo.set(null);
        const input = this.photoInput()?.nativeElement;
        if (input) {
          input.value = '';
        }
      },
      () => this.leave(),
    );
  }

  async removeItem(itemId: string): Promise<void> {
    const current = this.cart();
    if (!current) {
      return;
    }
    await runBusy(
      this.busy,
      this.error,
      async () => {
        await this.api.removeItem(this.session.token(), current.id, itemId);
        const cart = await this.api.cart(this.session.token(), current.id);
        this.cart.set(cart);
        this.lines.update((lines) => keepLines(lines, cart.items));
      },
      () => this.leave(),
    );
  }

  add(itemId: string): void {
    const item = this.cart()?.items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }
    this.lines.update((lines) => addLine(lines, item));
  }

  bump(id: string, delta: number): void {
    this.lines.update((lines) => changeQty(lines, id, delta));
  }

  async place(event: Event): Promise<void> {
    event.preventDefault();
    const current = this.cart();
    const stopId = this.stopId();
    if (!current || !stopId || this.lines().length === 0) {
      return;
    }
    await runBusy(
      this.busy,
      this.error,
      async () => {
        const slip = await this.api.placeOrder(this.session.token(), {
          cart_id: current.id,
          stop_id: stopId,
          lines: this.lines().map((line) => ({ item_id: line.itemId, qty: line.qty })),
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
  }

  private async load(id: string): Promise<void> {
    await runBusy(
      this.busy,
      this.error,
      async () => {
        const cart = await this.api.cart(this.session.token(), id);
        this.cart.set(cart);
        if (!cart.stops.some((stop) => stop.id === this.stopId())) {
          this.stopId.set(cart.stops[0]?.id ?? '');
        }
        this.lines.update((lines) => keepLines(lines, cart.items));
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
