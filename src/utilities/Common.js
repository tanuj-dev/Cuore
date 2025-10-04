import React, { useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
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
      return Promise.reject(error);
    },
  );
};
createInterceptors($http);

export default {
  showImagePickerOptions,
  requestCameraPermission,
  requestStoragePermission,
  axiosInstance: $http,
};
