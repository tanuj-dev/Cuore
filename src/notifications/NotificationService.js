// src/notifications/notifeeSetup.js
import notifee, { AuthorizationStatus } from '@notifee/react-native';

export async function initializeNotifee() {
  // Ask for permission
  const settings = await notifee.requestPermission();

  if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
    console.log('✅ Notification permissions granted');
  } else {
    console.log('🚫 Notification permissions denied');
  }

  // Create notification channel
  await notifee.createChannel({
    id: 'health-schedule',
    name: 'Health Schedule Notifications',
    importance: 4,
  });

  console.log('📢 Notification channel ready');
}
