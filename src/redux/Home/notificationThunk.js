import { createAsyncThunk } from '@reduxjs/toolkit';
import { postApiCall, putApiCall } from '../../utilities/Services';

export const getNotification = createAsyncThunk(
  'notification/set',
  async ({ userId, reminderId, time }, { rejectWithValue }) => {
    try {
      const payload = {
        time: time,
      };

      const response = await putApiCall(
        `/api/v1/timeline/${userId}/notified/${reminderId}`,
        payload,
      );

      console.log(
        '[getNotification] response:',
        response?.status,
        response?.data,
      );

      if (response?.status === 200) {
        return { data: response.data, success: true };
      } else {
        return { data: response.data, success: false };
      }
    } catch (error) {
      console.log('[getNotification] error:', error);
      return rejectWithValue(
        error?.response?.data || 'Failed to get notification',
      );
    }
  },
);
