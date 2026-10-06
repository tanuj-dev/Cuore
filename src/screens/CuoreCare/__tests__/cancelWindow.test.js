import { computeCancelWindow } from '../cancelWindow';
import { CANCEL_CUTOFF_MINUTES } from '../../../utilities/cuoreCareConfig';

const MIN = 60 * 1000;
const NOW = new Date('2026-08-19T10:00:00Z').getTime();

// `start` is expressed in minutes from NOW so each case reads as "starts in N minutes".
const appt = (startInMin, over = {}) => ({
  appointmentId: 'apt_1',
  mode: 'video',
  status: 'scheduled',
  scheduledStart: new Date(NOW + startInMin * MIN).toISOString(),
  scheduledEnd: new Date(NOW + (startInMin + 15) * MIN).toISOString(),
  ...over,
});

describe('computeCancelWindow', () => {
  it('closes exactly CANCEL_CUTOFF_MINUTES before the start', () => {
    // One minute before the cutoff -> still cancellable.
    expect(computeCancelWindow(appt(CANCEL_CUTOFF_MINUTES + 1), NOW).canCancel).toBe(true);
    // Exactly at the cutoff instant -> closed.
    expect(computeCancelWindow(appt(CANCEL_CUTOFF_MINUTES), NOW).canCancel).toBe(false);
  });

  it('states the deadline while it can still be acted on', () => {
    const w = computeCancelWindow(appt(120), NOW);
    expect(w.canCancel).toBe(true);
    expect(w.notice).toMatch(/Free to cancel or reschedule until/);
    expect(w.notice).toContain(String(CANCEL_CUTOFF_MINUTES));
    expect(w.blockedMsg).toBeNull();
    expect(w.cutoffAt).toBeTruthy();
  });

  it('explains why once the deadline has passed, rather than silently disabling', () => {
    const w = computeCancelWindow(appt(5), NOW);
    expect(w.canCancel).toBe(false);
    expect(w.notice).toBeNull();
    expect(w.blockedMsg).toMatch(/Cancellations closed at/);
    // The patient is told what to do instead of just being refused.
    expect(w.blockedMsg).toMatch(/join the consultation|contact the clinic/);
  });

  it('stays blocked after the start time — that is the no-show path, not a cancellation', () => {
    expect(computeCancelWindow(appt(-5), NOW).canCancel).toBe(false);
  });

  it('exempts "requested" — the doctor has not committed and the cron never sweeps it', () => {
    // This is the trap the server-side rule also avoids: a never-accepted request has no path
    // to a terminal state, so blocking it would leave the patient unable to withdraw it ever.
    const w = computeCancelWindow(appt(5, { status: 'requested' }), NOW);
    expect(w.canCancel).toBe(true);
    expect(w.cutoffAt).toBeNull();
  });

  it('applies to accepted and in_progress as well as scheduled', () => {
    expect(computeCancelWindow(appt(5, { status: 'accepted' }), NOW).canCancel).toBe(false);
    expect(computeCancelWindow(appt(5, { status: 'in_progress' }), NOW).canCancel).toBe(false);
  });

  it('never blocks a terminal appointment (nothing left to cancel)', () => {
    for (const status of ['completed', 'cancelled', 'missed', 'no_show_patient']) {
      expect(computeCancelWindow(appt(5, { status }), NOW).canCancel).toBe(true);
    }
  });

  it('is inert for a missing appointment or a missing start time', () => {
    expect(computeCancelWindow(null, NOW).canCancel).toBe(true);
    expect(computeCancelWindow(appt(5, { scheduledStart: null }), NOW).canCancel).toBe(true);
  });

  it('agrees with the join window: changes close before the room opens', () => {
    // The two rules bracket the appointment. If the cutoff ever drifted later than the join
    // window, a patient could cancel an appointment they were already able to walk into.
    const w = computeCancelWindow(appt(10), NOW); // inside cutoff, room not yet open
    expect(w.canCancel).toBe(false);
  });
});
