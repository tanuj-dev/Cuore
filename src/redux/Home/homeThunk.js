import { createAsyncThunk } from '@reduxjs/toolkit';
import { getApiCall } from '../../utilities/Services';

export const getHomeData = createAsyncThunk(
  'onboarding/fetchHomeData',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await getApiCall(`/api/v1/users/${userId}/home`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Something went wrong');
    }
  },
);
