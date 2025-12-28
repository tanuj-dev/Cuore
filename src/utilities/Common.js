import React, { useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import Constants from './Constants';

const requestCameraPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'App needs access to your camera',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};
const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to your storage',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};
const showImagePickerOptions = () => {
  Alert.alert(
    'Select Image',
    'Choose an option',
    [
      {
        text: 'Take Photo',
        onPress: () => handleImagePicker('camera'),
      },
      {
        text: 'Choose from Gallery',
        onPress: () => handleImagePicker('gallery'),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ],
    { cancelable: true },
  );
};

const $http = axios.create({
  baseURL: Constants.BASEURL,
  timeout: 18000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store reference to session expired callback
let sessionExpiredCallback = null;

const setSessionExpiredCallback = callback => {
  sessionExpiredCallback = callback;
};

const createInterceptors = instan => {
  instan.interceptors.request.use(
    request => {
      console.log(
        'INTERCEPTOR REQUEST:',
        request.baseURL + request.url,
        request,
      );
      return request;
    },
    error => {
      console.log('INTERCEPTOR REQUEST ERROR:', error);
      return Promise.reject(error);
    },
  );

  instan.interceptors.response.use(
    response => {
      console.log(
        'INTERCEPTOR RESPONSE:',
        response.config.baseURL + response.config.url,
        response,
      );
      return response;
    },
    error => {
      console.log('INTERCEPTOR RESPONSE ERROR:', error);

      // Check for 401 Unauthorized or token expired errors
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || '';

        // Check for 401 or token expired messages
        if (
          status === 401 ||
          message.toLowerCase().includes('expired') ||
          message.toLowerCase().includes('invalid token') ||
          message.toLowerCase().includes('not authorized')
        ) {
          console.log('Session expired detected:', status, message);
          // Trigger session expired callback if set
          if (sessionExpiredCallback) {
            sessionExpiredCallback();
          }
        }
      }

      return Promise.reject(error);
    },
  );
};
createInterceptors($http);

const dailyRoutines = [
  {
    hour: 5,
    minute: 25,
    title: 'Wake Up',
    body: 'Start your day with Morning Harmony',
  },
  {
    hour: 7,
    minute: 10,
    title: 'Breakfast',
    body: 'Healthy smoothie with oats and banana',
  },
  { hour: 8, minute: 25, title: 'Fitness', body: 'Cardio & strength training' },
  { hour: 12, minute: 25, title: 'Lunch', body: 'Re-energize yourself' },
  { hour: 13, minute: 55, title: 'Nap/Walk', body: 'Defeat the midday slump' },
  { hour: 18, minute: 25, title: 'Dinner', body: 'Balanced and light' },
  { hour: 21, minute: 25, title: 'Sleep', body: 'Restore & repair' },
];
// const handleLoginRedirect = () => {
//   Navigation.navigate('Login');
// };

/**
 * Network connectivity utilities
 */

/**
 * Check if device is currently connected to the internet
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
const checkNetworkConnection = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch (error) {
    console.warn('Error checking network connection:', error);
    return false;
  }
};

/**
 * Get detailed network state information
 * @returns {Promise<NetInfoState>} Network state object
 */
const getNetworkState = async () => {
  try {
    return await NetInfo.fetch();
  } catch (error) {
    console.warn('Error getting network state:', error);
    return null;
  }
};

/**
 * Subscribe to network state changes
 * @param {Function} callback - Callback function that receives network state
 * @returns {Function} Unsubscribe function
 */
const subscribeToNetworkChanges = callback => {
  if (typeof callback !== 'function') {
    console.warn('subscribeToNetworkChanges: callback must be a function');
    return () => {};
  }

  return NetInfo.addEventListener(callback);
};

/**
 * Check if device has internet connectivity (not just network connection)
 * This performs an actual network request to verify internet access
 * @param {number} timeout - Timeout in milliseconds (default: 3000)
 * @returns {Promise<boolean>} True if internet is accessible, false otherwise
 */
const checkInternetConnectivity = async (timeout = 3000) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    // Any successful response means we have internet connectivity
    return response && (response.ok || response.status < 500);
  } catch (error) {
    // Network error or timeout means no internet
    return false;
  }
};

export default {
  showImagePickerOptions,
  requestCameraPermission,
  requestStoragePermission,

  axiosInstance: $http,
  dailyRoutines,

  // Network utilities
  checkNetworkConnection,
  getNetworkState,
  subscribeToNetworkChanges,
  checkInternetConnectivity,

  // Session management
  setSessionExpiredCallback,
};
