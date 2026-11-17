import { Item, Line, Schedule, Slip, Stop } from './models';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Day = (typeof DAYS)[number];
export type Unit = 'kg' | 'bunch' | 'piece';
export const UNITS: Unit[] = ['kg', 'bunch', 'piece'];

const SLIP_KEY = 'cart-last-slip';

export function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function money(price: number): string {
  const rounded = Math.round(price * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return `₹${text}`;
}

export function describeSchedule(schedule: Schedule): string {
  const days = DAYS.filter((day) => schedule.days.includes(day));
  const when = days.length ? days.join(', ') : 'No day';
  return `${when} · ${schedule.start}–${schedule.end}`;
}

export function describeStops(stops: Stop[]): string {
  if (stops.length === 0) {
    return 'No address';
  }
  if (stops.length === 1) {
    return `${stops[0].address} · ${describeSchedule(stops[0].schedule)}`;
  }
  return `${stops.length} addresses`;
}

export function tally(items: { kind: string }[]): string {
  const vegetables = items.filter((item) => item.kind === 'veggie').length;
  const others = items.length - vegetables;
  const parts: string[] = [];
  if (vegetables === 1) {
    parts.push('1 vegetable');
  } else if (vegetables > 1) {
    parts.push(`${vegetables} vegetables`);
  }
  if (others === 1) {
    parts.push('1 other thing');
  } else if (others > 1) {
    parts.push(`${others} other things`);
  }
  return parts.join(' · ');
}

export function cartTokenOk(raw: string): boolean {
  return /^[A-Za-z0-9]{4,32}$/.test(raw.trim());
}

export function nameOk(raw: string): boolean {
  const name = collapse(raw);
  return name.length >= 2 && name.length <= 40;
}

export function addressOk(raw: string): boolean {
  const address = collapse(raw);
  return address.length >= 8 && address.length <= 160;
}

export function parsePrice(raw: string): number | null {
  const text = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return null;
  }
  const value = Number(text);
  if (value < 0 || value > 10000) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

export function scheduleOk(schedule: Schedule): boolean {
  const days = DAYS.filter((day) => schedule.days.includes(day));
  if (!days.length) {
    return false;
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.start)) {
    return false;
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.end)) {
    return false;
  }
  return schedule.start < schedule.end && schedule.note.trim().length <= 80;
}

export function orderedDays(days: readonly string[]): string[] {
  return DAYS.filter((day) => days.includes(day));
}

export function addLine(lines: Line[], item: Pick<Item, 'id' | 'kind' | 'name' | 'price' | 'unit'>): Line[] {
  const existing = lines.find((line) => line.itemId === item.id);
  if (existing) {
    return changeQty(lines, item.id, 1);
  }
  return [
    ...lines,
    { itemId: item.id, kind: item.kind, name: item.name, price: item.price, unit: item.unit, qty: 1 },
  ];
}

export function changeQty(lines: Line[], itemId: string, delta: number): Line[] {
  return lines.flatMap((line) => {
    if (line.itemId !== itemId) {
      return [line];
    }
    const qty = line.qty + delta;
    if (qty <= 0) {
      return [];
    }
    return [{ ...line, qty: Math.min(20, qty) }];
  });
}

export function basketTotal(lines: Line[]): number {
  return Math.round(lines.reduce((sum, line) => sum + line.price * line.qty, 0) * 100) / 100;
}

export function isLoaded(cart: { items: unknown[] }): boolean {
  return cart.items.length > 0;
}

export function keepLines(lines: Line[], items: { id: string }[]): Line[] {
  const ids = new Set(items.map((item) => item.id));
  return lines.filter((line) => ids.has(line.itemId));
}

export function coverUrl(url: string | undefined): string {
  if (!url) {
    return '';
  }
  return url.startsWith('https://') || url.startsWith('http://') ? url : '';
}

export function readSlip(cartId: string): Slip | null {
  try {
    const raw = sessionStorage.getItem(SLIP_KEY);
    if (!raw) {
      return null;
    }
    const slip = JSON.parse(raw) as Slip;
    if (!slip || slip.cart_id !== cartId || typeof slip.driver_token !== 'string') {
      return null;
    }
    return slip;
  } catch {
    return null;
  }
}

export function writeSlip(slip: Slip | null): void {
  try {
    if (!slip) {
      sessionStorage.removeItem(SLIP_KEY);
      return;
    }
    sessionStorage.setItem(SLIP_KEY, JSON.stringify(slip));
  } catch {
    // The slip still shows for this view.
  }
}

export function clearSlip(): void {
  writeSlip(null);
}
