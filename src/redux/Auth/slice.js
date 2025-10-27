import { createSlice } from '@reduxjs/toolkit';
import { verifyOtp } from './verifyOtpThunk';
import { createAccountThunk } from './authThunk';

const initialState = {
  accessToken: null,
  refreshToken: null,
  userId: null,
  expiresIn: null,
  newUser: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: state => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(verifyOtp.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        const { access_token, refresh_token, user_id, expires_in, new_user } =
          action.payload.data;

        state.accessToken = access_token;
        state.refreshToken = refresh_token;
        state.userId = user_id;
        state.expiresIn = expires_in;
        state.newUser = new_user;
        state.loading = false;
        state.error = null;
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

export const userDataSlice = createSlice({
  name: 'userData',
  initialState: userDataInitialState,
  reducers: {
    setUserData: (state, action) => {
      state.user = action.payload;
    },
    clearUserData: state => {
      state.user = null;
    },
  },
});

export const { setUserData, clearUserData } = userDataSlice.actions;
// export default userDataSlice.reducer;

export const { logout } = authSlice.actions;

export default {
  auth: authSlice.reducer,
  createAccount: createAccountSlice.reducer,
};
