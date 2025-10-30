import { createAsyncThunk } from '@reduxjs/toolkit';
import { putApiCall, getApiCall } from '../../utilities/Services';

export const getPredict = createAsyncThunk(
  'predict/fetch',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await getApiCall(`/api/v1/predict/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch predict');
    }
  },
);
