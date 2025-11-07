import { createAsyncThunk } from '@reduxjs/toolkit';
import { getApiCall } from '../../utilities/Services';

export const getHomeData = createAsyncThunk(
  'onboarding/fetchHomeData',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await getApiCall(`/api/v1/timeline/${userId}/home`);

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Something went wrong');
    }
  },
);

export const getHealthRecord = createAsyncThunk(
  'health/getHealthRecord',
  async (userId, { rejectWithValue }) => {
    console.log('Fetching health record for userId:', userId);
    try {
      const endpoint = `/api/v1/cuorehealth/${userId}`;
      const response = await getApiCall(endpoint);
      console.log('Get Health Record API Response:', response);
      if (response?.status === 200) {
        return { data: response.data, success: true };
      } else {
        return { data: response.data, success: false };
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || 'failed to fetch health record',
      );
    }
  },
);
