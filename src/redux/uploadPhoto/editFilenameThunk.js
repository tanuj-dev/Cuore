import { createAsyncThunk } from '@reduxjs/toolkit';
import { putApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

/**
 * Edit filename of an uploaded file/record.
 * @param {{ recordId: string, fileName: string }} payload - recordId and new fileName (API body: { fileName })
 * @returns Thunk result with updated record data or error
 */
export const editFilename = createAsyncThunk(
  'uploadPhoto/editFilename',
  async ({ recordId, fileName }, { rejectWithValue }) => {
    try {
      const endpoint = `${EndPoints.EDIT_FILENAME}/${recordId}`;
      const response = await putApiCall(endpoint, { fileName });

      if (response?.status === 200) {
        return { data: response.data, success: true };
      } else {
        return rejectWithValue(
          response?.data?.message || 'Failed to update filename',
        );
      }
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || 'Failed to update filename',
      );
    }
  },
);
