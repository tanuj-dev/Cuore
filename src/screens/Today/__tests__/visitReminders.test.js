import { isVisitReminder, visitRemindersFrom } from '../visitReminders';

/**
 * Which pending doctor reminders get pinned to the top of Today.
 *
 * "Follow-up & next visit reminders should come on top and stay till either accepted or
 * declined." Only those two — a medicine reminder belongs in the day's schedule at its dose
 * time, and pinning three medicines would bury the day it is supposed to sit above.
 *
 * Getting this wrong is quiet in both directions: pin too much and the screen fills with
 * cards, pin too little and a follow-up the doctor asked for is invisible until the morning it
 * is due, which is the one day too late to arrange anything.
 */

const followUp = over => ({
  _id: 'r1',
  title: 'Follow-up with Dr. Saroop',
  visitKind: 'follow_up',
  startDate: '2026-10-01T04:00:00.000Z',
  ...over,
});

describe('what counts as a visit reminder', () => {
  it('a follow-up does', () => {
    expect(isVisitReminder(followUp())).toBe(true);
  });

  it('a next visit does', () => {
    expect(isVisitReminder(followUp({ visitKind: 'next_visit', title: 'Next visit with Dr. X' }))).toBe(true);
  });

  it('a medicine does NOT — it belongs in the day at its dose time', () => {
    expect(isVisitReminder({ _id: 'm1', title: 'Pantoprazole 40 mg', dosage: '1 tablet · OD' })).toBe(false);
  });

  it('a vaccine does not either', () => {
    expect(isVisitReminder({ _id: 'v1', title: 'Tdap — due' })).toBe(false);
  });

  it('nothing in, nothing out', () => {
    expect(isVisitReminder(null)).toBe(false);
    expect(isVisitReminder(undefined)).toBe(false);
    expect(isVisitReminder({})).toBe(false);
  });
});

describe('reminders written before visitKind existed', () => {
  // The field was added precisely so this guesswork is the fallback and not the rule — but
  // every reminder already in the database predates it, and those patients are waiting on
  // follow-ups right now.
  it('is recognised by its title', () => {
    expect(isVisitReminder({ _id: 'old1', title: 'Follow-up with Dr. Saroop' })).toBe(true);
    expect(isVisitReminder({ _id: 'old2', title: 'Followup with Dr. Saroop' })).toBe(true);
    expect(isVisitReminder({ _id: 'old3', title: 'Next visit with Dr. Saroop' })).toBe(true);
  });

  it('does not drag in a medicine whose name happens to contain the word', () => {
    // "Follow" only counts at the START of the title, which is where the generated ones put it.
    expect(isVisitReminder({ _id: 'm2', title: 'Tab Follitrope 75 IU' })).toBe(false);
  });

  it('an explicit visitKind always wins over the title', () => {
    expect(isVisitReminder({ _id: 'x', title: 'Review appointment', visitKind: 'follow_up' })).toBe(true);
  });
});

describe('the pinned list', () => {
  const soon = followUp({ _id: 'soon', startDate: '2026-09-25T04:00:00.000Z' });
  const later = followUp({ _id: 'later', startDate: '2026-12-01T04:00:00.000Z' });
  const medicine = { _id: 'med', title: 'Amlodipine 5 mg' };

  it('keeps only the visits, soonest first', () => {
    expect(visitRemindersFrom([later, medicine, soon]).map(r => r._id)).toEqual(['soon', 'later']);
  });

  it('does not mutate what it was given', () => {
    const input = [later, soon];
    visitRemindersFrom(input);
    expect(input.map(r => r._id)).toEqual(['later', 'soon']);
  });

  it('a reminder with no date sorts first rather than disappearing', () => {
    const undated = followUp({ _id: 'undated', startDate: null });
    expect(visitRemindersFrom([soon, undated]).map(r => r._id)).toEqual(['undated', 'soon']);
  });

  it('survives a list that has not loaded', () => {
    expect(visitRemindersFrom(undefined)).toEqual([]);
    expect(visitRemindersFrom(null)).toEqual([]);
  });
});
