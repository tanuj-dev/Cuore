import React, {useState} from 'react';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

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
    {cancelable: true},
  );
};

export default {
  showImagePickerOptions,
  requestCameraPermission,
  requestStoragePermission,
};
