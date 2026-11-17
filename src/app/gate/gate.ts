import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiError } from '../cart-api';
import { Session } from '../session';
import { ThemePicker } from '../theme-picker/theme-picker';

@Component({
  selector: 'app-gate',
  imports: [ThemePicker],
  templateUrl: './gate.html',
})
export class Gate {
  private readonly session = inject(Session);
  private readonly router = inject(Router);

  readonly code = signal('');
  readonly rejected = signal(false);
  readonly message = signal('That number does not open the portal.');
  readonly busy = signal(false);

  constructor() {
    if (this.session.role()) {
      void this.router.navigateByUrl(this.session.home());
    }
  }

  onCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.code.set(input.value);
    this.rejected.set(false);
  }

  async enter(): Promise<void> {
    const code = this.code().trim();
    if (!code || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.rejected.set(false);
    try {
      await this.session.enter(code);
      await this.router.navigateByUrl(this.session.home());
    } catch (err) {
      this.rejected.set(true);
      this.message.set(
        err instanceof ApiError && err.message ? err.message : 'That number does not open the portal.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
