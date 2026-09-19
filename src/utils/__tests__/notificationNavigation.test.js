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

  // ── THE 21 AUG 2026 SPEC'S LINK COLUMN ───────────────────────────────────────────────────
  // The spec names PRODUCTS ("Vitals", "Progress", "Assessment", "Cuore Health", "Records",
  // "Consultation"), none of which were accepted `screen` values. Every one silently fell
  // through the allowlist onto Today, so the notification "worked" while landing on the wrong
  // screen — the exact failure this suite exists to catch, from the sender's side instead of
  // the app's. Each row below is one spec row.
  it.each([
    ['P1 red alert -> Cuore Today', 'CuoreToday', 'Today'],
    ['P2 vitals update -> Vitals', 'Vitals', 'Health'],
    ['P3 health change -> Cuore Today', 'CuoreToday', 'Today'],
    ['P4 consultation booked -> Consultation', 'Consultation', 'AppointmentDetails'],
    ['P5 consultation reminder -> Consultation', 'Consultation', 'AppointmentDetails'],
    ['P6 teleconsult reminder -> Join Consultation', 'JoinConsultation', 'AppointmentDetails'],
    ['P7 cancelled/rescheduled -> Consultation', 'Consultation', 'AppointmentDetails'],
    ['P8 prescription shared -> Records', 'Records', 'HealthRecords'],
    ['P9 follow-up due -> Book Consultation', 'BookConsultation', 'BookConsultation'],
    ['P10 weekly progress -> Progress', 'Progress', 'Score'],
    ['P11 assessment incomplete -> Assessment', 'Assessment', 'OnBoarding'],
    ['P12 records missing -> Cuore Health', 'CuoreHealth', 'Health'],
  ])('resolves the spec link for %s', (_label, screen, expected) => {
    expect(resolveScreen({ screen })).toBe(expected);
  });

  it('accepts the canonical route name as well as the spec alias', () => {
    // The backend may send either; both must land in the same place or the two senders drift.
    expect(resolveScreen({ screen: 'Health' })).toBe('Health');
    expect(resolveScreen({ screen: 'Score' })).toBe('Score');
    expect(resolveScreen({ screen: 'Vitals' })).toBe(resolveScreen({ screen: 'Health' }));
    expect(resolveScreen({ screen: 'Progress' })).toBe(resolveScreen({ screen: 'Score' }));
  });

  it('does not let an alias smuggle in an unlisted destination', () => {
    // An alias must resolve to something ON the allowlist, never bypass it.
    expect(resolveScreen({ screen: 'Login' })).toBe('Today');
    expect(resolveScreen({ screen: 'DeleteAccount' })).toBe('Today');
    expect(resolveScreen({ screen: 'CuoreCareSubscribe' })).toBe('Today');
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

  it('navigates a spec alias to its real route, not to the alias name', () => {
    // Regression guard: aliasing in resolveScreen but NOT here would navigate to a route named
    // "Progress", which does not exist, and React Navigation would warn and do nothing.
    const { ref, navigate } = makeNavRef();
    navigateFromNotification(ref, 'Progress', {});
    expect(navigate).toHaveBeenCalledWith('Score');
  });

  it('navigates the Vitals alias to the Health screen', () => {
    const { ref, navigate } = makeNavRef();
    navigateFromNotification(ref, 'Vitals', {});
    expect(navigate).toHaveBeenCalledWith('Health');
  });

  it('routes P9 Book Consultation into the CuoreCare doctor list', () => {
    // The doctor LIST, deliberately: BookAppointment reads a whole doctor object off its
    // params, which a notification payload cannot carry — it carries an ID and the list
    // resolves it against its live data.
    const { ref, navigate } = makeNavRef();
    navigateFromNotification(ref, 'BookConsultation', {});
    expect(navigate).toHaveBeenCalledWith('Home', {
      screen: 'CuoreCare',
      params: {
        screen: 'CuoreCareDoctors',
        params: { appointmentId: undefined, bookWithDoctorId: null, initialDate: null },
      },
    });
  });

  it('hands a named doctor straight to their booking screen', () => {
    /* A declined consultation says "book another time" and names the doctor who declined, so
       the patient lands on that doctor's calendar rather than on a list they have to search
       again. The list does the hand-off (see DoctorList) once it has resolved the id. */
    const { ref, navigate } = makeNavRef();
    navigateFromNotification(ref, 'BookConsultation', {
      appointmentId: 'apt_9',
      doctorId: 'doc_1',
      initialDate: '2026-10-02',
    });
    expect(navigate).toHaveBeenCalledWith('Home', {
      screen: 'CuoreCare',
      params: {
        screen: 'CuoreCareDoctors',
        params: { appointmentId: 'apt_9', bookWithDoctorId: 'doc_1', initialDate: '2026-10-02' },
      },
    });
  });

  it('routes the Consultation alias into the appointment screen with its id', () => {
    const { ref, navigate } = makeNavRef();
    navigateFromNotification(ref, 'Consultation', { appointmentId: 'apt_3' });
    expect(navigate).toHaveBeenCalledWith('Home', {
      screen: 'CuoreCare',
      params: { screen: 'CuoreCareAppointment', params: { appointmentId: 'apt_3' } },
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
