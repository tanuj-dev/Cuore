import Common from './Common';
import EndPoints from './Endpoints';
import notifee, { TriggerType } from '@notifee/react-native';
import dailyRoutines from './Common';
import { Platform } from 'react-native';

import EncryptedStorage from 'react-native-encrypted-storage';

async function setupHeaders(isPost = true, endPoint = '') {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  };

  if (isPost) {
    headers['Accept'] = 'application/json, text/html, */*';
  }

  try {
    const tokenData = await EncryptedStorage.getItem('auth_tokens');

    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      const access_token = parsed.accessToken;
      headers['Authorization'] = `Bearer ${access_token}`;
    }
  } catch (error) {
    console.warn('⚠️ Failed to get token from storage:', error);
  }

  return headers;
}

// 🔸 POST API
export async function postApiCall(endPoint, params) {
  try {
    const headers = await setupHeaders(true, endPoint);
    const response = await Common.axiosInstance.post(endPoint, params, {
      headers,
    });
    return response;
  } catch (error) {
    console.log('POST API ERROR:', error);
    return error.response;
  }
}

// 🔸 GET API
export async function getApiCall(endPoint, paramsData = '') {
  try {
    const headers = await setupHeaders(false, endPoint);
    const response = await Common.axiosInstance.get(endPoint + paramsData, {
      headers,
    });
    return response;
  } catch (error) {
    console.log('GET API ERROR:', error);
    return error.response;
  }
}

// 🔸 PUT API (for profile update, etc.)
export async function putApiCall(endPoint, params) {
  try {
    const headers = await setupHeaders(true, endPoint);
    const response = await Common.axiosInstance.put(endPoint, params, {
      headers,
    });
    return response;
  } catch (error) {
    console.log('PUT API ERROR:', error);
    return error.response;
  }
}

// 🔸 DELETE API

export async function deleteApiCall(endPoint) {
  try {
    const headers = await setupHeaders(true, endPoint);
    const response = await Common.axiosInstance.delete(endPoint, {
      headers,
    });
    return response;
  } catch (error) {
    console.log('DELETE API ERROR:', error);
    return error.response;
  }
}
