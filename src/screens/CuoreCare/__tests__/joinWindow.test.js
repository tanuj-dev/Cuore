import { computeJoinWindow } from '../joinWindow';
import { JOIN_EARLY_MINUTES } from '../../../utilities/cuoreCareConfig';

const MIN = 60 * 1000;
const NOW = new Date('2026-08-16T10:00:00Z').getTime();

// `start` is expressed in minutes from NOW so each case reads as "starts in N minutes".
const appt = (startInMin, over = {}) => ({
  appointmentId: 'apt_1',
  mode: 'video',
  status: 'scheduled',
  scheduledStart: new Date(NOW + startInMin * MIN).toISOString(),
  scheduledEnd: new Date(NOW + (startInMin + 15) * MIN).toISOString(),
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

  it('is a pure function of `now` — this is what fixes the stale-clock bug', () => {
    // The same appointment flips from not-joinable to joinable purely by time passing,
    // with no other input changing. The old inline useMemo depended on [appt, status] and
    // so could never observe this transition on its own.
    const a = appt(JOIN_EARLY_MINUTES + 10);
    expect(computeJoinWindow(a, NOW).canJoin).toBe(false);
    expect(computeJoinWindow(a, NOW + 11 * MIN).canJoin).toBe(true);
  });
});
