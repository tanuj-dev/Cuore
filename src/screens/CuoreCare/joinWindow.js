import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { JOIN_EARLY_MINUTES } from '../../utilities/cuoreCareConfig';
import { fmtDayLabel, fmtTime } from './ccFormat';

/**
 * The one place that decides whether a consultation can be joined right now.
 *
 * This used to live inline in AppointmentDetails. It is shared because the Today screen's
 * consultation card needs exactly the same answer, and two copies of a rule like "the room
 * opens N minutes early, but never for a walk-in" drift apart the moment one is edited.
 *
 * Mirrors the server's own gate (controllers/cuorecare/appointment.controller.js
 * assertJoinable) — the client is only ever hiding a button the backend would reject anyway,
 * so this stays advisory and is never the authorization boundary.
 */

// States from which a room can be entered. `accepted` is transient (the backend immediately
// promotes it to `scheduled`) but is accepted here so a just-confirmed appointment doesn't
// briefly show a disabled button.
const JOINABLE_STATES = ['scheduled', 'in_progress', 'accepted'];

/**
 * Pure computation — `now` is injected so this is testable and so the hook below can drive
 * it from a ticking clock.
 */
export function computeJoinWindow(appt, now = Date.now()) {
  // A walk-in has no room to join: the doctor documents it from their own EMR queue.
  if (!appt || appt.mode === 'in_person' || !JOINABLE_STATES.includes(appt.status)) {
    return { canJoin: false, opensAt: null, joinLabel: null, isWalkIn: appt?.mode === 'in_person' };
  }

  const opensAt = moment(appt.scheduledStart).subtract(JOIN_EARLY_MINUTES, 'minutes');
  if (moment(now).isBefore(opensAt)) {
    return {
      canJoin: false,
      opensAt,
      joinLabel: `Join opens ${fmtDayLabel(appt.scheduledStart)} at ${fmtTime(opensAt)}`,
      isWalkIn: false,
    };
  }
  return { canJoin: true, opensAt, joinLabel: null, isWalkIn: false };
}

/**
 * Reactive variant. The bug this fixes: the old inline useMemo captured `now` at render
 * time and depended only on [appt, status], so a patient sitting on the screen while the
 * window opened kept looking at a greyed-out Join button until something else happened to
 * re-render (a focus change, a socket event, a manual pull-to-refresh).
 *
 * The interval only runs while there is a future opening to wait for — once the window is
 * open (or the appointment can never be joined) it is torn down, so this does not tick
 * needlessly for the whole life of the screen.
 */
export function useJoinWindow(appt) {
  const [now, setNow] = useState(() => Date.now());

  const window = useMemo(() => computeJoinWindow(appt, now), [appt, now]);

  // Re-evaluate only while waiting for the window to open.
  const waiting = !!window.opensAt && !window.canJoin;
  useEffect(() => {
    if (!waiting) return undefined;
    const msUntilOpen = window.opensAt.valueOf() - Date.now();
    // Tick every 15s normally, but land precisely on the opening instant when it is close,
    // so the button enables the moment it legitimately can rather than up to 15s later.
    const delay = msUntilOpen > 0 && msUntilOpen < 15000 ? msUntilOpen + 250 : 15000;
    const id = setTimeout(() => setNow(Date.now()), delay);
    return () => clearTimeout(id);
  }, [waiting, window.opensAt, now]);

  return window;
}
