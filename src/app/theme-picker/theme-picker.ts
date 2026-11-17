import { Component, HostListener, inject, signal } from '@angular/core';
import { Themes } from '../themes/theme';

@Component({
  selector: 'app-theme-picker',
  templateUrl: './theme-picker.html',
  host: { class: 'theme-picker' },
})
export class ThemePicker {
  readonly themes = inject(Themes);
  readonly open = signal(false);

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.open.set(false);
  }

  choose(id: string): void {
    this.themes.choose(id);
    this.open.set(false);
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.open.set(false);
    }
  }
}
