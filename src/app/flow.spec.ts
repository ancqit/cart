import { addLine, addressOk, basketTotal, cartTokenOk, changeQty, describeSchedule, isLoaded, keepLines, money, parsePrice, scheduleOk } from './flow';
import { Line } from './models';

const spinach = { id: 'v1', name: 'Spinach', price: 40, unit: 'bunch' };

describe('cart flow', () => {
  it('describes a round and a price', () => {
    expect(describeSchedule({ days: ['Wed', 'Mon'], start: '07:00', end: '09:30', note: '' })).toBe(
      'Mon, Wed · 07:00–09:30',
    );
    expect(money(40)).toBe('₹40');
    expect(money(40.5)).toBe('₹40.50');
  });

  it('checks a cart token, a name-sized address, and a schedule', () => {
    expect(cartTokenOk('CartTok9')).toBe(true);
    expect(cartTokenOk('no')).toBe(false);
    expect(addressOk('12 Neem Lane')).toBe(true);
    expect(addressOk('short')).toBe(false);
    expect(parsePrice('40')).toBe(40);
    expect(parsePrice('40.5')).toBe(40.5);
    expect(parsePrice('no')).toBeNull();
    expect(scheduleOk({ days: ['Mon'], start: '07:00', end: '09:00', note: '' })).toBe(true);
    expect(scheduleOk({ days: [], start: '07:00', end: '09:00', note: '' })).toBe(false);
    expect(scheduleOk({ days: ['Mon'], start: '09:00', end: '07:00', note: '' })).toBe(false);
  });

  it('adds a vegetable and caps the basket', () => {
    let lines: Line[] = [];
    lines = addLine(lines, spinach);
    lines = addLine(lines, spinach);
    expect(lines).toEqual([{ veggieId: 'v1', name: 'Spinach', price: 40, unit: 'bunch', qty: 2 }]);
    expect(basketTotal(lines)).toBe(80);
    lines = changeQty(lines, 'v1', 30);
    expect(lines[0].qty).toBe(20);
    lines = changeQty(lines, 'v1', -20);
    expect(lines).toEqual([]);
  });

  it('keeps only vegetables still on the cart', () => {
    const lines = addLine([], spinach);
    expect(isLoaded({ veggies: [spinach] })).toBe(true);
    expect(keepLines(lines, [])).toEqual([]);
    expect(keepLines(lines, [{ id: 'v1' }])).toEqual(lines);
  });
});
