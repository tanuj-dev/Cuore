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

/* Modes where the DOCTOR opens the room and the patient is called in.
 *
 * A patient entering a live call before the doctor used to ring the doctor's console, which
 * interrupted whatever consultation they were still in — so the server now refuses it
 * (controllers/cuorecare/appointment.controller.js assertJoinable, code DOCTOR_NOT_JOINED).
 * This mirrors that refusal so the patient sees "waiting for your doctor" instead of tapping a
 * button that fails.
 *
 * Chat is absent from this list on purpose: a chat consultation is asynchronous and the patient
 * writing first is how it normally begins. The server exempts it for the same reason. */
const DOCTOR_OPENS_MODES = ['video', 'voice'];

/**
 * Pure computation — `now` is injected so this is testable and so the hook below can drive
 * it from a ticking clock.
 */
export function computeJoinWindow(appt, now = Date.now()) {
  // A walk-in has no room to join: the doctor documents it from their own EMR queue.
  if (!appt || appt.mode === 'in_person' || !JOINABLE_STATES.includes(appt.status)) {
    return {
      canJoin: false,
      opensAt: null,
      joinLabel: null,
      isWalkIn: appt?.mode === 'in_person',
      waitingForDoctor: false,
    };
  }

  const opensAt = moment(appt.scheduledStart).subtract(JOIN_EARLY_MINUTES, 'minutes');
  if (moment(now).isBefore(opensAt)) {
    return {
      canJoin: false,
      opensAt,
      joinLabel: `Join opens ${fmtDayLabel(appt.scheduledStart)} at ${fmtTime(opensAt)}`,
      isWalkIn: false,
      waitingForDoctor: false,
    };
  }

  /* The room is open by the clock, but a live consultation is the doctor's to start. Tested
     AFTER the clock so a patient who is simply early still reads "join opens at…", which tells
     them when to come back; "waiting for your doctor" an hour ahead of the slot would be
     alarming and untrue. `joinedAt.doctor` is never cleared server-side, so this stops reporting
     a wait the moment the consultation has been opened, not only while the doctor is on screen. */
  if (DOCTOR_OPENS_MODES.includes(appt.mode) && !appt?.joinedAt?.doctor) {
    return {
      canJoin: false,
      opensAt,
      joinLabel: "Waiting for your doctor to start — you'll be called when they do",
      isWalkIn: false,
      waitingForDoctor: true,
    };
  }

  return { canJoin: true, opensAt, joinLabel: null, isWalkIn: false, waitingForDoctor: false };
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

  /* Re-evaluate only while waiting for the CLOCK. Waiting for the doctor is deliberately not a
     reason to tick: no amount of elapsed time changes `joinedAt.doctor` — that arrives with a
     refetch driven by the appointment socket event — so a timer here would spin for the whole
     life of the screen and never change the answer. */
  const waiting = !!window.opensAt && !window.canJoin && !window.waitingForDoctor;
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
