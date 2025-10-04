// import {Common} from '@utilities'
import Common from './Common';
// import Storagedb from './Storagedb';
import EndPoints from './Endpoints';

async function setupHeaders(isPost = true, endPoint = '') {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  };

  if (isPost) {
    headers['Accept'] = 'application/json, text/html, */*';
  }

  return headers;
}

export async function postApiCall(endPoint, params, isHeader = false) {
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

export async function getApiCall(endPoint, paramsData = '', isHeader = false) {
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
