import { createAsyncThunk } from '@reduxjs/toolkit';
import { postApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';
import { getDeviceInfo } from '../../utilities/DeviceIdentity';

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ endpoint, requestId, testOtp }, { rejectWithValue, getState }) => {
    console.log('[verifyOtp] Triggered with:', { requestId, testOtp });

    // Get FCM token from Redux state (set by FCMService.init on app start)
    const fcmToken = getState()?.auth?.fcmToken || null;
    console.log('[verifyOtp] FCM Token:', fcmToken);

    // Attach device signals so the backend can track which device logs in to
    // which account (same-device / duplicate detection). Best-effort.
    let device_info = null;
    try {
      device_info = await getDeviceInfo();
    } catch (e) {
      console.warn('[verifyOtp] device_info skipped:', e?.message || e);
    }

    try {
      const payload = {
        request_id: requestId,
        otp_code: testOtp,
        client_info: {
          app_version: '1.0',
        },
        ...(fcmToken && { fcm_token: fcmToken }),
        ...(device_info && { device_info }),
      };
      const payload2 = {
        request_id: requestId,
        otp_code: testOtp,
        ...(fcmToken && { fcm_token: fcmToken }),
        ...(device_info && { device_info }),
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
