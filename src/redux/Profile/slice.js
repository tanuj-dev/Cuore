import { createSlice } from '@reduxjs/toolkit';
import { getProfile } from './profileThunk';

const initialState = {
  loading: false,

  data: null,
  error: null,
  success: false,
};

export const profileSlice = createSlice({
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
      .addCase(getProfile.pending, state => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })

      // Fulfilled
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload?.data;
      })

      // Rejected
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload?.message || 'Failed to fetch profile';
      });
  },
});

// export const { resetProfileState } = profileSlice.actions;
// export default profileSlice.reducer;
