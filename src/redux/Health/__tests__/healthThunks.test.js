import { configureStore } from '@reduxjs/toolkit';

jest.mock('../../../utilities/Services', () => ({
  getApiCall: jest.fn(),
  postApiCall: jest.fn(),
  deleteApiCall: jest.fn(),
}));

jest.mock('../../../services/health', () => ({
  SDK_STATUS: { available: 'available', needsUpdate: 'needs_update', unavailable: 'unavailable' },
  platformName: jest.fn(() => 'healthconnect'),
  getSdkStatus: jest.fn(async () => 'available'),
  requestHealthPermissions: jest.fn(async () => true),
  getGrantedMetrics: jest.fn(async () => ['steps']),
  readMetrics: jest.fn(),
  commitAnchors: jest.fn(async () => ({})),
  resetAnchors: jest.fn(async () => {}),
}));

const Services = require('../../../utilities/Services');
const Health = require('../../../services/health');
const reducer = require('../slice').default;
const {
  connectHealthThunk,
  syncHealthThunk,
  disconnectHealthThunk,
} = require('../healthThunks');

// Merge over the slice's real initial state -- preloadedState REPLACES it wholesale, so
// passing a bare {connected:true} would leave every other field undefined and make
// assertions about them meaningless.
const initial = reducer(undefined, { type: '@@INIT' });

const makeStore = (preloaded = {}) =>
  configureStore({
    reducer: { healthSync: reducer },
    preloadedState: { healthSync: { ...initial, ...preloaded } },
    middleware: g => g({ serializableCheck: false }),
  });

const sample = (i, metricType = 'steps') => ({
  metricType,
  value: i,
  unit: 'count',
  startTime: '2026-08-08T06:00:00.000Z',
  endTime: '2026-08-08T06:00:00.000Z',
  externalId: `id-${i}`,
  sourceName: 'test',
});

const okResponse = accepted => ({
  status: 200,
  data: { success: true, accepted, inserted: accepted, rejected: {} },
});

beforeEach(() => {
  jest.clearAllMocks();
  Health.platformName.mockReturnValue('healthconnect');
  Health.getSdkStatus.mockResolvedValue('available');
  Health.requestHealthPermissions.mockResolvedValue(true);
  Health.getGrantedMetrics.mockResolvedValue(['steps']);
  Health.commitAnchors.mockResolvedValue({});
});

describe('chunking', () => {
  it('splits a large read into 2000-sample batches', async () => {
    const samples = Array.from({ length: 4500 }, (_, i) => sample(i));
    Health.readMetrics.mockResolvedValue({ samples, anchors: { steps: '2026-08-08T06:00:00.000Z' } });
    Services.postApiCall.mockResolvedValue(okResponse(2000));

    const store = makeStore({ connected: true, lastSyncedAt: null });
    await store.dispatch(syncHealthThunk({ force: true }));

    expect(Services.postApiCall).toHaveBeenCalledTimes(3);
    const sizes = Services.postApiCall.mock.calls.map(c => c[1].samples.length);
    expect(sizes).toEqual([2000, 2000, 500]);
  });

  it('sends the platform and granted types with every batch', async () => {
    Health.readMetrics.mockResolvedValue({ samples: [sample(1)], anchors: {} });
    Services.postApiCall.mockResolvedValue(okResponse(1));

    const store = makeStore({ connected: true });
    await store.dispatch(syncHealthThunk({ force: true }));

    const body = Services.postApiCall.mock.calls[0][1];
    expect(body.platform).toBe('healthconnect');
    expect(body.grantedTypes).toEqual(['steps']);
  });

  it('still POSTs once when there is nothing to send, to register the connection', async () => {
    // The server records healthSync.enabled inside the sync handler. Skipping the request
    // on an empty read would leave the server believing the user never connected, so the
    // next status fetch returns enabled:false and the screen asks them to connect again --
    // every single time. An empty batch is a few bytes and keeps lastSyncedAt honest.
    Health.readMetrics.mockResolvedValue({ samples: [], anchors: {} });
    Services.postApiCall.mockResolvedValue(okResponse(0));

    const store = makeStore({ connected: true });
    await store.dispatch(syncHealthThunk({ force: true }));

    expect(Services.postApiCall).toHaveBeenCalledTimes(1);
    expect(Services.postApiCall.mock.calls[0][1].samples).toEqual([]);
    expect(store.getState().healthSync.lastSyncedAt).toBeTruthy();
  });
});

describe('anchor safety', () => {
  const anchors = { steps: '2026-08-08T06:00:00.000Z' };

  it('commits anchors when every batch succeeds', async () => {
    Health.readMetrics.mockResolvedValue({ samples: [sample(1)], anchors });
    Services.postApiCall.mockResolvedValue(okResponse(1));

    const store = makeStore({ connected: true });
    await store.dispatch(syncHealthThunk({ force: true }));

    expect(Health.commitAnchors).toHaveBeenCalledWith(anchors);
  });

  it('does NOT commit anchors when a batch fails', async () => {
    // The data-loss case: advancing past a window the server never received would skip
    // those samples permanently.
    Health.readMetrics.mockResolvedValue({ samples: [sample(1)], anchors });
    Services.postApiCall.mockResolvedValue({ status: 500, data: { success: false } });

    const store = makeStore({ connected: true });
    await store.dispatch(syncHealthThunk({ force: true }));

    expect(Health.commitAnchors).not.toHaveBeenCalled();
  });

  it('stops posting after the first failed batch', async () => {
    const samples = Array.from({ length: 4500 }, (_, i) => sample(i));
    Health.readMetrics.mockResolvedValue({ samples, anchors });
    Services.postApiCall
      .mockResolvedValueOnce(okResponse(2000))
      .mockResolvedValueOnce({ status: 500, data: { success: false } })
      .mockResolvedValue(okResponse(500));

    const store = makeStore({ connected: true });
    await store.dispatch(syncHealthThunk({ force: true }));

    expect(Services.postApiCall).toHaveBeenCalledTimes(2);
    expect(Health.commitAnchors).not.toHaveBeenCalled();
  });
});

describe('throttling and guards', () => {
  it('skips a foreground sync inside the 4h window', async () => {
    Health.readMetrics.mockResolvedValue({ samples: [sample(1)], anchors: {} });
    const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const store = makeStore({ connected: true, lastSyncedAt: recent });
    await store.dispatch(syncHealthThunk({}));

    expect(Health.readMetrics).not.toHaveBeenCalled();
  });

  it('runs when the window has elapsed', async () => {
    Health.readMetrics.mockResolvedValue({ samples: [sample(1)], anchors: {} });
    Services.postApiCall.mockResolvedValue(okResponse(1));
    const old = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();

    const store = makeStore({ connected: true, lastSyncedAt: old });
    await store.dispatch(syncHealthThunk({}));

    expect(Health.readMetrics).toHaveBeenCalled();
  });

  it('force bypasses the throttle, for pull-to-refresh', async () => {
    Health.readMetrics.mockResolvedValue({ samples: [sample(1)], anchors: {} });
    Services.postApiCall.mockResolvedValue(okResponse(1));
    const recent = new Date().toISOString();

    const store = makeStore({ connected: true, lastSyncedAt: recent });
    await store.dispatch(syncHealthThunk({ force: true }));

    expect(Health.readMetrics).toHaveBeenCalled();
  });

  it('does nothing when not connected', async () => {
    const store = makeStore({ connected: false });
    await store.dispatch(syncHealthThunk({ force: true }));

    expect(Health.readMetrics).not.toHaveBeenCalled();
  });

  it('does not surface throttled/not-connected as a user-visible error', async () => {
    const store = makeStore({ connected: false });
    await store.dispatch(syncHealthThunk({ force: true }));

    expect(store.getState().healthSync.error).toBeNull();
  });
});

describe('connect', () => {
  it('refuses when the device cannot do it, without asking for permission', async () => {
    Health.getSdkStatus.mockResolvedValue('unavailable');

    const store = makeStore();
    await store.dispatch(connectHealthThunk());

    expect(Health.requestHealthPermissions).not.toHaveBeenCalled();
    expect(store.getState().healthSync.connected).toBe(false);
  });

  it('backfills immediately once permission is granted', async () => {
    Health.readMetrics.mockResolvedValue({ samples: [sample(1)], anchors: {} });
    Services.postApiCall.mockResolvedValue(okResponse(1));

    const store = makeStore();
    await store.dispatch(connectHealthThunk());

    expect(Health.readMetrics).toHaveBeenCalled();
    const s = store.getState().healthSync;
    expect(s.connected).toBe(true);
    expect(s.grantedTypes).toEqual(['steps']);
  });

  it('treats a refused permission as a quiet non-event, not an error', async () => {
    Health.requestHealthPermissions.mockResolvedValue(false);

    const store = makeStore();
    await store.dispatch(connectHealthThunk());

    const s = store.getState().healthSync;
    expect(s.connected).toBe(false);
    expect(s.error).toBeNull();
  });
});

describe('disconnect', () => {
  it('clears local anchors even when the server call fails', async () => {
    // Otherwise a later reconnect starts from the stale anchor and silently skips
    // everything recorded in between.
    Services.deleteApiCall.mockResolvedValue({ status: 500, data: {} });

    const store = makeStore({ connected: true });
    await store.dispatch(disconnectHealthThunk({}));

    expect(Health.resetAnchors).toHaveBeenCalled();
  });

  it('passes the purge flag through', async () => {
    Services.deleteApiCall.mockResolvedValue({ status: 200, data: { deleted: 12 } });

    const store = makeStore({ connected: true });
    await store.dispatch(disconnectHealthThunk({ purge: true }));

    expect(Services.deleteApiCall).toHaveBeenCalledWith(
      expect.stringContaining('purge=true'),
    );
    expect(store.getState().healthSync.connected).toBe(false);
  });
});
