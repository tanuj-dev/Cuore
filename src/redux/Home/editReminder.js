import { createAsyncThunk } from '@reduxjs/toolkit';
import { putApiCall } from '../../utilities/Services';

export const editReminderThunk = createAsyncThunk(
  'reminders/edit',
  async ({ userId, reminderId, payload2 }, { rejectWithValue }) => {
    console.log(payload2, 'payload in thunk');
    try {
      const endpoint = `/api/v1/users/${userId}/reminders/${reminderId}`;
      const response = await putApiCall(endpoint, payload2);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || 'Failed to update reminder',
      );
    }
  },
);

// body for this
// // {
// //   "title": "Call doctor",
// //   "time": "10:00 AM"
// // }
