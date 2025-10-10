// src/redux/thunks/basicInfoThunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { postApiCall, getApiCall, putApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';
import EncryptedStorage from 'react-native-encrypted-storage';

export const submitOnboarding = createAsyncThunk(
  'user/submitOnboarding',
  async (onboardingData, { rejectWithValue }) => {
    try {
      // 🧠 Endpoint for onboarding
      const endPoint = EndPoints.SUBMITONBOARDING;

      // ⚡ API call
      const response = await postApiCall(endPoint, onboardingData);

      console.log('[submitOnboarding] response:', response?.data);

      if (response?.status === 200 || response?.status === 201) {
        return response.data;
      } else {
        return rejectWithValue(
          response?.data || { message: 'Failed to submit onboarding data' },
        );
      }
    } catch (error) {
      console.error('[submitOnboarding] error:', error);
      return rejectWithValue(
        error?.response?.data || { message: error.message },
      );
    }
  },
);
// src/redux/thunks/getOnboardingThunk.js

export const getOnboardingThunk = createAsyncThunk(
  'onboarding/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getApiCall(EndPoints.GETONBOARDING);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Unknown error');
    }
  },
);

export const createReassessment = createAsyncThunk(
  'reassessment/create',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await putApiCall(EndPoints.REASSESSMENT, payload);
      return response.data;
    } catch (error) {
      const message =
        error?.response?.data?.message || error.message || 'Unknown error';
      return rejectWithValue(message);
    }
  },
);
