import { createAsyncThunk } from '@reduxjs/toolkit';
import { postApiCall } from '../../utilities/Services';

export const setReminder = createAsyncThunk(
  'reminders/setReminder',
  async ({ userId, reminderData }, { rejectWithValue }) => {
    console.log(
      'Setting reminder for userId:',
      userId,
      'with data:',
      reminderData,
    );
    try {
      const endpoint = `/api/v1/users/${userId}/reminders`;
      const response = await postApiCall(endpoint, reminderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to set reminder');
    }
  },
);
