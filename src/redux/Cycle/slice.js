import { createSlice } from '@reduxjs/toolkit';
import { fetchCycle, saveCycle } from './thunks';

/**
 * Cycle tracking state.
 *
 * `data` is the server's whole response, unpicked: tracking flag, the saved answers, the derived
 * predictions and the bounds the form validates against. Kept as one object on purpose — every
 * field of it changes together on a save, and splitting it into separate slice keys would let the
 * calendar render last month's predictions beside this month's inputs for one frame.
 *
 * Today reads only `data.trackingEnabled`, to decide whether to show the calendar button at all.
 */
const initialState = {
  data: null,
  loading: false,
  saving: false,
  // The server names which of the three inputs it rejected; the form marks that one.
  errorField: null,
  error: null,
};

const cycleSlice = createSlice({
  name: 'cycle',
  initialState,
  reducers: {
    // Cleared when the form is edited, so a stale error does not sit under a corrected answer.
    clearCycleError: state => {
      state.error = null;
      state.errorField = null;
    },
    resetCycle: () => initialState,
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCycle.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCycle.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCycle.rejected, (state, action) => {
        state.loading = false;
        /* Deliberately NOT setting state.error: Today fetches this on every focus, and a patient
         * who simply is not eligible would otherwise see a failure message about a feature they
         * were never offered. The screen that can act on an error sets its own. */
        state.error = null;
        state.data = state.data || null;
      })
      .addCase(saveCycle.pending, state => {
        state.saving = true;
        state.error = null;
        state.errorField = null;
      })
      .addCase(saveCycle.fulfilled, (state, action) => {
        state.saving = false;
        state.data = action.payload;
      })
      .addCase(saveCycle.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload?.error || 'Could not save your cycle details';
        state.errorField = action.payload?.field || null;
      });
  },
});

export const { clearCycleError, resetCycle } = cycleSlice.actions;
export default cycleSlice.reducer;
