import Common from './Common';
import EndPoints from './Endpoints';
import notifee, { TriggerType } from '@notifee/react-native';
import dailyRoutines from './Common';
import { Platform } from 'react-native';
import Constants from './Constants';
import EncryptedStorage from 'react-native-encrypted-storage';
import ApiLogger from './ApiLogger';

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
  const startTime = Date.now();
  try {
    const headers = await setupHeaders(true, endPoint);
    
    const isFormData = params && typeof params === 'object' && params._parts;
    
    ApiLogger.log({ method: 'POST', url: endPoint, body: isFormData ? '[FormData]' : params, status: 'pending' });
    
    if (isFormData) {
      const fullUrl = `${Common.axiosInstance.defaults.baseURL}${endPoint}`;
      
      const fetchHeaders = { ...headers };
      delete fetchHeaders['Content-Type'];
      
      const fetchResponse = await fetch(fullUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: params,
      });
      
      const responseText = await fetchResponse.text();
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = {
          error: 'Server returned non-JSON response',
          statusCode: fetchResponse.status,
          message: responseText.substring(0, 200),
        };
      }
      
      const result = { status: fetchResponse.status, data: responseData, headers: fetchResponse.headers };
      ApiLogger.log({ method: 'POST', url: endPoint, body: '[FormData]', status: fetchResponse.status, response: responseData, duration: Date.now() - startTime });
      return result;
    } else {
      const config = { headers };
      const response = await Common.axiosInstance.post(endPoint, params, config);
      ApiLogger.log({ method: 'POST', url: endPoint, body: params, status: response?.status, response: response?.data, duration: Date.now() - startTime });
      return response;
    }
  } catch (error) {
    ApiLogger.log({ method: 'POST', url: endPoint, body: params, status: error?.response?.status || 'ERR', response: error?.response?.data || error.message, duration: Date.now() - startTime });
    return error.response;
  }
}

/** POST to a specific base URL (e.g. share API on Render). Returns { status, data }. */
export async function postApiCallWithBaseUrl(baseUrl, endPoint, params) {
  const startTime = Date.now();
  const fullUrl = baseUrl.replace(/\/$/, '') + endPoint;
  try {
    const headers = await setupHeaders(true, endPoint);
    const res = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => ({}));
    ApiLogger.log({ method: 'POST', url: fullUrl, body: params, status: res.status, response: data, duration: Date.now() - startTime });
    return { status: res.status, data };
  } catch (error) {
    ApiLogger.log({ method: 'POST', url: fullUrl, body: params, status: 'ERR', response: error.message, duration: Date.now() - startTime });
    return { status: 0, data: error?.response?.data || null };
  }
}

// 🔸 GET API
export async function getApiCall(endPoint, paramsData = '') {
  const startTime = Date.now();
  const fullEndpoint = endPoint + paramsData;
  try {
    const headers = await setupHeaders(false, endPoint);
    const response = await Common.axiosInstance.get(fullEndpoint, { headers });
    ApiLogger.log({ method: 'GET', url: fullEndpoint, status: response?.status, response: response?.data, duration: Date.now() - startTime });
    return response;
  } catch (error) {
    ApiLogger.log({ method: 'GET', url: fullEndpoint, status: error?.response?.status || 'ERR', response: error?.response?.data || error.message, duration: Date.now() - startTime });
    return error.response;
  }
}

// 🔸 PUT API (for profile update, etc.)
export async function putApiCall(endPoint, params) {
  const startTime = Date.now();
  try {
    const headers = await setupHeaders(true, endPoint);
    const isFormData = params && typeof params === 'object' && params._parts;
    
    if (isFormData) {
      const fullUrl = `${Common.axiosInstance.defaults.baseURL}${endPoint}`;
      const fetchHeaders = { ...headers };
      delete fetchHeaders['Content-Type'];
      
      const fetchResponse = await fetch(fullUrl, {
        method: 'PUT',
        headers: fetchHeaders,
        body: params,
      });
      
      const responseText = await fetchResponse.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = {
          error: 'Server returned non-JSON response',
          statusCode: fetchResponse.status,
          message: responseText.substring(0, 200),
        };
      }
      
      const result = { status: fetchResponse.status, data: responseData, headers: fetchResponse.headers };
      ApiLogger.log({ method: 'PUT', url: endPoint, body: '[FormData]', status: fetchResponse.status, response: responseData, duration: Date.now() - startTime });
      return result;
    } else {
      const response = await Common.axiosInstance.put(endPoint, params, { headers });
      ApiLogger.log({ method: 'PUT', url: endPoint, body: params, status: response?.status, response: response?.data, duration: Date.now() - startTime });
      return response;
    }
  } catch (error) {
    ApiLogger.log({ method: 'PUT', url: endPoint, body: params, status: error?.response?.status || 'ERR', response: error?.response?.data || error.message, duration: Date.now() - startTime });
    return error.response;
  }
}

// 🔸 DELETE API
export async function deleteApiCall(endPoint) {
  const startTime = Date.now();
  try {
    const headers = await setupHeaders(true, endPoint);
    const response = await Common.axiosInstance.delete(endPoint, { headers });
    ApiLogger.log({ method: 'DELETE', url: endPoint, status: response?.status, response: response?.data, duration: Date.now() - startTime });
    return response;
  } catch (error) {
    ApiLogger.log({ method: 'DELETE', url: endPoint, status: error?.response?.status || 'ERR', response: error?.response?.data || error.message, duration: Date.now() - startTime });
    return error.response;
  }
}
