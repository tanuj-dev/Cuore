import { createAsyncThunk } from '@reduxjs/toolkit';
import { postApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

/**
 * Upload one health-record file with the name the patient chose for it.
 * Files are uploaded one at a time so the screen can report honest
 * "Uploading 2 of 3" progress and a single bad file cannot fail the whole batch.
 *
 * @param {{ file: {uri,name,type}, name: string }} payload
 */
export const uploadPhoto = createAsyncThunk(
  'uploadPhoto/uploadPhoto',
  async (payload, { rejectWithValue }) => {
    try {
      // Backwards compatible: callers may still pass a ready-made FormData.
      let body = payload;
      if (!(payload && payload._parts)) {
        const { file, name } = payload || {};
        body = new FormData();
        body.append('files', file);
        body.append('names', name || '');
      }

      const response = await postApiCall(EndPoints.HEALTH_RECORDS, body);
      if (response?.status === 200) {
        return { data: response.data, success: true };
      }
      return rejectWithValue(
        response?.data?.error ||
          response?.data?.message ||
          'Failed to upload health record',
      );
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          'Failed to upload health record',
      );
    }
  },
);
