/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// ── FCM Background / Quit-state handler ───────────────────────
// MUST be registered before AppRegistry.registerComponent
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📨 FCM Background Message:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
