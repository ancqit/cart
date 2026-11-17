import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartApi } from '../../cart-api';
import { coverUrl, describeStops, tally } from '../../flow';
import { Cart } from '../../models';
import { runBusy } from '../../run';
import { Session } from '../../session';

@Component({
  selector: 'app-carts',
  imports: [RouterLink],
  templateUrl: './carts.html',
})
export class CartsPage {
  private readonly api = inject(CartApi);
  private readonly router = inject(Router);
  readonly session = inject(Session);

  readonly carts = signal<Cart[]>([]);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly ready = signal(false);
  readonly describeStops = describeStops;
  readonly tally = tally;
  readonly coverUrl = coverUrl;

  constructor() {
    void this.load();
  }

  cover(cart: Cart): string {
    return coverUrl(cart.items[0]?.photo.url);
  }

  private async load(): Promise<void> {
    await runBusy(
      this.busy,
      this.error,
      async () => {
        this.carts.set(await this.api.carts(this.session.token()));
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
