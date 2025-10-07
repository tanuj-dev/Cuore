import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { postApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (phoneNumber, { rejectWithValue }) => {
    console.log('[sendOtp] Thunk triggered with phoneNumber:', phoneNumber);

    try {
      const payload = {
        phone: phoneNumber,
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
  async (payload, { rejectWithValue }) => {
    try {
      // Example: payload = { name, email, phone, password }
      const response = await postApiCall(EndPoints.CREATEACCOUNT, payload);

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
