import { dockFor } from './dock';

describe('dock', () => {
  it('follows the role', () => {
    expect(dockFor('entity', null)[0].path).toBe('/home/carts');
    expect(dockFor('loader', null)[0].path).toBe('/home/desk');
    expect(dockFor('driver', null)[0].label).toBe('Arrival');
    expect(dockFor('cart', 'abc')[0].path).toBe('/home/carts/abc');
  });
});
