import { handleIncomingCall as onIncomingCall } from '../call/callManager';

// CuoreCare deep-link targets live inside the CuoreCare tab stack and need params, so they
// route through nested navigation. All other targets keep a plain top-level navigate.
const CUORECARE_TARGETS = {
  AppointmentDetails: 'CuoreCareAppointment',
  PrescriptionView: 'CuoreCarePrescription',
  CertificateView: 'CuoreCareCertificate',
  // P9 "Book Consultation" — the DOCTOR LIST, not the booking form. BookAppointment reads a
  // whole doctor object off route.params.doctor, which a notification payload cannot carry (and
  // should not: `data` is a denormalized snapshot, so a stale doctor would break the screen).
  // The list is one tap from booking and stays correct if the doctor is no longer available.
  BookConsultation: 'CuoreCareDoctors',
};

// The 21 Aug 2026 spec's Link column names PRODUCTS, not routes — "Vitals", "Progress",
// "Assessment", "Cuore Health", "Records", "Consultation". None of those were accepted
// `screen` values, so every one of them fell through the allowlist onto Today: the tap
// "worked" while landing on the wrong screen, which is the failure mode this map removes.
//
// Aliases are resolved BEFORE the allowlist check, so a sender may use either the spec's
// product name or the canonical route name and both land in the same place.
const SCREEN_ALIASES = {
  // Spec: "Cuore Today" -> the Today tab.
  CuoreToday: 'Today',
  // Spec: "Vitals" and "Cuore Health" are both the health-observations screen — it is where a
  // reading and its red/orange/green status are actually shown (src/screens/Health).
  Vitals: 'Health',
  CuoreHealth: 'Health',
  // Spec: "Progress" -> the Cuore Score screen, which holds the trend/score history.
  Progress: 'Score',
  // Spec: "Assessment" -> onboarding, which IS the assessment flow.
  Assessment: 'OnBoarding',
  // Spec: "Records" -> health records.
  Records: 'HealthRecords',
  // Spec: "Consultation" and "Join Consultation" -> the appointment, which hosts the join
  // button inside its own join window. A separate join route would duplicate that logic.
  Consultation: 'AppointmentDetails',
  JoinConsultation: 'AppointmentDetails',
};

// Resolve the deep-link target from a notification's data payload — shared by the real
// push-tap handlers (App.js) and the in-app Notifications screen, since both receive the
// exact same payload shape. The backend sends data.screen (e.g. 'OnBoarding',
// 'HealthRecords', 'RenewSubscription', 'Today'); anything unknown falls back to Today.
export function resolveScreen(data) {
  const allowed = [
    'Today',
    'OnBoarding',
    'HealthRecords',
    'RenewSubscription',
    // Spec destinations: "Vitals"/"Cuore Health" (Health) and "Progress" (Score). Both are
    // registered in the Today and Explore stacks, so a top-level navigate resolves them.
    'Health',
    'Score',
    // CuoreCare deep-link targets (routed into the CuoreCare tab by navigateFromNotification)
    'AppointmentDetails',
    'PrescriptionView',
    'CertificateView',
    'BookConsultation',
    // CuoreCare incoming call (iOS taps the APNs alert → routed to the full-screen screen)
    'IncomingCall',
  ];
  const raw = data?.screen;
  // Resolve a spec product name to its route first; an unaliased value passes through.
  const target = SCREEN_ALIASES[raw] || raw;
  return allowed.includes(target) ? target : 'Today';
}

// Perform the actual navigation for a resolved screen + its data payload. Takes the
// navigationRef explicitly (rather than importing the App.js singleton) so this stays a
// plain, dependency-free util callable from any screen, not just App.js's own effects.
export function navigateFromNotification(navigationRef, screen = 'Today', data = {}) {
  // Alias here too: callers pass the value they were given, which may be a spec product name
  // ("Progress") rather than a route ("Score"). Resolving in only one of the two functions is
  // how resolveScreen and the actual navigate drift apart.
  const resolved = SCREEN_ALIASES[screen] || screen;
  const tryNavigate = attempt => {
    if (navigationRef.current?.isReady?.()) {
      // Incoming call → the full-screen root screen (rings + Accept/Reject).
      if (resolved === 'IncomingCall') {
        onIncomingCall(
          {
            appointmentId: data?.appointmentId,
            mode: data?.mode || 'video',
            doctorName: data?.doctorName,
            from: { name: data?.doctorName || 'Your doctor', role: 'doctor' },
          },
          'notification',
        );
        return;
      }
      const innerScreen = CUORECARE_TARGETS[resolved];
      if (innerScreen) {
        let params = { appointmentId: data?.appointmentId };
        if (innerScreen === 'CuoreCarePrescription') {
          params = { ...params, prescriptionId: data?.prescriptionId };
        } else if (innerScreen === 'CuoreCareCertificate') {
          params = { ...params, certificateId: data?.certificateId };
        } else if (innerScreen === 'CuoreCareDoctors') {
          /* "Book Consultation" links that name a DOCTOR hand straight over to that doctor's
             booking screen — the doctor list resolves the id against its live list and replaces
             itself (see DoctorList). A declined consultation sends one of these, so "book
             another time" lands on the doctor who declined rather than on a list the patient has
             to search all over again. Without a doctorId it stays an ordinary list. */
          params = {
            ...params,
            bookWithDoctorId: data?.doctorId || null,
            initialDate: data?.initialDate || null,
          };
        }
        /* "Tabs" is the drawer's screen that holds the bottom tabs (see
           navigation/DrawerNavigator.js). It has to be named on the way through, or the
           notification lands on Home and goes no further. */
        navigationRef.current.navigate('Home', {
          screen: 'Tabs',
          params: {
            screen: 'CuoreCare',
            params: { screen: innerScreen, params },
          },
        });
      } else {
        navigationRef.current.navigate(resolved);
      }
      return;
    }

    if (attempt < 10) {
      setTimeout(() => tryNavigate(attempt + 1), 200);
    }
  };

  tryNavigate(0);
}
