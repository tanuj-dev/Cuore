import { createAsyncThunk } from '@reduxjs/toolkit';
import { putApiCall } from '../../utilities/Services';

export const editReminderThunk = createAsyncThunk(
  'reminders/edit',
  async ({ userId, reminderId, payload }, { rejectWithValue }) => {
    try {
      const endpoint = `/api/v1/users/${userId}/reminders/${reminderId}`;
      const response = await putApiCall(endpoint, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || 'Failed to update reminder',
      );
    }
  },
);
