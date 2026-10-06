import { createAsyncThunk } from '@reduxjs/toolkit';
import { getApiCall, putApiCall } from '../../utilities/Services';

/**
 * Menstrual cycle tracking.
 *
 * Backend: /api/v1/cycle (routes/cycleRoutes.js, controllers/cycleController.js). Both routes act
 * on the token's own user — there is no variant that takes a user id, so nothing here passes one.
 *
 * ── WHY THE PREDICTIONS ARE NOT COMPUTED HERE ────────────────────────────────────────────────
 * Next period and fertile window arrive from the server already worked out. The app does not
 * repeat the arithmetic, because two implementations of the same formula drift, and the one on a
 * phone that has not been updated in six months is the one a patient would be reading. The server
 * is also where the inputs are validated, so a refused save and a drawn calendar cannot disagree.
 *
 * Dates are plain `YYYY-MM-DD` strings end to end — see the backend's utils/cyclePredictions.js
 * for why. Do not convert them to Date objects to compare them; compare the strings.
 */

export const fetchCycle = createAsyncThunk(
  'cycle/fetch',
  async (_, { rejectWithValue }) => {
    const res = await getApiCall('/api/v1/cycle', '');
    if (res?.status === 200 && res.data?.status === 'success') {
      return res.data.data;
    }
    return rejectWithValue(res?.data || { error: 'Could not load your cycle details' });
  },
);

export const saveCycle = createAsyncThunk(
  'cycle/save',
  async ({ lastPeriodStart, periodLengthDays, averageCycleLength }, { rejectWithValue }) => {
    const res = await putApiCall('/api/v1/cycle', {
      lastPeriodStart,
      periodLengthDays,
      averageCycleLength,
    });
    if (res?.status === 200 && res.data?.status === 'success') {
      return res.data.data;
    }
    // The server names the offending input in `field`, so the form can mark it rather than
    // showing one message under three questions.
    return rejectWithValue(res?.data || { error: 'Could not save your cycle details' });
  },
);
