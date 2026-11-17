import { TestBed } from '@angular/core/testing';
import { Themes } from './theme';
import { defaultTheme, offeredThemes, themes } from './themes';

describe('themes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('opens on meadow and keeps clock unoffered', () => {
    expect(defaultTheme.id).toBe('meadow');
    expect(defaultTheme.light).toBe(true);
    expect(offeredThemes.some((theme) => theme.id === 'clock')).toBe(false);
    expect(themes.some((theme) => theme.id === 'clock' && !theme.offered)).toBe(true);
  });

  it('applies a light theme', () => {
    const themesService = TestBed.inject(Themes);
    themesService.choose('linen');
    expect(document.documentElement.dataset['theme']).toBe('linen');
    expect(themesService.current().light).toBe(true);
    themesService.choose('clock');
    expect(themesService.current().id).toBe('linen');
  });
});
