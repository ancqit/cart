import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Themes } from './themes/theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  constructor() {
    inject(Themes);
  }
}
