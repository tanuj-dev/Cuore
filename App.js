import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import store from './src/redux/store';
import Navigator from './src/navigation';
import { initializeNotifee } from './src/notifications/NotificationService';
import NetworkError from './src/components/NetworkError';
import SessionExpiredModal from './src/components/SessionExpired';
import ReduxDebugger from './src/components/ReduxDebugger';
import { Common } from './src/utilities';
import { setSessionExpired, logout } from './src/redux/Auth/slice';
import EncryptedStorage from 'react-native-encrypted-storage';

// Navigation ref to access navigation from outside components
export const navigationRef = React.createRef();

// Inner component that has access to Redux
const AppContent = () => {
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(true);
  const sessionExpired = useSelector(state => state.auth?.sessionExpired);

  // Log entire Redux store state
  useEffect(() => {
    console.log('=== REDUX STORE STATE ===');
    console.log(JSON.stringify(store.getState(), null, 2));
    console.log('========================');
  }, []);

  // Log store changes on every update (useful for debugging)
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      console.log('Store Updated:', store.getState());
    });
    return () => unsubscribe();
  }, []);

  const checkConnectivity = useCallback(async () => {
    try {
      // Use network utility to check connection
      const connected = await Common.checkNetworkConnection();
      setIsConnected(connected);
    } catch (error) {
      console.warn('Error checking connectivity:', error);
      setIsConnected(false);
    }
  }, []);

  const handleSessionExpired = useCallback(async () => {
    console.log('Session expired - clearing tokens and navigating to login');
    // Clear tokens
    try {
      await EncryptedStorage.removeItem('auth_tokens');
    } catch (error) {
      console.warn('Error clearing tokens:', error);
    }

    // Dispatch logout to clear Redux state
    dispatch(logout());
    dispatch(setSessionExpired(false));

    // Navigate to Login using navigation ref
    if (navigationRef.current) {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [dispatch]);

  useEffect(() => {
    // Set up session expired callback for axios interceptor
    Common.setSessionExpiredCallback(() => {
      dispatch(setSessionExpired(true));
    });

    // Initialize Notifee for notifications
    initializeNotifee();

    // Check initial connectivity
    checkConnectivity();

    // Subscribe to network state changes for real-time updates
    const unsubscribeNetInfo = Common.subscribeToNetworkChanges(state => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => {
      unsubscribeNetInfo();
    };
  }, [checkConnectivity, dispatch]);

  const handleRetry = useCallback(async () => {
    await checkConnectivity();
  }, [checkConnectivity]);

  return (
    <View style={styles.appContainer}>
      <NavigationContainer ref={navigationRef}>
        <Navigator />
      </NavigationContainer>
      {!isConnected && <NetworkError onRetry={handleRetry} />}
      <SessionExpiredModal
        visible={sessionExpired}
        onLogin={handleSessionExpired}
      />
      {/* Redux Store Debugger - Remove in production */}
      {/* {__DEV__ && <ReduxDebugger />} */}
    </View>
  );
};

const App = () => {
  return (
    <View style={styles.appContainer}>
      <Provider store={store}>
        <AppContent />
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
