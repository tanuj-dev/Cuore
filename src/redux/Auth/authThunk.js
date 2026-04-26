import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { postApiCall, deleteApiCall, putApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';
import Constants from '../../utilities/Constants';
import FCMService from '../../notifications/FCMService';
import { setFCMToken } from './slice';

export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async ({ phone, role }, { rejectWithValue }) => {
    console.log('[sendOtp] Thunk triggered with phone:', phone, 'role:', role);

    try {
      const payload = {
        phone,
        role,
        purpose: 'login',
        client_info: {
          app_version: '1.0',
          device_id: 'render-test',
        },
      };

      console.log('[sendOtp] Sending payload:', payload);

      const res = await postApiCall(EndPoints.GETOTP, payload);

      console.log('[sendOtp] Raw response:', res);

      const status = res?.status;
      const data = res?.data;
      const message = data?.message;
      const testOtp = data?.test_otp_code;
      const requestId = data?.request_id;
      const retryAfter = data?.retry_after_seconds;

      console.log('[sendOtp] Parsed status:', status);
      console.log('[sendOtp] Parsed message:', message);

      if (status === 200 || status === 202) {
        console.log('[sendOtp] OTP accepted by server');
        return {
          data,
          success: true,
          reLogin: false,
          message,
          testOtp, // for dev/test use
          requestId, // useful for verification step
          retryAfter, // for throttling or UI countdown
        };
      } else if (status === 405) {
        console.log('[sendOtp] Re-login required');
        return {
          success: false,
          reLogin: true,
          message: message || 'User needs to re-login',
        };
      } else {
        console.warn('[sendOtp] Unexpected status:', status);
        return rejectWithValue({
          success: false,
          reLogin: false,
          message: message || 'Unknown error',
        });
      }
    } catch (err) {
      console.error('[sendOtp] Network or server error:', err);
      return rejectWithValue({
        success: false,
        reLogin: false,
        message: err.message || 'Network error',
      });
    }
  },
);

// ✅ CREATE ACCOUNT THUNK
export const createAccountThunk = createAsyncThunk(
  'auth/createAccount',
  async (payload, { rejectWithValue, getState }) => {
    try {
      // Attach FCM token to signup payload so backend can link it to the new user
      const fcmToken = getState()?.auth?.fcmToken || null;
      const enrichedPayload = {
        ...payload,
        ...(fcmToken && { fcm_token: fcmToken }),
      };
      console.log('[createAccount] FCM Token attached:', fcmToken);

      // Example: payload = { name, email, phone, password }
      const response = await postApiCall(EndPoints.CREATEACCOUNT, enrichedPayload);

      if (response?.status === 200 || response?.status === 201) {
        return response.data;
      } else {
        return rejectWithValue(
          response?.data || { message: 'Failed to create account' },
        );
      }
    } catch (error) {
      console.log('CREATEACCOUNT ERROR:', error);
      return rejectWithValue(
        error?.response?.data || { message: 'Something went wrong' },
      );
    }
  },
);

export const loginCaregiverThunk = createAsyncThunk(
  'auth/loginCaregiver',
  async (payload, { rejectWithValue }) => {
    try {
      // Example: payload = { phone, otp_code }
      const response = await postApiCall(
        '/api/v1/auth/caregiver/otp/request',
        payload,
      );

      if (response?.status == 201 || response?.status === 200) {
        return response.data;
      } else {
        return rejectWithValue(
          response?.data || { message: 'Failed to login caregiver' },
        );
      }
    } catch (error) {
      console.log('LOGincaregiver ERROR:', error);
      return rejectWithValue(
        error?.response?.data || { message: 'Something went wrong' },
      );
    }
  },
);

export const verifyCaregiverThunk = createAsyncThunk(
  'auth/verifyCaregiver',
  async (payload, { rejectWithValue }) => {
    try {
      // Example payload: { phone: '+919515951595', otp_code: '1234', requestId: 'abc123' }
      const response = await postApiCall(
        '/api/v1/auth/caregiver/otp/verify',
        payload,
      );

      if (response?.status === 200) {
        return response.data; // contains token, user info, etc.
      } else {
        return rejectWithValue(
          response?.data || { message: 'Failed to verify caregiver' },
        );
      }
    } catch (error) {
      console.log('verifyCaregiver ERROR:', error);
      return rejectWithValue(
        error?.response?.data || { message: 'Something went wrong' },
      );
    }
  },
);
export const deleteAccountThunk = createAsyncThunk(
  'auth/deleteAccount',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await deleteApiCall(
        EndPoints.DELETEACCOUNT + `/${userId}`,
      );
      if (response?.status === 200) {
        return response.data;
      } else {
        return rejectWithValue(
          response?.data || { message: 'Failed to delete account' },
        );
      }
    } catch (error) {
      console.log('DELETEACCOUNT ERROR:', error);
      return rejectWithValue(
        error?.response?.data || { message: 'Something went wrong' },
      );
    }
  },
);

/**
 * POST /api/v1/users/heartbeat
 * Called when app comes to foreground so backend can track wakeups and schedule push notifications.
 */
export const sendHeartbeatThunk = createAsyncThunk(
  'auth/sendHeartbeat',
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      const state = getState();
      const userId = state?.auth?.userId;
      let fcmToken = state?.auth?.fcmToken || null;

      if (!userId) {
        return rejectWithValue({ message: 'No user session for heartbeat' });
      }

      // Fallback: heartbeat may trigger before onToken stores token in Redux.
      if (!fcmToken) {
        const freshToken = await FCMService.getToken();
        if (freshToken) {
          fcmToken = freshToken;
          dispatch(setFCMToken(freshToken));
        }
      }

      const timezone = 'Asia/Kolkata';
      const wakeupTime = new Date().toISOString();

      const payload = {
        timezone,
        wakeupTime,
        fcmToken,
      };

      const response = await putApiCall(EndPoints.HEARTBEAT, payload);

      if (response?.status === 200 || response?.status === 201) {
        return response.data;
      }

      return rejectWithValue(
        response?.data || { message: 'Failed to send heartbeat' },
      );
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || { message: 'Failed to send heartbeat' },
      );
    }
  },
);

/**
 * POST /api/v1/auth/logout — invalidates session on the server (Bearer from storage).
 * Always clears EncryptedStorage auth_tokens and lets auth slice reset on fulfilled.
 * @param {{ skipRemote?: boolean }} options — set skipRemote true when tokens are already invalid (e.g. session expired).
 */
export const logoutUser = createAsyncThunk('auth/logoutUser', async (options = {}) => {
  const { skipRemote = false } = options;
  try {
    if (!skipRemote) {
      const res = await postApiCall(EndPoints.LOGOUT, {});
      const status = res?.status;
      if (status !== 200 && status !== 204) {
        console.warn('[logoutUser] API non-success:', status, res?.data);
      }
    }
  } catch (e) {
    console.warn('[logoutUser] API error:', e?.message || e);
  } finally {
    try {
      await EncryptedStorage.removeItem('auth_tokens');
    } catch (e) {
      console.warn('[logoutUser] EncryptedStorage:', e?.message || e);
    }
  }
  return true;
});

