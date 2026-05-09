import { createSlice } from '@reduxjs/toolkit';
import { verifyOtp } from './verifyOtpThunk';
import { createAccountThunk, logoutUser } from './authThunk';

const initialState = {
  accessToken: null,
  refreshToken: null,
  userId: null,
  expiresIn: null,
  newUser: false,
  role: null,
  loading: false,
  error: null,
  sessionExpired: false,
  paymentStatus: null,
  onboardingStatus: null,
  /** Free-tier signup (backend echoes from create-account / verify OTP). */
  isFree: false,
  month: null,
  fcmToken: null, // Firebase Cloud Messaging device token
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUserData: (state, action) => {
      const {
        accessToken,
        refreshToken,
        userId,
        expiresIn,
        newUser,
        role,
        paymentStatus,
        onboardingStatus,
        isFree,
        month,
      } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.userId = userId;
      state.expiresIn = expiresIn;
      state.newUser = newUser;
      state.error = null;
      state.role = role;
      if (paymentStatus != null) state.paymentStatus = paymentStatus;
      if (onboardingStatus != null) state.onboardingStatus = onboardingStatus;
      if (isFree != null) state.isFree = Boolean(isFree);
      if (month !== undefined) state.month = month;
    },

    setFCMToken: (state, action) => {
      state.fcmToken = action.payload;
    },
    logout: state => {
      // Keep fcmToken on logout so it's available for next login
      const fcmToken = state.fcmToken;
      Object.assign(state, initialState);
      state.fcmToken = fcmToken;
    },
    setSessionExpired: (state, action) => {
      state.sessionExpired = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(verifyOtp.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        const d = action.payload.data || {};
        const {
          access_token,
          refresh_token,
          user_id,
          expires_in,
          new_user,
          role,
          paymentStatus,
          onboardingStatus,
        } = d;
        const isFreeRaw = d.isFree ?? d.is_free;
        const monthRaw = d.month ?? d.subscription_month ?? null;

        state.accessToken = access_token;
        state.refreshToken = refresh_token;
        state.userId = user_id;
        state.expiresIn = expires_in;
        state.newUser = new_user;
        state.role = role || null;
        state.loading = false;
        state.error = null;
        state.paymentStatus = paymentStatus;
        state.onboardingStatus = onboardingStatus;
        state.isFree =
          isFreeRaw === true ||
          isFreeRaw === 'true' ||
          isFreeRaw === 1;
        if (monthRaw != null && monthRaw !== '') state.month = monthRaw;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'OTP verification failed';
      })
      .addCase(logoutUser.fulfilled, state => {
        const fcmToken = state.fcmToken;
        Object.assign(state, initialState);
        state.fcmToken = fcmToken;
      });
  },
});
const createAccountSlice = createSlice({
  name: 'createAccount',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {
    resetCreateAccount: state => {
      state.loading = false;
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createAccountThunk.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAccountThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(createAccountThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

const userDataInitialState = {
  user: null, // will hold user info after login/signup
};

export const { logout, setUserData, setSessionExpired, setFCMToken } = authSlice.actions;
export const { resetCreateAccount } = createAccountSlice.actions;

// export default userDataSlice.reducer;

export default {
  auth: authSlice.reducer,
  createAccount: createAccountSlice.reducer,
};
