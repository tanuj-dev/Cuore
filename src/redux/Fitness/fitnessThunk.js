import { createAsyncThunk } from '@reduxjs/toolkit';
import { postApiCall, getApiCall, putApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

export const getFitness = createAsyncThunk(
  'fitness/get',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getApiCall(EndPoints.GET_FITNESS);
      return response.data;
    } catch (error) {
      console.error('Get FITNESS failed:', error);
      return rejectWithValue(error.response?.data || 'Something went wrong');
    }
  },
);
