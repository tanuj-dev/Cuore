import { createAsyncThunk } from '@reduxjs/toolkit';
import { postApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

/**
 * Upload one health-record file with the name the patient chose for it.
 * Files are uploaded one at a time so the screen can report honest
 * "Uploading 2 of 3" progress and a single bad file cannot fail the whole batch.
 *
 * @param {{ file: {uri,name,type}, name: string, patientId?: string, category?: string }} payload
 *   `patientId` files the document under a family member on this account. Omit it for the
 *   account holder — an absent patientId is what the server treats as the caller. The server
 *   verifies the link, so this is a request rather than an authorization decision.
 *   `category: 'diagnostics'` tags a report uploaded from CuoreCare → Records → Diagnostics;
 *   omitted, the server files it as a general record.
 */
export const uploadPhoto = createAsyncThunk(
  'uploadPhoto/uploadPhoto',
  async (payload, { rejectWithValue }) => {
    try {
      // Backwards compatible: callers may still pass a ready-made FormData.
      let body = payload;
      if (!(payload && payload._parts)) {
        const { file, name, patientId, category } = payload || {};
        body = new FormData();
        body.append('files', file);
        body.append('names', name || '');
        // Multipart, so this rides in the body alongside the file rather than as a query
        // param — the server reads req.body.patientId.
        if (patientId) body.append('patientId', String(patientId));
        if (category) body.append('category', String(category));
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
