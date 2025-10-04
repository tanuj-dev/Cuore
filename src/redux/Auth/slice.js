import { createSlice } from '@reduxjs/toolkit';
import { verifyOtp } from './verifyOtpThunk';

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
    setUserData: (state, action) => {
      const { accessToken, refreshToken, userId, expiresIn, newUser } =
        action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.userId = userId;
      state.expiresIn = expiresIn;
      state.newUser = newUser;
      state.error = null;
    },
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

export const { setUserData, logout } = authSlice.actions;
export default authSlice.reducer;
