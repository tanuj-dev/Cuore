import { computeJoinWindow } from '../joinWindow';
import { JOIN_EARLY_MINUTES } from '../../../utilities/cuoreCareConfig';

const MIN = 60 * 1000;
const NOW = new Date('2026-08-16T10:00:00Z').getTime();

/* `start` is expressed in minutes from NOW so each case reads as "starts in N minutes".
 *
 * The default fixture has the DOCTOR ALREADY IN THE ROOM (`joinedAt.doctor`), because a live
 * consultation cannot be joined by the patient until they are — see the "doctor opens the room"
 * block at the bottom. Every case above that one is about the CLOCK rule, so they hold the
 * doctor-presence input constant rather than re-testing it fifteen times. */
const appt = (startInMin, over = {}) => ({
  appointmentId: 'apt_1',
  mode: 'video',
  status: 'scheduled',
  scheduledStart: new Date(NOW + startInMin * MIN).toISOString(),
  scheduledEnd: new Date(NOW + (startInMin + 15) * MIN).toISOString(),
  joinedAt: { doctor: new Date(NOW - MIN).toISOString(), patient: null },
  ...over,
});

describe('computeJoinWindow', () => {
  it('opens exactly JOIN_EARLY_MINUTES before the start', () => {
    // One minute before the window opens -> still closed.
    expect(computeJoinWindow(appt(JOIN_EARLY_MINUTES + 1), NOW).canJoin).toBe(false);
    // Exactly at the opening instant -> open.
    expect(computeJoinWindow(appt(JOIN_EARLY_MINUTES), NOW).canJoin).toBe(true);
  });

  it('stays joinable after the start time (a late patient can still join)', () => {
    expect(computeJoinWindow(appt(-5), NOW).canJoin).toBe(true);
  });

  it('explains when the window opens instead of silently disabling', () => {
    const w = computeJoinWindow(appt(120), NOW);
    expect(w.canJoin).toBe(false);
    expect(w.joinLabel).toMatch(/Join opens/);
    expect(w.opensAt).toBeTruthy();
  });

  it('never offers a join for a walk-in — there is no room', () => {
    const w = computeJoinWindow(appt(0, { mode: 'in_person' }), NOW);
    expect(w.canJoin).toBe(false);
    expect(w.isWalkIn).toBe(true);
    // and no misleading "opens at" hint for something that never opens
    expect(w.joinLabel).toBeNull();
  });

  it.each(['scheduled', 'in_progress', 'accepted'])('allows joining from %s', status => {
    expect(computeJoinWindow(appt(0, { status }), NOW).canJoin).toBe(true);
  });

  it.each(['requested', 'completed', 'cancelled', 'missed', 'no_show_patient', 'no_show_doctor'])(
    'refuses to join from %s',
    status => {
      expect(computeJoinWindow(appt(0, { status }), NOW).canJoin).toBe(false);
    },
  );

  it('handles a missing appointment without throwing', () => {
    expect(computeJoinWindow(null, NOW).canJoin).toBe(false);
    expect(computeJoinWindow(undefined, NOW).canJoin).toBe(false);
  });

  /* ── THE DOCTOR OPENS THE ROOM ───────────────────────────────────────────────────────────
   *
   * A patient joining a live call used to ring the doctor wherever they were in the console. A
   * doctor running late is still inside the PREVIOUS consultation, so an early arrival rang
   * them mid-consultation. The room is now the doctor's to open; the patient is called in.
   * Mirrors the server's own refusal (assertJoinable → DOCTOR_NOT_JOINED). */
  describe('waiting for the doctor', () => {
    const noDoctor = over => appt(0, { joinedAt: { doctor: null, patient: null }, ...over });

    it.each(['video', 'voice'])('refuses a %s call until the doctor has joined', mode => {
      const w = computeJoinWindow(noDoctor({ mode }), NOW);
      expect(w.canJoin).toBe(false);
      expect(w.waitingForDoctor).toBe(true);
      expect(w.joinLabel).toMatch(/Waiting for your doctor/);
    });

    it('allows it the moment the doctor has joined', () => {
      const w = computeJoinWindow(appt(0, { mode: 'video' }), NOW);
      expect(w.canJoin).toBe(true);
      expect(w.waitingForDoctor).toBe(false);
    });

    it('never blocks a chat consultation — the patient writing first is how it starts', () => {
      const w = computeJoinWindow(noDoctor({ mode: 'chat' }), NOW);
      expect(w.canJoin).toBe(true);
      expect(w.waitingForDoctor).toBe(false);
    });

    it('still reads "join opens at" when the patient is simply early', () => {
      // Being an hour early is not the same as waiting on the doctor, and telling the patient
      // their doctor is late when the slot has not arrived would be alarming and untrue.
      const w = computeJoinWindow(noDoctor({ scheduledStart: new Date(NOW + 60 * MIN).toISOString() }), NOW);
      expect(w.canJoin).toBe(false);
      expect(w.waitingForDoctor).toBe(false);
      expect(w.joinLabel).toMatch(/Join opens/);
    });

    it('treats a missing joinedAt as "not started" rather than throwing', () => {
      const a = appt(0);
      delete a.joinedAt;
      expect(computeJoinWindow(a, NOW).canJoin).toBe(false);
    });

    it('stays joinable once opened, even if the doctor steps out', () => {
      // joinedAt.doctor is a one-way latch server-side: it records that the consultation was
      // opened, not that the doctor is on screen this second. A reload must not lock the
      // patient out of a call already under way.
      const w = computeJoinWindow(appt(-5, { status: 'in_progress' }), NOW);
      expect(w.canJoin).toBe(true);
    });
  });

  it('is a pure function of `now` — this is what fixes the stale-clock bug', () => {
    // The same appointment flips from not-joinable to joinable purely by time passing,
    // with no other input changing. The old inline useMemo depended on [appt, status] and
    // so could never observe this transition on its own.
    const a = appt(JOIN_EARLY_MINUTES + 10);
    expect(computeJoinWindow(a, NOW).canJoin).toBe(false);
    expect(computeJoinWindow(a, NOW + 11 * MIN).canJoin).toBe(true);
  });
});
