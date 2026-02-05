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
    
    // Check if params is FormData (React Native FormData has _parts property)
    const isFormData = params && typeof params === 'object' && params._parts;
    
    console.log('🔸 POST API Call:', endPoint);
    console.log('🔸 Params type:', typeof params);
    console.log('🔸 Is FormData:', isFormData);
    
    if (isFormData) {
      // Use fetch API for FormData in React Native (axios has issues)
      console.log('🔸 ✅ Using fetch API for FormData upload');
      
      const fullUrl = `${Common.axiosInstance.defaults.baseURL}${endPoint}`;
      console.log('🔸 Full URL:', fullUrl);
      
      // Don't set Content-Type for FormData - fetch will set it with boundary
      const fetchHeaders = {
        ...headers
      };
      delete fetchHeaders['Content-Type'];
      
      console.log('🔸 Fetch headers:', fetchHeaders);
      
      const fetchResponse = await fetch(fullUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: params,
      });
      
      console.log('🔸 Fetch response status:', fetchResponse.status);
      console.log('🔸 Fetch response headers:', fetchResponse.headers);
      
      // Get response text first
      const responseText = await fetchResponse.text();
      console.log('🔸 Response text (first 500 chars):', responseText.substring(0, 500));
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.log('🔸 ⚠️ Response is not JSON, likely HTML error page');
        responseData = {
          error: 'Server returned non-JSON response',
          statusCode: fetchResponse.status,
          message: responseText.substring(0, 200), // First 200 chars of error
        };
      }
      
      // Return in axios response format
      return {
        status: fetchResponse.status,
        data: responseData,
        headers: fetchResponse.headers,
      };
    } else {
      console.log('🔸 Using axios for JSON data');
      const config = { headers };
      const response = await Common.axiosInstance.post(endPoint, params, config);
      return response;
    }
  } catch (error) {
    console.log('POST API ERROR:', error);
    console.log('POST API ERROR details:', error.message);
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
    
    // Check if params is FormData (React Native FormData has _parts property)
    const isFormData = params && typeof params === 'object' && params._parts;
    
    console.log('🔸 PUT API Call:', endPoint);
    console.log('🔸 Params type:', typeof params);
    console.log('🔸 Is FormData:', isFormData);
    
    if (isFormData) {
      // Use fetch API for FormData in React Native (axios has issues)
      console.log('🔸 ✅ Using fetch API for FormData upload');
      
      const fullUrl = `${Common.axiosInstance.defaults.baseURL}${endPoint}`;
      console.log('🔸 Full URL:', fullUrl);
      
      // Don't set Content-Type for FormData - fetch will set it with boundary
      const fetchHeaders = {
        ...headers
      };
      delete fetchHeaders['Content-Type'];
      
      console.log('🔸 Fetch headers:', fetchHeaders);
      
      const fetchResponse = await fetch(fullUrl, {
        method: 'PUT',
        headers: fetchHeaders,
        body: params,
      });
      
      console.log('🔸 Fetch response status:', fetchResponse.status);
      
      // Get response text first
      const responseText = await fetchResponse.text();
      console.log('🔸 Response text (first 500 chars):', responseText.substring(0, 500));
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.log('🔸 ⚠️ Response is not JSON, likely HTML error page');
        responseData = {
          error: 'Server returned non-JSON response',
          statusCode: fetchResponse.status,
          message: responseText.substring(0, 200), // First 200 chars of error
        };
      }
      
      // Return in axios response format
      return {
        status: fetchResponse.status,
        data: responseData,
        headers: fetchResponse.headers,
      };
    } else {
      console.log('🔸 Using axios for JSON data');
      const response = await Common.axiosInstance.put(endPoint, params, {
        headers,
      });
      return response;
    }
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
