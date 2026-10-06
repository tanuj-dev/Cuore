import { createAsyncThunk } from '@reduxjs/toolkit';
import { deleteApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

/**
 * Delete a health record (removes the stored file too).
 * @param {string} recordId
 */
export const deleteRecord = createAsyncThunk(
  'uploadPhoto/deleteRecord',
  async (recordId, { rejectWithValue }) => {
    try {
      const endpoint = `${EndPoints.HEALTH_RECORDS}/${recordId}`;
      const response = await deleteApiCall(endpoint);

      if (response?.status === 200) {
        return { recordId, success: true };
      }
      return rejectWithValue(
        response?.data?.error ||
          response?.data?.message ||
          'Failed to delete record',
      );
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          'Failed to delete record',
      );
    }
  },
);
