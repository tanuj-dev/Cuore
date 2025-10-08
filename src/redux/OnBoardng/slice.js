import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';

import { submitOnboarding } from './onBoardingThunk';

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(submitOnboarding.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitOnboarding.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(submitOnboarding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default onboardingSlice.reducer;
