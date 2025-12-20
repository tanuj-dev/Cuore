import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import store from './src/redux/store';
import Navigator from './src/navigation';
import { initializeNotifee } from './src/notifications/NotificationService';

const App = () => {
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      console.log('[Store Changed]', store.getState());
    });

    // Initialize Notifee for notifications
    initializeNotifee();

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.appContainer}>
      <Provider store={store}>
        <Navigator />
      </Provider>
    </View>
  );
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default App;
