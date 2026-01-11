import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  deleteApiCall,
  postApiCall,
  putApiCall,
} from '../../utilities/Services';

export const checkReminderThunk = createAsyncThunk(
  'reminders/check',
  async ({ id, userId, body }, { rejectWithValue }) => {
    console.log(id, userId, 'payload in thunk');
    try {
      const endpoint = `/api/v1/timeline/${userId}/complete/${id}`;
      const response = await putApiCall(endpoint, body);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || 'Failed to check reminder',
      );
    }
  },
);
