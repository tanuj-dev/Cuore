import { createAsyncThunk } from '@reduxjs/toolkit';
import { putApiCall } from '../../utilities/Services';

export const editWakeupThunk = createAsyncThunk(
  'timeline/editWakeup',
  async ({ userId, payload }, { rejectWithValue }) => {
    try {
      const response = await putApiCall(
        `/api/v1/users/${userId}/timeline/wakeup`,
        payload,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || 'Failed to update wakeup data',
      );
    }
  },
);
