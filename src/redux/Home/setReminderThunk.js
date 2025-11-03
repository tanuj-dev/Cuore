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
      const endpoint = `/api/v1/timeline/${userId}/reminders`;
      const response = await postApiCall(endpoint, reminderData);
      console.log('Set Reminder API Response:', response);
      if (response?.status === 201 || response?.status === 200) {
        return { data: response.data, success: true };
      } else {
        return { data: response.data, success: false };
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to set reminder');
    }
  },
);
