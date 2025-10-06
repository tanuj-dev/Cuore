import { createAsyncThunk } from '@reduxjs/toolkit';
import { putApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async ({ userId, profileData }, { rejectWithValue }) => {
    try {
      const endpoint = `/api/v1/users/${userId}/profile`;

      const res = await putApiCall(endpoint, profileData);
      const data = res?.data;

      if (res?.status === 200) {
        return {
          success: true,
          message: data?.message || 'Profile updated successfully',
          userId: data?.user_id,
          profile: data?.profile,
        };
      } else {
        return rejectWithValue({
          success: false,
          message: data?.message || 'Failed to update profile',
        });
      }
    } catch (err) {
      return rejectWithValue({
        success: false,
        message: err?.message || 'Network error',
      });
    }
  },
);
