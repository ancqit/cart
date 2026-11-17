import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartApi } from '../../cart-api';
import { DAYS, Day, cartTokenOk, describeSchedule, nameOk, orderedDays, scheduleOk } from '../../flow';
import { Cart, Schedule } from '../../models';
import { runBusy } from '../../run';
import { Session } from '../../session';

@Component({
  selector: 'app-desk',
  imports: [RouterLink],
  templateUrl: './desk.html',
})
export class DeskPage {
  private readonly api = inject(CartApi);
  private readonly router = inject(Router);
  readonly session = inject(Session);

  readonly carts = signal<Cart[]>([]);
  readonly cartToken = signal('');
  readonly name = signal('');
  readonly chosenDays = signal<string[]>(['Mon', 'Wed', 'Fri']);
  readonly start = signal('07:00');
  readonly end = signal('09:30');
  readonly note = signal('');
  readonly error = signal('');
  readonly busy = signal(false);
  readonly days = DAYS;
  readonly describeSchedule = describeSchedule;

  constructor() {
    void this.load();
  }

  onToken(event: Event): void {
    this.cartToken.set((event.target as HTMLInputElement).value);
  }

  onName(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
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

  toggleDay(day: Day): void {
    this.chosenDays.update((days) =>
      days.includes(day) ? days.filter((item) => item !== day) : [...days, day],
    );
  }

  async create(): Promise<void> {
    const schedule: Schedule = {
      days: orderedDays(this.chosenDays()),
      start: this.start(),
      end: this.end(),
      note: this.note().replace(/\s+/g, ' ').trim(),
    };
    if (!cartTokenOk(this.cartToken())) {
      this.error.set('Cart token must be 4 to 32 letters or numbers.');
      return;
    }
    if (!nameOk(this.name())) {
      this.error.set('Name must be 2 to 40 characters.');
      return;
    }
    if (!scheduleOk(schedule)) {
      this.error.set('Choose at least one day, and end the round after it starts.');
      return;
    }
    await runBusy(
      this.busy,
      this.error,
      async () => {
        const cart = await this.api.createCart(this.session.token(), {
          token: this.cartToken().trim(),
          name: this.name().replace(/\s+/g, ' ').trim(),
          schedule,
        });
        await this.router.navigate(['/home/desk', cart.id]);
      },
      () => this.leave(),
    );
  }

  private async load(): Promise<void> {
    await runBusy(
      this.busy,
      this.error,
      async () => {
        this.carts.set(await this.api.carts(this.session.token()));
      },
      () => this.leave(),
    );
  }

  private leave(): void {
    this.session.leave();
    void this.router.navigateByUrl('/');
  }
}
