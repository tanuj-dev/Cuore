import { createAsyncThunk } from '@reduxjs/toolkit';
import { postApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ endpoint, requestId, testOtp }, { rejectWithValue, getState }) => {
    console.log('[verifyOtp] Triggered with:', { requestId, testOtp });

    // Get FCM token from Redux state (set by FCMService.init on app start)
    const fcmToken = getState()?.auth?.fcmToken || null;
    console.log('[verifyOtp] FCM Token:', fcmToken);

    try {
      const payload = {
        request_id: requestId,
        otp_code: testOtp,
        client_info: {
          app_version: '1.0',
        },
        ...(fcmToken && { fcm_token: fcmToken }),
      };
      const payload2 = {
        request_id: requestId,
        otp_code: testOtp,
        ...(fcmToken && { fcm_token: fcmToken }),
      };

      console.log('[verifyOtp] Sending payload:', payload);

      const res = await postApiCall(
        endpoint,
        endpoint === EndPoints.NEWUSEROTP ? payload2 : payload,
      );

      console.log('[verifyOtp] Raw response:', res);

      const status = res?.status;
      const data = res?.data;
      const message = data?.message || data?.error || 'OTP verification response received';

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
