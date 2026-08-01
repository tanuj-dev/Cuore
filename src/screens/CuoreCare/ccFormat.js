import moment from 'moment';

/** "3:30 PM" */
export const fmtTime = iso => (iso ? moment(iso).format('h:mm A') : '');

/** "Today" · "Tomorrow" · "Wed, 6 Aug" */
export const fmtDayLabel = iso => {
  if (!iso) return '';
  const m = moment(iso);
  if (m.isSame(moment(), 'day')) return 'Today';
  if (m.isSame(moment().add(1, 'day'), 'day')) return 'Tomorrow';
  return m.format('ddd, D MMM');
};

/** "Wed, 6 Aug · 3:30 PM" */
export const fmtDateTime = iso =>
  iso ? `${fmtDayLabel(iso)} · ${fmtTime(iso)}` : '';

/** "3:30 – 3:45 PM" */
export const fmtRange = (startIso, endIso) => {
  if (!startIso) return '';
  const s = moment(startIso);
  const e = endIso ? moment(endIso) : null;
  const sameMeridiem = e && s.format('A') === e.format('A');
  const startStr = sameMeridiem ? s.format('h:mm') : s.format('h:mm A');
  return e ? `${startStr} – ${e.format('h:mm A')}` : s.format('h:mm A');
};

/** "in 2 hours" / "3 days ago" */
export const fmtRelative = iso => (iso ? moment(iso).fromNow() : '');

/** mm:ss elapsed timer from a start instant. */
export const fmtElapsed = seconds => {
  const s = Math.max(0, Math.floor(seconds || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

export default { fmtTime, fmtDayLabel, fmtDateTime, fmtRange, fmtRelative, fmtElapsed };
