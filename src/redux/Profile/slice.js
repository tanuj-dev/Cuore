import { createSlice } from '@reduxjs/toolkit';
import { updateProfile } from './profileThunk';

const initialState = {
  loading: false,
  profile: null,
  userId: null,
  message: '',
  error: null,
  success: false,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    resetProfileState: state => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = '';
      state.profile = null;
      state.userId = null;
    },
  },
  extraReducers: builder => {
    builder
      // Pending
      .addCase(updateProfile.pending, state => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })

      // Fulfilled
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.profile = action.payload.profile;
        state.userId = action.payload.userId;
        state.message = action.payload.message;
      })

      // Rejected
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload?.message || 'Failed to update profile';
      });
  },
});

export const { resetProfileState } = profileSlice.actions;
export default profileSlice.reducer;
