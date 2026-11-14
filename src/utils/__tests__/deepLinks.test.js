jest.mock('../../call/callManager', () => ({ handleIncomingCall: jest.fn() }));
jest.mock('../notificationNavigation', () => ({ navigateFromNotification: jest.fn() }));

const { parseDeepLink, handleDeepLinkUrl, onNavigationStateChange } = require('../deepLinks');
const { navigationRef } = require('../../navigation/navigationRef');
const { navigateFromNotification } = require('../notificationNavigation');

describe('parseDeepLink', () => {
  it.each([
    ['https://cuore.health/app/consultation/apt_123', { screen: 'AppointmentDetails', data: { appointmentId: 'apt_123' } }],
    ['https://www.cuore.health/app/consultation/apt_123?utm=wa', { screen: 'AppointmentDetails', data: { appointmentId: 'apt_123' } }],
    ['https://cuore.health/app/cuorecare/book', { screen: 'BookConsultation', data: {} }],
    ['cuore://consultation/apt_9', { screen: 'AppointmentDetails', data: { appointmentId: 'apt_9' } }],
    ['cuore://app/consultation/apt_9', { screen: 'AppointmentDetails', data: { appointmentId: 'apt_9' } }],
    ['cuore://cuorecare/book', { screen: 'BookConsultation', data: {} }],
  ])('%s', (url, expected) => {
    expect(parseDeepLink(url)).toEqual(expected);
  });

  it.each([
    'https://evil.example/app/consultation/1',
    'https://cuore.health/consultation/1',
    'https://cuore.health/app/consultation',
    'cuore://unknown',
    '',
    null,
  ])('rejects %s', url => {
    expect(parseDeepLink(url)).toBeNull();
  });
});

describe('queued until the user is on Home', () => {
  it('holds the link on Splash and opens it once the CuoreCare tab is mounted', () => {
    let state = { index: 0, routes: [{ name: 'Splash' }] };
    navigationRef.current = { isReady: () => true, getRootState: () => state };

    expect(handleDeepLinkUrl('https://cuore.health/app/consultation/apt_1')).toBe(true);
    expect(navigateFromNotification).not.toHaveBeenCalled();

    state = {
      index: 0,
      routes: [
        {
          name: 'Home',
          state: { routes: [{ name: 'Tabs', state: { routeNames: ['Today', 'CuoreCare'] } }] },
        },
      ],
    };
    onNavigationStateChange();
    expect(navigateFromNotification).toHaveBeenCalledWith(navigationRef, 'AppointmentDetails', {
      appointmentId: 'apt_1',
    });
  });
});
