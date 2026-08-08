// The facade's contract is "never throws, never rejects". These tests assert that by
// making every native module misbehave in the ways real devices actually do: throwing,
// returning nothing, or reporting a revoked permission.

const mockStorage = {};

jest.mock('react-native-encrypted-storage', () => ({
  getItem: jest.fn(async k => mockStorage[k] ?? null),
  setItem: jest.fn(async (k, v) => {
    mockStorage[k] = v;
  }),
  removeItem: jest.fn(async k => {
    delete mockStorage[k];
  }),
}));

jest.mock(
  'react-native-health',
  () => ({
    Constants: {
      Permissions: {
        HeartRate: 'HeartRate',
        RestingHeartRate: 'RestingHeartRate',
        BloodPressureSystolic: 'BloodPressureSystolic',
        BloodPressureDiastolic: 'BloodPressureDiastolic',
        BloodGlucose: 'BloodGlucose',
        OxygenSaturation: 'OxygenSaturation',
        Weight: 'Weight',
        Steps: 'Steps',
        AppleExerciseTime: 'AppleExerciseTime',
        SleepAnalysis: 'SleepAnalysis',
      },
      Units: {
        bpm: 'bpm',
        mgPerdL: 'mgPerdL',
        percent: 'percent',
        gram: 'gram',
        count: 'count',
        minute: 'minute',
      },
    },
    isAvailable: cb => cb(null, true),
    initHealthKit: (_o, cb) => cb(null),
    // Every read throws -- the harshest case the facade must absorb.
    getHeartRateSamples: () => {
      throw new Error('native blew up');
    },
    getDailyStepCountSamples: (_o, cb) => cb('permission denied'),
  }),
  { virtual: true }
);

jest.mock(
  'react-native-health-connect',
  () => ({
    SdkAvailabilityStatus: {
      SDK_UNAVAILABLE: 1,
      SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: 2,
      SDK_AVAILABLE: 3,
    },
    initialize: jest.fn(async () => true),
    getSdkStatus: jest.fn(async () => 3),
    requestPermission: jest.fn(async () => []),
    getGrantedPermissions: jest.fn(async () => []),
    readRecords: jest.fn(async () => {
      throw new Error('permission revoked');
    }),
    openHealthConnectSettings: jest.fn(),
  }),
  { virtual: true }
);

describe('facade contract (iOS)', () => {
  let health;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios' },
      NativeModules: { AppleHealthKit: {} },
    }));
    health = require('../index');
  });

  it('reports the platform name', () => {
    expect(health.platformName()).toBe('healthkit');
  });

  it('resolves availability without throwing', async () => {
    await expect(health.getSdkStatus()).resolves.toBe('available');
  });

  it('returns empty samples rather than throwing when a native read blows up', async () => {
    const result = await health.readMetrics({ metricTypes: ['heartRate', 'steps'] });
    expect(result.samples).toEqual([]);
    expect(result.anchors).toEqual({});
  });

  it('optimistically reports all metrics as granted, because HealthKit will not say', async () => {
    const granted = await health.getGrantedMetrics();
    expect(granted).toEqual(health.SYNCED_METRICS);
  });

  it('reports that iOS has no settings deep link', () => {
    expect(health.openHealthSettings()).toBe(false);
  });
});

describe('facade contract (Android)', () => {
  let health;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock('react-native', () => ({ Platform: { OS: 'android' }, NativeModules: {} }));
    health = require('../index');
  });

  it('reports the platform name', () => {
    expect(health.platformName()).toBe('healthconnect');
  });

  it('absorbs a revoked permission and returns no samples', async () => {
    const result = await health.readMetrics({ metricTypes: ['heartRate', 'steps'] });
    expect(result.samples).toEqual([]);
  });

  it('reports no granted metrics when Health Connect grants nothing', async () => {
    await expect(health.getGrantedMetrics()).resolves.toEqual([]);
  });

  it('opens Health Connect settings', () => {
    expect(health.openHealthSettings()).toBe(true);
  });
});

describe('anchors', () => {
  let anchors;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock('react-native', () => ({ Platform: { OS: 'android' }, NativeModules: {} }));
    anchors = require('../anchors');
  });

  beforeEach(() => {
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  });

  it('uses the 90-day backfill window on first sync', () => {
    const now = Date.parse('2026-08-08T12:00:00Z');
    const { since, until } = anchors.windowFor({}, 'steps', now);
    expect(until.getTime()).toBe(now);
    expect(Math.round((now - since.getTime()) / 86400000)).toBe(90);
  });

  it('overlaps the previous window by 24h so late samples are not missed', () => {
    const now = Date.parse('2026-08-08T12:00:00Z');
    const stored = { steps: '2026-08-08T06:00:00.000Z' };
    const { since } = anchors.windowFor(stored, 'steps', now);
    expect(since.toISOString()).toBe('2026-08-07T06:00:00.000Z');
  });

  it('only ever moves an anchor forward', async () => {
    await anchors.advanceAnchors({ steps: '2026-08-08T10:00:00.000Z' });
    // An out-of-order response must not rewind the anchor and cause an endless re-read.
    const after = await anchors.advanceAnchors({ steps: '2026-08-08T04:00:00.000Z' });
    expect(after.steps).toBe('2026-08-08T10:00:00.000Z');
  });

  it('ignores unparseable anchor values', async () => {
    const after = await anchors.advanceAnchors({ steps: 'not-a-date' });
    expect(after.steps).toBeUndefined();
  });
});
