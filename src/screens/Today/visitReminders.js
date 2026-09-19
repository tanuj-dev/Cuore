import moment from 'moment';

/**
 * Which pending doctor reminders are VISITS — the ones pinned to the top of Today.
 *
 * Pure, and separate from the card component, for the same reason cancelWindow.js and
 * documentOwner.js are: the rule decides whether a patient ever sees a follow-up their doctor
 * asked for, and it is worth testing without standing up React Native around it.
 */

/** A visit reminder, as opposed to a medicine or vaccine one. */
export function isVisitReminder(reminder) {
  if (!reminder) return false;
  if (reminder.visitKind) return true;
  /* Reminders written before `visitKind` existed have to be recognised by their title, which is
   * exactly why the field was added — this is the fallback, not the rule. `isMedication` is not
   * part of the pending payload, so the title is all there is for those rows. */
  return /^(follow-?up|next visit)/i.test(String(reminder.title || ''));
}

/** Pending visit reminders only, soonest first. */
export function visitRemindersFrom(reminders) {
  return (Array.isArray(reminders) ? reminders : [])
    .filter(isVisitReminder)
    .slice()
    .sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));
}

/** "in 3 weeks" / "tomorrow" / "2 days ago" — the doctor's date in the patient's words. */
export function whenLabel(date) {
  if (!date) return '';
  const m = moment(date);
  if (!m.isValid()) return '';
  return m.calendar(null, {
    sameDay: '[today]',
    nextDay: '[tomorrow]',
    nextWeek: 'dddd',
    lastDay: '[yesterday]',
    lastWeek: '[last] dddd',
    sameElse: 'D MMM YYYY',
  });
}
