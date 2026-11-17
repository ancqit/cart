import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { dockFor } from '../dock';
import { Session } from '../session';
import { ThemePicker } from '../theme-picker/theme-picker';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ThemePicker],
  templateUrl: './shell.html',
})
export class Shell {
  private readonly router = inject(Router);
  readonly session = inject(Session);
  readonly items = computed(() => dockFor(this.session.role(), this.session.cartId()));

  leave(): void {
    this.session.leave();
    void this.router.navigateByUrl('/');
  }
}
