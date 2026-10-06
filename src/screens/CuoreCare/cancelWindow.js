import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { CANCEL_CUTOFF_MINUTES } from '../../utilities/cuoreCareConfig';
import { fmtTime } from './ccFormat';

/**
 * The one place that decides whether a patient can still call off a consultation.
 *
 * Mirrors the server's patientChangeBlock() (controllers/cuorecare/appointment.controller.js).
 * The backend is the authorization boundary — it answers 409 CANCEL_WINDOW_CLOSED regardless
 * of what this says. This exists so the patient is TOLD the cutoff in advance and finds the
 * buttons already greyed out, rather than tapping "Cancel", confirming a destructive-styled
 * dialog, and only then being refused.
 *
 * Built as a sibling of joinWindow.js on purpose: the two rules bracket the same appointment
 * (changes close 15 min before the start, the room opens 5 min before it) and are far easier
 * to keep coherent when they read the same way.
 */

// Only a consultation the doctor has actually committed to is protected. A "requested"
// appointment is exempt — the server exempts it too, because the no-show cron never sweeps
// requested appointments and a patient must always be able to withdraw one.
const PROTECTED_STATES = ['accepted', 'scheduled', 'in_progress'];

/**
 * Pure computation — `now` is injected so this is testable and so the hook can drive it from
 * a ticking clock.
 *
 * Returns:
 *   canCancel  — may the patient cancel/reschedule right now
 *   cutoffAt   — the moment the window closes (null when the rule doesn't apply)
 *   notice     — forward-looking copy to show while cancelling is still allowed
 *   blockedMsg — explanation to show once it isn't
 */
export function computeCancelWindow(appt, now = Date.now()) {
  if (!appt || !PROTECTED_STATES.includes(appt.status) || !appt.scheduledStart) {
    return { canCancel: true, cutoffAt: null, notice: null, blockedMsg: null };
  }

  const cutoffAt = moment(appt.scheduledStart).subtract(CANCEL_CUTOFF_MINUTES, 'minutes');
  if (moment(now).isBefore(cutoffAt)) {
    return {
      canCancel: true,
      cutoffAt,
      notice: `Free to cancel or reschedule until ${fmtTime(cutoffAt)} — ${CANCEL_CUTOFF_MINUTES} minutes before your appointment.`,
      blockedMsg: null,
    };
  }
  return {
    canCancel: false,
    cutoffAt,
    notice: null,
    blockedMsg: `Cancellations closed at ${fmtTime(cutoffAt)}, ${CANCEL_CUTOFF_MINUTES} minutes before the start. Please join the consultation, or contact the clinic if you cannot attend.`,
  };
}

/**
 * Reactive variant, same shape as useJoinWindow. Without the timer a patient sitting on the
 * screen as the cutoff passes would keep an enabled Cancel button that now 409s — exactly the
 * confusing case this feature is meant to prevent.
 *
 * The interval only runs while a future cutoff is pending; once it has passed (or the rule
 * doesn't apply) it is torn down rather than ticking for the life of the screen.
 */
export function useCancelWindow(appt) {
  const [now, setNow] = useState(() => Date.now());

  const window = useMemo(() => computeCancelWindow(appt, now), [appt, now]);

  const waiting = !!window.cutoffAt && window.canCancel;
  useEffect(() => {
    if (!waiting) return undefined;
    const msUntilCutoff = window.cutoffAt.valueOf() - Date.now();
    // Tick every 15s, but land precisely on the cutoff when it is close so the buttons
    // disable at the right moment rather than up to 15s late.
    const delay = msUntilCutoff > 0 && msUntilCutoff < 15000 ? msUntilCutoff + 250 : 15000;
    const id = setTimeout(() => setNow(Date.now()), delay);
    return () => clearTimeout(id);
  }, [waiting, window.cutoffAt, now]);

  return window;
}
