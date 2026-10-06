import { createAsyncThunk } from '@reduxjs/toolkit';
import { getApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

/**
 * Fetch one patient's health records, newest first.
 *
 * @param {string|{q?: string, patientId?: string}} [arg]
 *   A bare string is treated as the search term, so every existing caller keeps working.
 *   `patientId` names a family member on this account; omit it for the account holder.
 *
 * The list is deliberately per-person and never merged: the whole point of family profiles is
 * that a child's documents are not mixed into the parent's. The server verifies the link, so
 * passing a patientId is a request, not an authorization decision.
 */
export const getPresRecordsThunk = createAsyncThunk(
  'getPresRecords',
  async (arg, { rejectWithValue }) => {
    try {
      const { q, patientId } =
        typeof arg === 'string' || arg == null ? { q: arg, patientId: undefined } : arg;
      const params = [];
      if (typeof q === 'string' && q.trim()) params.push(`q=${encodeURIComponent(q.trim())}`);
      if (patientId) params.push(`patientId=${encodeURIComponent(patientId)}`);
      const search = params.length ? `?${params.join('&')}` : '';
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
