import { createAsyncThunk } from '@reduxjs/toolkit';
import { putApiCall } from '../../utilities/Services';

export const updateReminderTime = createAsyncThunk(
  'reminders/updateReminderTime',
  async ({ userId, reminderId, newTime }, { rejectWithValue }) => {
    try {
      const endpoint = `/api/v1/users/${userId}/reminders/${reminderId}`;
      const payload = { time: newTime }; // assuming time is a string like "08:00"
      const response = await putApiCall(endpoint, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || 'Failed to update reminder time',
      );
    }
  },
);
