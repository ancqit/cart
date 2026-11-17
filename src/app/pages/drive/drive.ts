import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CartApi } from '../../cart-api';
import { Slip } from '../../models';
import { runBusy } from '../../run';
import { Session } from '../../session';
import { SlipCard } from '../../slip/slip';

@Component({
  selector: 'app-drive',
  imports: [SlipCard],
  templateUrl: './drive.html',
})
export class DrivePage {
  private readonly api = inject(CartApi);
  private readonly router = inject(Router);
  readonly session = inject(Session);

  readonly slip = signal<Slip | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly ready = signal(false);

  constructor() {
    void this.load();
  }

  async mark(): Promise<void> {
    await runBusy(
      this.busy,
      this.error,
      async () => {
        this.slip.set(await this.api.arrive(this.session.token()));
      },
      () => this.leave(),
    );
  }

  private async load(): Promise<void> {
    await runBusy(
      this.busy,
      this.error,
      async () => {
        this.slip.set(await this.api.slip(this.session.token()));
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
