import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  deleteApiCall,
  postApiCall,
  putApiCall,
} from '../../utilities/Services';

export const editReminderThunk = createAsyncThunk(
  'reminders/edit',
  async ({ sourceId, userId, payload2 }, { rejectWithValue }) => {
    console.log(payload2, 'payload in thunk');
    try {
      const endpoint = `/api/v1/timeline/${userId}/reminders/${sourceId}`;
      const response = await putApiCall(endpoint, payload2);

      if (response?.status === 200) {
        return {
          success: true,
          data: response.data,
        };
      } else {
        return {
          success: false,
          data: response.data,
        };
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || 'Failed to update reminder',
      );
    }
  },
);
export const deleteReminderThunk = createAsyncThunk(
  'reminders/delete',
  async ({ sourceId, userId }, { rejectWithValue }) => {
    try {
      const endpoint = `/api/v1/timeline/${userId}/reminders/${sourceId}`;
      const response = await deleteApiCall(endpoint);
      if (response?.status === 200) {
        return {
          success: true,
          data: response.data,
        };
      } else {
        return {
          success: false,
          data: response.data,
        };
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || 'Failed to delete reminder',
      );
    }
  },
);
// https://cuore-backend-1.onrender.com/api/v1/timeline/userid/reminders/reminderid

// body for this
// // {
// //   "title": "Call doctor",
// //   "time": "10:00 AM"
// // }
