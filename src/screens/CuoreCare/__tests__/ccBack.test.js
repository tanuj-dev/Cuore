import { goBackOrHome } from '../ccBack';

const nav = (index, over = {}) => ({
  getState: () => (index === null ? undefined : { index, routes: [] }),
  goBack: jest.fn(),
  replace: jest.fn(),
  ...over,
});

describe('goBackOrHome', () => {
  it('pops normally when there is something underneath', () => {
    const n = nav(2);
    goBackOrHome(n);
    expect(n.goBack).toHaveBeenCalled();
    expect(n.replace).not.toHaveBeenCalled();
  });

  it('escapes to the tab root when the screen is the stack\'s only route', () => {
    // The deep-link dead end: goBack() here is a silent no-op, so the chevron must not use it.
    const n = nav(0);
    goBackOrHome(n);
    expect(n.goBack).not.toHaveBeenCalled();
    expect(n.replace).toHaveBeenCalledWith('CuoreCareHome');
  });

  it('honours an explicit fallback route', () => {
    const n = nav(0);
    goBackOrHome(n, 'CuoreCareHistory');
    expect(n.replace).toHaveBeenCalledWith('CuoreCareHistory');
  });

  it('falls back to goBack when the navigator exposes no state or replace', () => {
    const n = { goBack: jest.fn() };
    goBackOrHome(n);
    expect(n.goBack).toHaveBeenCalled();
  });
});
