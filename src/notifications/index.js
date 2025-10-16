import React, { useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Button,
  ScrollView,
  StyleSheet,
} from 'react-native';
import notifee, {
  AuthorizationStatus,
  TriggerType,
} from '@notifee/react-native';

export default function App() {
  // 🔹 Ask for permission + create channel when app loads
  useEffect(() => {
    requestUserPermission();
    createChannel();
  }, []);

  // 🔹 Request permission for notifications
  async function requestUserPermission() {
    const settings = await notifee.requestPermission();

    if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
      console.log('✅ Notification permissions granted');
    } else {
      console.log('🚫 User denied notification permissions');
    }
  }

  // 🔹 Create Android channel (required)
  async function createChannel() {
    await notifee.createChannel({
      id: 'health-schedule',
      name: 'Health Schedule Notifications',
      importance: 4,
    });
  }

  // 🔹 Generic scheduler (after N minutes)
  async function scheduleNotificationAfterMinutes(id, title, body, minutes) {
    const date = new Date(Date.now() + minutes * 60 * 1000);

    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
    };

    await notifee.createTriggerNotification(
      {
        id,
        title,
        body,
        android: {
          channelId: 'health-schedule',
          smallIcon: 'ic_launcher',
        },
      },
      trigger,
    );

    console.log(`⏰ Scheduled "${title}" for ${minutes} minutes from now`);
  }

  // 🔹 NEW: Generic scheduler (after N seconds)
  async function scheduleNotificationAfterSeconds(id, title, body, seconds) {
    const date = new Date(Date.now() + seconds * 1000);

    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
    };

    await notifee.createTriggerNotification(
      {
        id,
        title,
        body,
        android: {
          channelId: 'health-schedule',
          smallIcon: 'ic_launcher',
        },
      },
      trigger,
    );

    console.log(`⏰ Scheduled "${title}" for ${seconds} seconds from now`);
  }

  // 🔹 Cancel all notifications
  async function cancelAllNotifications() {
    await notifee.cancelAllNotifications();
    console.log('🧹 All notifications cancelled');
  }

  // 🔹 Show one immediate notification (instant test)
  const showImmediateNotification = async () => {
    await notifee.displayNotification({
      title: 'Immediate Notification ⚡️',
      body: 'This appears instantly!',
      android: {
        channelId: 'health-schedule',
      },
    });
  };

  // 🔹 Schedule all reminders (2 min later, test mode)
  const scheduleAll = async () => {
    console.log('Scheduling all test notifications (2 mins from now)...');

    await scheduleNotificationAfterMinutes(
      'wake',
      'Wake Up',
      'Start your day with Morning Harmony 🌅',
      2,
    );
    await scheduleNotificationAfterMinutes(
      'breakfast',
      'Breakfast',
      'Healthy smoothie with oats and banana 🥣',
      2,
    );
    await scheduleNotificationAfterMinutes(
      'fitness',
      'Fitness',
      'Time for Cardio & Strength Training 💪',
      2,
    );
    await scheduleNotificationAfterMinutes(
      'lunch',
      'Lunch',
      'Re-energize yourself 🍱',
      2,
    );
    await scheduleNotificationAfterMinutes(
      'nap',
      'Short Nap',
      'Defeat the midday slump 😴',
      2,
    );
    await scheduleNotificationAfterMinutes(
      'dinner',
      'Dinner',
      'Balanced and light dinner 🌙',
      2,
    );
    await scheduleNotificationAfterMinutes(
      'sleep',
      'Sleep',
      'Restore & repair your body 🛌',
      2,
    );
  };

  // 🔹 Schedule single 5-second test
  const schedule5SecTest = async () => {
    console.log('Scheduling single test notification in 5 seconds...');
    await scheduleNotificationAfterSeconds(
      'test',
      '🔥 5-Second Test',
      'This notification will appear after 5 seconds!',
      5,
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>🩺 Smart Health Notifications</Text>

        <View style={styles.buttonContainer}>
          <Button
            title="🔥 5-Second Test Notification"
            onPress={schedule5SecTest}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button title="🔔 Schedule All (2 min later)" onPress={scheduleAll} />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="⚡ Immediate Notification"
            onPress={showImmediateNotification}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="🧹 Cancel All Notifications"
            color="red"
            onPress={cancelAllNotifications}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#f8f9fa' },
//   content: { padding: 20, alignItems: 'center' },
//   header: { fontSize: 22, fontWeight: '700', marginBottom: 20, color: '#333' },
//   buttonContainer: { width: '100%', marginVertical: 10 },
// });


// src/screens/ExploreScreen.js
import React from 'react';
import { View, Button, StyleSheet, Text } from 'react-native';
import { scheduleAll, cancelAllNotifications } from '../notifications/scheduleHelpers';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>🌍 Explore Screen</Text>
      <Button title="📅 Schedule All Reminders" onPress={scheduleAll} />
      <Button title="🧹 Cancel All Notifications" color="red" onPress={cancelAllNotifications} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
});

// src/screens/TodayScreen.js
import React from 'react';
import { View, Button, StyleSheet, Text } from 'react-native';
import {
  scheduleNotificationAfterSeconds,
  showImmediateNotification,
} from '../notifications/scheduleHelpers';

export default function TodayScreen() {
  const handleTest = async () => {
    await scheduleNotificationAfterSeconds(
      'todayTest',
      '🔥 Today Reminder',
      'This notification appears in 5 seconds!',
      5
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🩺 Today Screen</Text>
      <Button title="🔥 5-sec Test Notification" onPress={handleTest} />
      <Button
        title="⚡ Immediate Notification"
        onPress={() =>
          showImmediateNotification(
            'Instant Alert',
            'This one appears right away!'
          )
        }
      />
    </View>
  );
}

// // const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
//   header: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
// });

