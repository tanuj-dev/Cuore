import { createAsyncThunk } from '@reduxjs/toolkit';
import { postApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ requestId, testOtp }, { rejectWithValue }) => {
    console.log('[verifyOtp] Triggered with:', { requestId, testOtp });

    try {
      const payload = {
        request_id: requestId,
        otp_code: testOtp,
        client_info: {
          app_version: '1.0',
        },
      };

      console.log('[verifyOtp] Sending payload:', payload);

      const res = await postApiCall(EndPoints.VERIFYOTP, payload);

      console.log('[verifyOtp] Raw response:', res);

      const status = res?.status;
      const data = res?.data;
      const message = data?.message || 'OTP verification response received';

      if (status === 200) {
        console.log('[verifyOtp] OTP verified successfully');
        return {
          success: true,
          message,
          data: data || null,
          //   user: data?.user || null, // optional: if backend returns user info
          //   token: data?.token || null, // optional: for login session
        };
      } else {
        console.warn('[verifyOtp] Verification failed with status:', status);
        return rejectWithValue({
          success: false,
          message,
        });
      }
    } catch (err) {
      console.error('[verifyOtp] Network or server error:', err);
      return rejectWithValue({
        success: false,
        message: err.message || 'Network error',
      });
    }
  },
);
