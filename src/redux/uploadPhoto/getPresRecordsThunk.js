import { createAsyncThunk } from '@reduxjs/toolkit';
import { getApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

/**
 * Fetch the signed-in user's health records, newest first.
 * @param {string} [q] optional search term, matched against the custom document name.
 */
export const getPresRecordsThunk = createAsyncThunk(
  'getPresRecords',
  async (q, { rejectWithValue }) => {
    try {
      const search = typeof q === 'string' && q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
      const response = await getApiCall(EndPoints.HEALTH_RECORDS, search);
      if (response?.status === 200) {
        return { data: response.data, success: true };
      }
      return rejectWithValue(
        response?.data?.message || 'Failed to load health records',
      );
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to load health records',
      );
    }
  },
);
