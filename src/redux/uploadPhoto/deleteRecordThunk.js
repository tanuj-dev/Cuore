import { createAsyncThunk } from '@reduxjs/toolkit';
import { deleteApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

/**
 * Delete an uploaded record.
 * @param {string} recordId - Record ID to delete
 * @returns Thunk result with success or error
 */
export const deleteRecord = createAsyncThunk(
  'uploadPhoto/deleteRecord',
  async (recordId, { rejectWithValue }) => {
    try {
      const endpoint = `${EndPoints.DELETE_RECORD}/${recordId}`;
      const response = await deleteApiCall(endpoint);

      if (response?.status === 200) {
        return { recordId, success: true };
      } else {
        return rejectWithValue(
          response?.data?.message || 'Failed to delete record',
        );
      }
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to delete record',
      );
    }
  },
);
