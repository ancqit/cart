import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toDataURL } from 'qrcode';
import { ThemePicker } from '../../theme-picker/theme-picker';

export const LINES = [
  { id: 'fresh', text: 'Fresh this morning' },
  { id: 'round', text: 'The round is on' },
  { id: 'priced', text: 'Priced and photographed' },
  { id: 'token', text: 'A token opens the cart' },
] as const;

@Component({
  selector: 'app-qr',
  imports: [ThemePicker, RouterLink],
  templateUrl: './qr.html',
})
export class QrPage {
  readonly lines = LINES;
  readonly chosen = signal<string>(LINES[0].id);
  readonly mark = signal('');
  readonly site = typeof window === 'undefined' ? '' : window.location.origin;

  constructor() {
    void this.paint();
  }

  choose(id: string): void {
    this.chosen.set(id);
    void this.paint();
  }

  line(): string {
    return this.lines.find((entry) => entry.id === this.chosen())?.text ?? LINES[0].text;
  }

  async paint(): Promise<void> {
    if (!this.site) {
      return;
    }
    const data = await toDataURL(this.site, {
      margin: 1,
      width: 360,
      color: { dark: cssVar('--ink', '#243024'), light: '#00000000' },
    });
    this.mark.set(data);
  }

  async download(): Promise<void> {
    const png = await cardPng(this.site, this.line(), this.mark());
    if (!png) {
      return;
    }
    const link = document.createElement('a');
    link.href = png;
    link.download = 'cart-site.png';
    link.click();
  }
}

function cssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') {
    return fallback;
  }
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The mark could not be drawn.'));
    image.src = src;
  });
}

function fit(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: string,
  family: string,
  size: number,
  maxWidth: number,
): void {
  let next = size;
  ctx.font = `${weight} ${next}px ${family}`;
  while (next > 16 && ctx.measureText(text).width > maxWidth) {
    next -= 2;
    ctx.font = `${weight} ${next}px ${family}`;
  }
}

async function cardPng(site: string, line: string, mark: string): Promise<string> {
  if (!mark) {
    return '';
  }
  const image = await loadImage(mark);
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1120;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '';
  }
  const paper = cssVar('--paper', '#f7fbf4');
  const ink = cssVar('--ink', '#243024');
  const wash = cssVar('--wash', '#f3f8ef');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = paper;
  ctx.beginPath();
  ctx.roundRect(70, 70, 760, 980, 48);
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.font = '500 28px Fraunces, Palatino, Georgia, serif';
  ctx.fillText('Cart', 130, 170);
  fit(ctx, line, '560', 'Fraunces, Palatino, Georgia, serif', 54, 640);
  ctx.fillText(line, 130, 260);
  const size = 420;
  ctx.drawImage(image, (canvas.width - size) / 2, 340, size, size);
  ctx.fillStyle = cssVar('--gold-deep', '#3f6b34');
  fit(ctx, site, '400', 'Outfit, "Avenir Next", sans-serif', 24, 640);
  ctx.fillText(site, 130, 860);
  return canvas.toDataURL('image/png');
}
