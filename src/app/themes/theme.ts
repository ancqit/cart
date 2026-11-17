import { Injectable, signal } from '@angular/core';
import { Theme, defaultTheme, offeredThemes, themes } from './themes';

const storageKey = 'cart-theme';

function readTheme(): Theme {
  try {
    const id = localStorage.getItem(storageKey);
    return offeredThemes.find((theme) => theme.id === id) ?? defaultTheme;
  } catch {
    return defaultTheme;
  }
}

@Injectable({ providedIn: 'root' })
export class Themes {
  readonly current = signal<Theme>(readTheme());
  readonly choices = offeredThemes;

  constructor() {
    this.apply(this.current());
  }

  choose(id: string): void {
    const theme = themes.find((item) => item.id === id && item.offered);
    if (!theme) {
      return;
    }
    this.current.set(theme);
    this.apply(theme);
    try {
      localStorage.setItem(storageKey, theme.id);
    } catch {
      // The choice still holds for this visit.
    }
  }

  private apply(theme: Theme): void {
    const root = document.documentElement;
    root.dataset['theme'] = theme.id;
    const pairs: Record<string, string> = {
      '--paper': theme.paper,
      '--ink': theme.ink,
      '--gold': theme.accent,
      '--gold-deep': theme.accentDeep,
      '--wash': theme.wash,
      '--sheet': theme.sheet,
      '--on-accent': theme.onAccent,
      '--radius': theme.radius,
      '--wallpaper': `url("${theme.wallpaper}")`,
    };
    for (const [name, value] of Object.entries(pairs)) {
      root.style.setProperty(name, value);
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.light ? theme.wash : '#16324a');
  }
}
