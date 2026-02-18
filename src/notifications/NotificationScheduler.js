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
      data: {
        screen: 'Today', // Navigate to Today screen on press
      },
      android: {
        channelId: 'health-schedule',
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
        },
        sound: 'doorbell', // Notifee default notification sound on Android
      },
      ios: {
        categoryId: 'default',
        sound: 'default',
      },
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
      data: {
        screen: 'Today', // Navigate to Today screen on press
      },
      android: {
        channelId: 'health-schedule',
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
        },
        sound: 'doorbell', // Notifee default notification sound on Android
      },
      ios: {
        categoryId: 'default',
        sound: 'default',
      },
    },
    trigger,
  );

  console.log(`⏰ Scheduled "${title}" for ${seconds} seconds from now`);
}

export async function showImmediateNotification(title, body) {
  await notifee.displayNotification({
    title,
    body,
    data: {
      screen: 'Today', // Navigate to Today screen on press
    },
    android: {
      channelId: 'health-schedule',
      pressAction: {
        id: 'default',
      },
      sound: 'doorbell', // Notifee default notification sound on Android
    },
    ios: {
      categoryId: 'default',
      sound: 'default',
    },
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

export async function scheduleNotificationAtTime(
  id,
  title,
  body,
  hour,
  minute,
) {
  // Create a date for today at the given time
  const now = new Date();
  const date = new Date();

  console.log(now, 'and', date);

  date.setHours(hour);
  date.setMinutes(minute);
  date.setSeconds(0);
  date.setMilliseconds(0);

  // If the chosen time already passed, schedule for tomorrow
  if (date <= now) {
    date.setDate(date.getDate() + 1);
    console.log('Time passed, scheduling for tomorrow');
  }

  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: date.getTime(),
  };

  await notifee.createTriggerNotification(
    {
      id,
      title,
      body,
      data: {
        screen: 'Today', // Navigate to Today screen on press
      },
      android: {
        channelId: 'health-schedule',
        smallIcon: 'ic_launcher', // make sure this icon exists in android/app/src/main/res/
        pressAction: {
          id: 'default',
        },
        sound: 'doorbell', // Notifee default notification sound on Android
      },
      ios: {
        categoryId: 'default',
        sound: 'default',
      },
    },
    trigger,
  );

  console.log(`⏰ Scheduled "${title}" for ${date.toLocaleTimeString()}`);
}
