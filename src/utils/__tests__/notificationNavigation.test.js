import { resolveScreen, navigateFromNotification } from '../notificationNavigation';

// The call manager is only reachable through a native-ish module graph; the resolver and
// navigator are pure enough to test with it stubbed.
jest.mock('../../call/callManager', () => ({ handleIncomingCall: jest.fn() }));
const { handleIncomingCall } = require('../../call/callManager');

// A navigationRef stand-in that records what the util asked for.
function makeNavRef({ ready = true } = {}) {
  const navigate = jest.fn();
  return { ref: { current: { isReady: () => ready, navigate } }, navigate };
}

describe('resolveScreen', () => {
  // These are the exact payloads the backend emits today. If a sender changes its
  // `screen` string without adding it to the allowlist, the tap silently lands on Today —
  // which is the bug this suite exists to catch.
  it.each([
    ['nudge engine — assessment', { screen: 'OnBoarding' }, 'OnBoarding'],
    ['nudge engine — records', { screen: 'HealthRecords' }, 'HealthRecords'],
    ['nudge engine — renewal', { screen: 'RenewSubscription' }, 'RenewSubscription'],
    ['nudge engine — health alert', { screen: 'Today' }, 'Today'],
    ['cuorecare appointment', { screen: 'AppointmentDetails', appointmentId: 'apt_1' }, 'AppointmentDetails'],
    ['cuorecare prescription', { screen: 'PrescriptionView', prescriptionId: 'rx_1' }, 'PrescriptionView'],
    ['cuorecare certificate', { screen: 'CertificateView', certificateId: 'cert_1' }, 'CertificateView'],
    ['cuorecare incoming call', { screen: 'IncomingCall', appointmentId: 'apt_1' }, 'IncomingCall'],
  ])('routes %s', (_label, data, expected) => {
    expect(resolveScreen(data)).toBe(expected);
  });

  it('routes the timeline reminder payload to Today', () => {
    // Regression: cronJobs.js used to omit `screen` entirely, so every reminder tap fell
    // through the allowlist onto the Today default by accident rather than by intent.
    expect(resolveScreen({ screen: 'Today', cardId: 'c1', type: 'medication' })).toBe('Today');
  });

  it('falls back to Today for an unknown screen', () => {
    expect(resolveScreen({ screen: 'NotARealScreen' })).toBe('Today');
  });

  it('falls back to Today for a missing/!empty payload', () => {
    expect(resolveScreen({})).toBe('Today');
    expect(resolveScreen(undefined)).toBe('Today');
    expect(resolveScreen(null)).toBe('Today');
  });
});

describe('navigateFromNotification', () => {
  beforeEach(() => jest.clearAllMocks());

  it('navigates a plain top-level screen directly', () => {
    const { ref, navigate } = makeNavRef();
    navigateFromNotification(ref, 'HealthRecords', { screen: 'HealthRecords' });
    expect(navigate).toHaveBeenCalledWith('HealthRecords');
  });

  it('nests CuoreCare appointment targets into the CuoreCare tab with params', () => {
    const { ref, navigate } = makeNavRef();
    navigateFromNotification(ref, 'AppointmentDetails', { appointmentId: 'apt_9' });
    expect(navigate).toHaveBeenCalledWith('Home', {
      screen: 'CuoreCare',
      params: { screen: 'CuoreCareAppointment', params: { appointmentId: 'apt_9' } },
    });
  });

  it('carries prescriptionId through to the prescription viewer', () => {
    const { ref, navigate } = makeNavRef();
    navigateFromNotification(ref, 'PrescriptionView', { appointmentId: 'apt_9', prescriptionId: 'rx_9' });
    expect(navigate).toHaveBeenCalledWith('Home', {
      screen: 'CuoreCare',
      params: {
        screen: 'CuoreCarePrescription',
        params: { appointmentId: 'apt_9', prescriptionId: 'rx_9' },
      },
    });
  });

  it('carries certificateId through to the certificate viewer', () => {
    const { ref, navigate } = makeNavRef();
    navigateFromNotification(ref, 'CertificateView', { appointmentId: 'apt_9', certificateId: 'cert_9' });
    expect(navigate).toHaveBeenCalledWith('Home', {
      screen: 'CuoreCare',
      params: {
        screen: 'CuoreCareCertificate',
        params: { appointmentId: 'apt_9', certificateId: 'cert_9' },
      },
    });
  });

  it('hands an incoming call to the call manager rather than navigating', () => {
    const { ref, navigate } = makeNavRef();
    navigateFromNotification(ref, 'IncomingCall', {
      appointmentId: 'apt_9',
      mode: 'video',
      doctorName: 'Dr Rakesh',
    });
    expect(navigate).not.toHaveBeenCalled();
    expect(handleIncomingCall).toHaveBeenCalledWith(
      expect.objectContaining({ appointmentId: 'apt_9', mode: 'video', doctorName: 'Dr Rakesh' }),
      'notification',
    );
  });

  it('retries until the navigator is ready instead of dropping the tap (cold start)', () => {
    jest.useFakeTimers();
    const navigate = jest.fn();
    let ready = false;
    const ref = { current: { isReady: () => ready, navigate } };

    navigateFromNotification(ref, 'Today', {});
    expect(navigate).not.toHaveBeenCalled(); // nav tree not mounted yet

    ready = true;
    jest.advanceTimersByTime(200);
    expect(navigate).toHaveBeenCalledWith('Today');
    jest.useRealTimers();
  });

  it('gives up after the retry budget rather than looping forever', () => {
    jest.useFakeTimers();
    const navigate = jest.fn();
    const ref = { current: { isReady: () => false, navigate } };

    navigateFromNotification(ref, 'Today', {});
    jest.advanceTimersByTime(200 * 15);
    expect(navigate).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
