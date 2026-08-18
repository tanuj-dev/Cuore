/**
 * Reducer tests for the notification inbox — specifically the delete case, whose counter
 * arithmetic is the easy thing to get wrong (badge going negative, total drifting out of step
 * with the list, a repeated delete double-decrementing).
 *
 * Driven with plain action objects rather than the thunks so the test never touches the API
 * client or any native module.
 */
// The slice imports the thunks, which import utilities/Services -> Common -> NetInfo, a native
// module Jest cannot load. Stubbing the API client cuts that chain: createAsyncThunk only needs
// its payload creator at definition time, and these tests never dispatch a real thunk.
jest.mock('../../../utilities/Services', () => ({
  getApiCall: jest.fn(),
  putApiCall: jest.fn(),
  deleteApiCall: jest.fn(),
}));

import notificationsSlice from '../slice';

const reducer = notificationsSlice.reducer;

const FULFILLED = 'notifications/delete/fulfilled';
const del = (id, wasUnread) => ({ type: FULFILLED, payload: { id, wasUnread } });

const state = (items, unreadCount, total) => ({
  items,
  unreadCount,
  total,
  page: 1,
  loading: false,
  error: null,
});

const unread = id => ({ _id: id, title: 't', body: 'b', read: false });
const read = id => ({ _id: id, title: 't', body: 'b', read: true });

describe('notifications slice — deleteNotification', () => {
  it('removes the row from the list', () => {
    const s = reducer(state([unread('a'), read('b')], 1, 2), del('a', true));
    expect(s.items.map(n => n._id)).toEqual(['b']);
  });

  it('decrements unreadCount when the deleted row was unread', () => {
    const s = reducer(state([unread('a'), read('b')], 1, 2), del('a', true));
    expect(s.unreadCount).toBe(0);
    expect(s.total).toBe(1);
  });

  it('leaves unreadCount alone when the deleted row was already read', () => {
    const s = reducer(state([unread('a'), read('b')], 1, 2), del('b', false));
    expect(s.unreadCount).toBe(1);
    expect(s.total).toBe(1);
  });

  it('never drives unreadCount below zero', () => {
    // Server says the row was unread but the badge is already 0 (stale client state).
    const s = reducer(state([unread('a')], 0, 1), del('a', true));
    expect(s.unreadCount).toBe(0);
  });

  it('never drives total below zero', () => {
    const s = reducer(state([read('a')], 0, 0), del('a', false));
    expect(s.total).toBe(0);
  });

  it('is idempotent — deleting the same id twice decrements only once', () => {
    const once = reducer(state([unread('a'), read('b')], 1, 2), del('a', true));
    const twice = reducer(once, del('a', true));
    expect(twice.items.map(n => n._id)).toEqual(['b']);
    expect(twice.unreadCount).toBe(0);
    expect(twice.total).toBe(1); // NOT 0 — the row was already gone
  });

  it('does not touch counters for an id that was never in the list', () => {
    const s = reducer(state([unread('a')], 1, 5), del('zzz', true));
    expect(s.items.map(n => n._id)).toEqual(['a']);
    expect(s.unreadCount).toBe(1);
    expect(s.total).toBe(5);
  });

  it('leaves the other rows untouched', () => {
    const s = reducer(state([unread('a'), unread('b'), read('c')], 2, 3), del('b', true));
    expect(s.items).toEqual([unread('a'), read('c')]);
    expect(s.unreadCount).toBe(1);
  });
});
