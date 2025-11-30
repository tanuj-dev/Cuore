import { createAsyncThunk } from '@reduxjs/toolkit';
import { getApiCall, putApiCall } from '../../utilities/Services';
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
          data: data,
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

export const getProfile = createAsyncThunk(
  'profile/getProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const endpoint = `/api/v1/users/${userId}/profile`;

      const res = await getApiCall(endpoint);
      const data = res?.data;

      if (res?.status === 200) {
        return {
          success: true,
          message: data?.message || 'Profile fetched successfully',
          data: data,
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

export const getDoctors = createAsyncThunk(
  'profile/getDoctors',
  async (userId, { rejectWithValue }) => {
    try {
      const endpoint = `api/v1/users/find-doctor`;
      const res = await getApiCall(endpoint);
      const data = res?.data;

      if (res?.status === 200) {
        return {
          success: true,
          message: data?.message || 'Doctors fetched successfully',
          data: data,
        };
      } else {
        return rejectWithValue({
          success: false,
          message: data?.message || 'Failed to fetch doctors',
        });
      }
    } catch (err) {
      return rejectWithValue(err?.message || 'Network error');
    }
  },
);
export const searchDoctors = createAsyncThunk(
  'profile/searchDoctors',
  async (search, { rejectWithValue }) => {
    const endpoint = `/api/v1/users/find-doctor?search=${search}`;
    const res = await getApiCall(endpoint);
    const data = res?.data;
    if (res?.status === 200) {
      return {
        success: true,
        message: data?.message || 'Doctors fetched successfully',
        data: data,
      };
    } else {
      return rejectWithValue({
        success: false,
        message: data?.message || 'Failed to fetch doctors',
      });
    }
  },
);
