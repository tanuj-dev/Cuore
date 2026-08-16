import { handleIncomingCall as onIncomingCall } from '../call/callManager';

// CuoreCare deep-link targets live inside the CuoreCare tab stack and need params, so they
// route through nested navigation. All other targets keep a plain top-level navigate.
const CUORECARE_TARGETS = {
  AppointmentDetails: 'CuoreCareAppointment',
  PrescriptionView: 'CuoreCarePrescription',
  CertificateView: 'CuoreCareCertificate',
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
    // CuoreCare deep-link targets (routed into the CuoreCare tab by navigateFromNotification)
    'AppointmentDetails',
    'PrescriptionView',
    'CertificateView',
    // CuoreCare incoming call (iOS taps the APNs alert → routed to the full-screen screen)
    'IncomingCall',
  ];
  const target = data?.screen;
  return allowed.includes(target) ? target : 'Today';
}

// Perform the actual navigation for a resolved screen + its data payload. Takes the
// navigationRef explicitly (rather than importing the App.js singleton) so this stays a
// plain, dependency-free util callable from any screen, not just App.js's own effects.
export function navigateFromNotification(navigationRef, screen = 'Today', data = {}) {
  const tryNavigate = attempt => {
    if (navigationRef.current?.isReady?.()) {
      // Incoming call → the full-screen root screen (rings + Accept/Reject).
      if (screen === 'IncomingCall') {
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
      const innerScreen = CUORECARE_TARGETS[screen];
      if (innerScreen) {
        let params = { appointmentId: data?.appointmentId };
        if (innerScreen === 'CuoreCarePrescription') {
          params = { ...params, prescriptionId: data?.prescriptionId };
        } else if (innerScreen === 'CuoreCareCertificate') {
          params = { ...params, certificateId: data?.certificateId };
        }
        navigationRef.current.navigate('Home', {
          screen: 'CuoreCare',
          params: { screen: innerScreen, params },
        });
      } else {
        navigationRef.current.navigate(screen);
      }
      return;
    }

    if (attempt < 10) {
      setTimeout(() => tryNavigate(attempt + 1), 200);
    }
  };

  tryNavigate(0);
}
