import moment from 'moment';

/**
 * True when `endDate` falls on the user's local calendar day (same year, month, date).
 * @param {string|number|Date|null|undefined} endDate - ISO string or parseable date
 */
export function isPaymentEndDateToday(endDate) {
  if (endDate == null || endDate === '') return false;
  const end = moment(endDate);
  if (!end.isValid()) return false;
  return end.isSame(moment(), 'day');
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
