import { createSlice } from '@reduxjs/toolkit';
import { verifyOtp } from './verifyOtpThunk';
import { createAccountThunk, refreshTokenThunk } from './authThunk';

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
    },

    logout: state => {
      Object.assign(state, initialState);
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
        const {
          access_token,
          refresh_token,
          user_id,
          expires_in,
          new_user,
          role,
          paymentStatus,
          onboardingStatus,
        } = action.payload.data || {};

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
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'OTP verification failed';
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

export const { logout, setUserData, setSessionExpired } = authSlice.actions;
export const { resetCreateAccount } = createAccountSlice.actions;

// export default userDataSlice.reducer;

export default {
  auth: authSlice.reducer,
  createAccount: createAccountSlice.reducer,
};
