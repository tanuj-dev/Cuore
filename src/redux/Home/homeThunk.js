import { createAsyncThunk } from '@reduxjs/toolkit';
import { getApiCall, postApiCall, putApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

export const getHomeData = createAsyncThunk(
  'onboarding/fetchHomeData',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await getApiCall(`/api/v1/timeline/${userId}/home`);

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Something went wrong');
    }
  },
);

export const getHealthRecord = createAsyncThunk(
  'health/getHealthRecord',
  async (userId, { rejectWithValue }) => {
    console.log('Fetching health record for userId:', userId);
    try {
      const endpoint = `/api/v1/cuorehealth/${userId}`;
      const response = await getApiCall(endpoint);
      console.log('Get Health Record API Response:', response);
      if (response?.status === 200) {
        return { data: response.data, success: true };
      } else {
        return { data: response.data, success: false };
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || 'failed to fetch health record',
      );
    }
  },
);

// export const updateLastConsulted =
export const updateLastConsulted = createAsyncThunk(
  'uploadConsulted',
  async ({ userId, payload }, { rejectWithValue }) => {
    console.log('Fetching health record for userId:', userId, payload);
    try {
      const endpoint = `/api/v1/cuorehealth/${userId}/last-consulted`;

      const response = await putApiCall(endpoint, payload);
      console.log('post lastConsulted Record API Response:', response);
      if (response?.status === 200) {
        return { data: response.data, success: true };
      } else {
        return { data: response.data, success: false };
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || 'failed to fetch health record',
      );
    }
  },
);

export const dismissAlert = createAsyncThunk(
  'home/dismissAlert',
  async ({ userId, alertId }, { rejectWithValue }) => {
    console.log('[dismissAlert] Attempting to dismiss alert with ID:', alertId, 'for user:', userId);

    // Validate parameters
    if (!userId) {
      console.log('[dismissAlert] Error: userId is missing or invalid');
      return rejectWithValue('User ID is required');
    }

    if (!alertId) {
      console.log('[dismissAlert] Error: alertId is missing or invalid');
      return rejectWithValue('Alert ID is required');
    }

    // Check if parameters are valid types
    if (typeof userId !== 'string' && typeof userId !== 'number') {
      console.log('[d\\ismissAlert] Error: userId is not a valid type:', typeof userId);
      return rejectWithValue('Invalid user ID format');
    }
    if (typeof alertId !== 'string' && typeof alertId !== 'number') {
      console.log('[dismissAlert] Error: alertId is not a valid type:', typeof alertId);
      return rejectWithValue('Invalid alert ID format');
    }

    try {
      console.log('[dismissAlert] Making API call to endpoint:', `/api/v1/timeline/${userId}/dismiss-alert`);
      console.log('[dismissAlert] Sending alertId in body:', { alertId });

      const endpoint = `/api/v1/timeline/${userId}/dismiss-alert`;
      const response = await postApiCall(endpoint, { alertId });

      console.log('[dismissAlert] API Response Status:', response?.status);
      console.log('[dismissAlert] API Response Data:', response?.data);

      if (response?.status === 200) {
        console.log('[dismissAlert] Alert dismissed successfully');
        return { alertId, success: true };
      } else {
        console.log('[dismissAlert] API returned non-200 status:', response?.status);
        return rejectWithValue(
          response?.data?.message || response?.data || 'Failed to dismiss alert'
        );
      }
    } catch (error) {
      console.log('[dismissAlert] Network/API Error:', error);
      console.log('[dismissAlert] Error response:', error.response);
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Failed to dismiss alert due to network error'
      );
    }
  }
);

export const respondCheckin = createAsyncThunk(
  'home/respondCheckin',
  async ({ status }, { rejectWithValue }) => {
    if (status !== 'accepted' && status !== 'declined') {
      return rejectWithValue('Status must be exactly accepted or declined');
    }

    try {
      const response = await postApiCall(EndPoints.RESPOND_CHECKIN, { status });
      if (response?.status === 200 || response?.status === 201) {
        return { success: true, status, data: response?.data };
      }

      return rejectWithValue(
        response?.data?.message || response?.data || 'Failed to respond check-in',
      );
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data ||
          error?.message ||
          'Failed to respond check-in',
      );
    }
  },
);
