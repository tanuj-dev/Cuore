import moment from 'moment';

/**
 * True when `endDate` falls on the user's local calendar day (same year, month, date).
 *
 * `startDate` is optional but should be passed whenever it is available. A billing
 * period shorter than a day is never a real renewal window — it means the store is
 * running an accelerated/test period (Apple sandbox compresses 1 month to 5 minutes,
 * Play test subscriptions do the same), so the "ending today" nag is suppressed for it.
 *
 * @param {string|number|Date|null|undefined} endDate - ISO string or parseable date
 * @param {string|number|Date|null|undefined} [startDate] - period start, when known
 */
export function isPaymentEndDateToday(endDate, startDate) {
  if (endDate == null || endDate === '') return false;
  const end = moment(endDate);
  if (!end.isValid()) return false;
  if (!end.isSame(moment(), 'day')) return false;

  if (startDate != null && startDate !== '') {
    const start = moment(startDate);
    if (start.isValid() && end.diff(start, 'hours', true) < 24) return false;
  }
  return true;
}

/** Checkout lives on the root stack; tab screens are nested two levels deep. */
export function navigateToCheckoutFromTabs(navigation) {
  const tabNav = navigation?.getParent?.();
  const rootNav = tabNav?.getParent?.();
  if (rootNav?.navigate) {
    rootNav.navigate('Checkout');
  } else if (tabNav?.navigate) {
    tabNav.navigate('Checkout');
  } else {
    navigation.navigate('Checkout');
  }
}
