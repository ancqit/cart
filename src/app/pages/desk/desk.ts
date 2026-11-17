import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartApi } from '../../cart-api';
import {
  DAYS,
  Day,
  addressOk,
  cartTokenOk,
  describeStops,
  nameOk,
  orderedDays,
  scheduleOk,
  tally,
} from '../../flow';
import { Cart, Schedule } from '../../models';
import { runBusy } from '../../run';
import { Session } from '../../session';

interface Draft {
  key: string;
  address: string;
  days: string[];
  start: string;
  end: string;
  note: string;
}

function blankDraft(): Draft {
  return {
    key: crypto.randomUUID(),
    address: '',
    days: ['Mon', 'Wed', 'Fri'],
    start: '07:00',
    end: '09:30',
    note: '',
  };
}

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
  readonly stops = signal<Draft[]>([blankDraft()]);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly days = DAYS;
  readonly describeStops = describeStops;
  readonly tally = tally;

  constructor() {
    void this.load();
  }

  onToken(event: Event): void {
    this.cartToken.set((event.target as HTMLInputElement).value);
  }

  onName(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  addDraft(): void {
    this.stops.update((stops) => [...stops, blankDraft()]);
  }

  removeDraft(key: string): void {
    this.stops.update((stops) => (stops.length < 2 ? stops : stops.filter((stop) => stop.key !== key)));
  }

  onAddress(key: string, event: Event): void {
    const address = (event.target as HTMLTextAreaElement).value;
    this.patch(key, { address });
  }

  onStart(key: string, event: Event): void {
    this.patch(key, { start: (event.target as HTMLInputElement).value });
  }

  onEnd(key: string, event: Event): void {
    this.patch(key, { end: (event.target as HTMLInputElement).value });
  }

  onNote(key: string, event: Event): void {
    this.patch(key, { note: (event.target as HTMLInputElement).value });
  }

  toggleDay(key: string, day: Day): void {
    const stop = this.stops().find((item) => item.key === key);
    if (!stop) {
      return;
    }
    const days = stop.days.includes(day) ? stop.days.filter((item) => item !== day) : [...stop.days, day];
    this.patch(key, { days });
  }

  async create(): Promise<void> {
    if (!cartTokenOk(this.cartToken())) {
      this.error.set('Cart token must be 4 to 32 letters or numbers.');
      return;
    }
    if (!nameOk(this.name())) {
      this.error.set('Name must be 2 to 40 characters.');
      return;
    }
    const stops = this.stops().map((stop) => ({
      address: stop.address.replace(/\s+/g, ' ').trim(),
      schedule: {
        days: orderedDays(stop.days),
        start: stop.start,
        end: stop.end,
        note: stop.note.replace(/\s+/g, ' ').trim(),
      } satisfies Schedule,
    }));
    if (stops.some((stop) => !addressOk(stop.address))) {
      this.error.set('Address must be 8 to 160 characters.');
      return;
    }
    if (stops.some((stop) => !scheduleOk(stop.schedule))) {
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
          stops,
        });
        await this.router.navigate(['/home/desk', cart.id]);
      },
      () => this.leave(),
    );
  }

  private patch(key: string, change: Partial<Draft>): void {
    this.stops.update((stops) => stops.map((stop) => (stop.key === key ? { ...stop, ...change } : stop)));
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
