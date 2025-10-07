// src/redux/thunks/basicInfoThunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { postApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';
import EncryptedStorage from 'react-native-encrypted-storage';

export const onBoarding2 = createAsyncThunk(
  'user/updateBasicInfo',
  async (basicInfoData, { rejectWithValue }) => {
    try {
      // 🔐 Retrieve auth data
      // const authDataString = await EncryptedStorage.getItem('auth_tokens');
      // if (!authDataString) throw new Error('Auth tokens not found');

      // const authData = JSON.parse(authDataString);
      // const userId = authData?.userId;

      // if (!userId) throw new Error('User ID missing in auth data');

      // 🧠 Prepare endpoint
      const endPoint = EndPoints.BASICINFO;
      // ⚡ POST API (headers auto-set by setupHeaders)
      const response = await postApiCall(endPoint, basicInfoData);

      console.log('[updateBasicInfo] response:', response?.data);

      if (response?.status === 200 || response?.status === 201) {
        return response.data;
      } else {
        return rejectWithValue(
          response?.data || { message: 'Failed to update basic info' },
        );
      }
    } catch (error) {
      console.error('[updateBasicInfo] error:', error);
      return rejectWithValue(
        error.response?.data || { message: error.message },
      );
    }
  },
);
export const onBoarding3 = createAsyncThunk(
  'user/submitHealthHistory',
  async (healthData, { rejectWithValue }) => {
    try {
      // 🔐 Get token and userId
      const authDataString = await EncryptedStorage.getItem('auth_tokens');
      if (!authDataString) throw new Error('Auth tokens not found');

      const authData = JSON.parse(authDataString);
      const userId = authData?.userId;
      if (!userId) throw new Error('User ID missing in auth data');

      // 🧩 Ensure userId is included
      const payload = {
        ...healthData,
        userId,
      };

      // 🧠 Endpoint (example: /api/v1/users/:userId/health-history)
      const endPoint = EndPoints.HEALTHHISTORY;
      // 🚀 Call API
      const response = await postApiCall(endPoint, payload);

      console.log('[submitHealthHistory] response:', response?.data);

      if (response?.status === 200 || response?.status === 201) {
        return response.data;
      } else {
        return rejectWithValue(
          response?.data || { message: 'Failed to save health history' },
        );
      }
    } catch (error) {
      console.error('[submitHealthHistory] error:', error);
      return rejectWithValue(
        error.response?.data || { message: error.message },
      );
    }
  },
);

export const onBoarding4 = createAsyncThunk(
  'user/submitLifestyle',
  async (lifestyleData, { rejectWithValue }) => {
    try {
      // 🔐 Get stored auth tokens
      const authDataString = await EncryptedStorage.getItem('auth_tokens');
      if (!authDataString) throw new Error('Auth tokens not found');

      const authData = JSON.parse(authDataString);
      const userId = authData?.userId;
      if (!userId) throw new Error('User ID missing in auth data');

      // 🧩 Prepare payload
      const payload = {
        ...lifestyleData,
        userId,
      };

      // 🧠 Endpoint (example: /api/v1/users/:userId/lifestyle)
      const endPoint = EndPoints.LIFESTYLE;
      // 🚀 API call
      const response = await postApiCall(endPoint, payload);

      console.log('[submitLifestyle] response:', response?.data);

      if (response?.status === 200 || response?.status === 201) {
        return response.data;
      } else {
        return rejectWithValue(
          response?.data || { message: 'Failed to save lifestyle data' },
        );
      }
    } catch (error) {
      console.error('[submitLifestyle] error:', error);
      return rejectWithValue(
        error.response?.data || { message: error.message },
      );
    }
  },
);
export const onBoarding5 = createAsyncThunk(
  'user/submitEatingExercise',
  async (exerciseData, { rejectWithValue }) => {
    try {
      // 🔐 Get stored auth tokens
      const authDataString = await EncryptedStorage.getItem('auth_tokens');
      if (!authDataString) throw new Error('Auth tokens not found');

      const authData = JSON.parse(authDataString);
      const userId = authData?.userId;
      if (!userId) throw new Error('User ID missing in auth data');

      // 🧩 Prepare payload
      const payload = {
        ...exerciseData,
        userId,
      };

      // 🧠 Endpoint (example: /api/v1/users/:userId/eating-exercise)
      // 🚀 API call
      const response = await postApiCall(EndPoints.EATINGEXCERCISE, payload);

      console.log('[submitEatingExercise] response:', response?.data);

      if (response?.status === 200 || response?.status === 201) {
        return response.data;
      } else {
        return rejectWithValue(
          response?.data || { message: 'Failed to save eating/exercise data' },
        );
      }
    } catch (error) {
      console.error('[submitEatingExercise] error:', error);
      return rejectWithValue(
        error.response?.data || { message: error.message },
      );
    }
  },
);
export const onBoarding6 = createAsyncThunk(
  'user/submitSleepStress',
  async (sleepStressData, { rejectWithValue }) => {
    try {
      // 🔐 Get stored token + user data
      const authDataString = await EncryptedStorage.getItem('auth_tokens');
      if (!authDataString) throw new Error('Auth tokens not found');

      const authData = JSON.parse(authDataString);
      const userId = authData?.userId;
      if (!userId) throw new Error('User ID missing in auth data');

      // 🧩 Build request payload
      const payload = {
        ...sleepStressData,
        userId,
      };

      // 🔸 Example endpoint: /api/v1/users/:userId/sleep-stress

      // 🚀 API call
      const response = await postApiCall(EndPoints.SLEEPSTRESS, payload);

      console.log('[submitSleepStress] response:', response?.data);

      if (response?.status === 200 || response?.status === 201) {
        return response.data;
      } else {
        return rejectWithValue(
          response?.data || { message: 'Failed to submit sleep & stress data' },
        );
      }
    } catch (error) {
      console.error('[submitSleepStress] error:', error);
      return rejectWithValue(
        error.response?.data || { message: error.message },
      );
    }
  },
);
export const onBoarding7 = createAsyncThunk(
  'user/submitBiomarkers',
  async (biomarkerData, { rejectWithValue }) => {
    try {
      // 🔐 Retrieve user info
      const authDataString = await EncryptedStorage.getItem('auth_tokens');
      if (!authDataString) throw new Error('Auth tokens not found');

      const authData = JSON.parse(authDataString);
      const userId = authData?.userId;
      if (!userId) throw new Error('User ID missing in storage');

      // 🧩 Combine payload
      const payload = {
        ...biomarkerData,
        userId,
      };

      // 🔸 Construct endpoint
      const endPoint = EndPoints.BIOMARKERS;
      // 🚀 Call API
      const response = await postApiCall(endPoint, payload);

      console.log('[submitBiomarkers] API response:', response?.data);

      if (response?.status === 200 || response?.status === 201) {
        return response.data;
      } else {
        return rejectWithValue(
          response?.data || { message: 'Failed to submit biomarkers' },
        );
      }
    } catch (error) {
      console.error('[submitBiomarkers] error:', error);
      return rejectWithValue(
        error.response?.data || { message: error.message },
      );
    }
  },
);
