import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from './session';

@Component({
  selector: 'app-home-redirect',
  template: '',
})
export class HomeRedirect {
  constructor() {
    const session = inject(Session);
    const router = inject(Router);
    void router.navigateByUrl(session.home());
  }
}
