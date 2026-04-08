import { createSlice } from '@reduxjs/toolkit';
import { getProfile } from './profileThunk';
import { getDoctors, searchDoctors } from './profileThunk';

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
export const doctorsSlice = createSlice({
  name: 'doctors',
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  extraReducers: builder => {
    builder
      .addCase(getDoctors.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(searchDoctors.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(searchDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});
