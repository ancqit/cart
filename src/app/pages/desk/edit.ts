import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CartApi } from '../../cart-api';
import {
  DAYS,
  Day,
  UNITS,
  Unit,
  describeSchedule,
  money,
  nameOk,
  orderedDays,
  parsePrice,
  scheduleOk,
} from '../../flow';
import { Cart, Schedule } from '../../models';
import { runBusy } from '../../run';
import { Session } from '../../session';

@Component({
  selector: 'app-desk-edit',
  imports: [RouterLink],
  templateUrl: './edit.html',
})
export class DeskEditPage {
  private readonly api = inject(CartApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly session = inject(Session);
  private readonly photoInput = viewChild<ElementRef<HTMLInputElement>>('photoInput');

  readonly cart = signal<Cart | null>(null);
  readonly chosenDays = signal<string[]>([]);
  readonly start = signal('07:00');
  readonly end = signal('09:30');
  readonly note = signal('');
  readonly veggieName = signal('');
  readonly price = signal('');
  readonly chosenUnit = signal<Unit>('kg');
  readonly photo = signal<File | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly ready = signal(false);
  readonly days = DAYS;
  readonly units = UNITS;
  readonly money = money;
  readonly describeSchedule = describeSchedule;
  private seeded = false;

  constructor() {
    void this.load(this.route.snapshot.paramMap.get('id') ?? '');
  }

  toggleDay(day: Day): void {
    this.chosenDays.update((days) =>
      days.includes(day) ? days.filter((item) => item !== day) : [...days, day],
    );
  }

  onStart(event: Event): void {
    this.start.set((event.target as HTMLInputElement).value);
  }

  onEnd(event: Event): void {
    this.end.set((event.target as HTMLInputElement).value);
  }

  onNote(event: Event): void {
    this.note.set((event.target as HTMLInputElement).value);
  }

  onVeggie(event: Event): void {
    this.veggieName.set((event.target as HTMLInputElement).value);
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

  async saveSchedule(event: Event): Promise<void> {
    event.preventDefault();
    const current = this.cart();
    if (!current) {
      return;
    }
    const schedule: Schedule = {
      days: orderedDays(this.chosenDays()),
      start: this.start(),
      end: this.end(),
      note: this.note().replace(/\s+/g, ' ').trim(),
    };
    if (!scheduleOk(schedule)) {
      this.error.set('Choose at least one day, and end the round after it starts.');
      return;
    }
    await runBusy(
      this.busy,
      this.error,
      async () => {
        this.cart.set(await this.api.saveSchedule(this.session.token(), current.id, schedule));
      },
      () => this.leave(),
    );
  }

  async addVeggie(event: Event): Promise<void> {
    event.preventDefault();
    const current = this.cart();
    const file = this.photo();
    const price = parsePrice(this.price());
    if (!current) {
      return;
    }
    if (!nameOk(this.veggieName())) {
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
        const cart = await this.api.addVeggie(this.session.token(), current.id, {
          name: this.veggieName().replace(/\s+/g, ' ').trim(),
          price,
          unit: this.chosenUnit(),
          photo,
        });
        this.cart.set(cart);
        this.veggieName.set('');
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

  async removeVeggie(veggieId: string): Promise<void> {
    const current = this.cart();
    if (!current) {
      return;
    }
    await runBusy(
      this.busy,
      this.error,
      async () => {
        await this.api.removeVeggie(this.session.token(), current.id, veggieId);
        await this.reload(current.id);
      },
      () => this.leave(),
    );
  }

  async removeCart(): Promise<void> {
    const current = this.cart();
    if (!current) {
      return;
    }
    await runBusy(
      this.busy,
      this.error,
      async () => {
        await this.api.removeCart(this.session.token(), current.id);
        await this.router.navigateByUrl('/home/desk');
      },
      () => this.leave(),
    );
  }

  private async load(id: string): Promise<void> {
    await runBusy(
      this.busy,
      this.error,
      async () => {
        await this.reload(id);
        this.ready.set(true);
      },
      () => this.leave(),
    );
  }

  private async reload(id: string): Promise<void> {
    const cart = await this.api.cart(this.session.token(), id);
    this.cart.set(cart);
    if (!this.seeded) {
      this.chosenDays.set(cart.schedule.days);
      this.start.set(cart.schedule.start);
      this.end.set(cart.schedule.end);
      this.note.set(cart.schedule.note);
      this.seeded = true;
    }
  }

  private leave(): void {
    this.session.leave();
    void this.router.navigateByUrl('/');
  }
}
