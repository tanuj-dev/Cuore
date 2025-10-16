// src/notifications/scheduleHelpers.js
import notifee, { TriggerType } from '@notifee/react-native';

export async function scheduleNotificationAfterMinutes(
  id,
  title,
  body,
  minutes,
) {
  const date = new Date(Date.now() + minutes * 60 * 1000);
  const trigger = { type: TriggerType.TIMESTAMP, timestamp: date.getTime() };

  await notifee.createTriggerNotification(
    {
      id,
      title,
      body,
      android: { channelId: 'health-schedule', smallIcon: 'ic_launcher' },
    },
    trigger,
  );

  console.log(`⏰ Scheduled "${title}" for ${minutes} minutes from now`);
}

export async function scheduleNotificationAfterSeconds(
  id,
  title,
  body,
  seconds,
) {
  const date = new Date(Date.now() + seconds * 1000);
  const trigger = { type: TriggerType.TIMESTAMP, timestamp: date.getTime() };

  await notifee.createTriggerNotification(
    {
      id,
      title,
      body,
      android: { channelId: 'health-schedule', smallIcon: 'ic_launcher' },
    },
    trigger,
  );

  console.log(`⏰ Scheduled "${title}" for ${seconds} seconds from now`);
}

export async function showImmediateNotification(title, body) {
  await notifee.displayNotification({
    title,
    body,
    android: { channelId: 'health-schedule' },
  });
}

export async function cancelAllNotifications() {
  await notifee.cancelAllNotifications();
  console.log('🧹 All notifications cancelled');
}

export async function scheduleAll() {
  console.log('📅 Scheduling all health reminders...');
  const reminders = [
    ['wake', 'Wake Up', 'Start your day with Morning Harmony 🌅'],
    ['breakfast', 'Breakfast', 'Healthy smoothie with oats and banana 🥣'],
    ['fitness', 'Fitness', 'Time for Cardio & Strength Training 💪'],
    ['lunch', 'Lunch', 'Re-energize yourself 🍱'],
    ['nap', 'Short Nap', 'Defeat the midday slump 😴'],
    ['dinner', 'Dinner', 'Balanced and light dinner 🌙'],
    ['sleep', 'Sleep', 'Restore & repair your body 🛌'],
  ];

  for (const [id, title, body] of reminders) {
    await scheduleNotificationAfterMinutes(id, title, body, 2); // ⏱ test mode (2 mins)
  }
}
