import { createAsyncThunk } from '@reduxjs/toolkit';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { keepLocalCopy } from '@react-native-documents/picker';
import { postApiCall } from '../../utilities/Services';

/**
 * Upload an imaging study (DICOM .dcm, or a zipped study) to health records.
 *
 * This does NOT go through the ordinary upload thunk, and cannot: that one builds a FormData and
 * posts it to our own server, which buffers the whole file in memory with a 15 MB cap. One CT or
 * MRI study is 100 MB - 2 GB. So the bytes never touch our server at all:
 *
 *   1. ask the server for a presigned S3 PUT (it chooses the key; we never send one)
 *   2. stream the file straight to S3
 *   3. tell the server it landed, and it creates the record
 *
 * Step 2 uses react-native-blob-util rather than fetch, because `wrap(path)` streams the file
 * from disk. Passing a multi-hundred-megabyte file through fetch/FormData would read it into JS
 * memory first and kill the app on most devices.
 *
 * @param {{ file: {uri, name, type, size}, name: string, documentDate?: string,
 *           studyDescription?: string, modality?: string,
 *           onProgress?: (fraction:number) => void }} payload
 */
export const uploadImagingStudy = createAsyncThunk(
  'uploadPhoto/uploadImagingStudy',
  async (payload, { rejectWithValue }) => {
    const { file, name, documentDate, studyDescription, modality, onProgress } = payload || {};
    if (!file?.uri || !file?.name) {
      return rejectWithValue('No file was selected.');
    }

    try {
      // ---- 1. presigned URL ----
      const urlRes = await postApiCall('/api/health-records/imaging/upload-url', {
        fileName: file.name,
        fileSize: file.size || 0,
      });
      if (urlRes?.status !== 200 || !urlRes.data?.uploadUrl) {
        return rejectWithValue(
          urlRes?.data?.error || 'Could not start the upload. Please try again.',
        );
      }
      const { uploadUrl, s3Key, contentType } = urlRes.data;

      // ---- 2. stream straight to S3 ----
      // `wrap` streams from the filesystem, so it needs a real file path. On Android the picker
      // hands back a `content://` URI, which wrap() cannot open — keepLocalCopy() converts it
      // into a local file. Done here rather than at the picker so an ordinary PDF upload (which
      // posts a FormData and is happy with a content:// URI) is not made to copy files it does
      // not need to.
      let localPath = String(file.uri);
      if (localPath.startsWith('content://')) {
        const [copy] = await keepLocalCopy({
          files: [{ uri: file.uri, fileName: file.name }],
          destination: 'cachesDirectory',
        });
        if (copy?.status !== 'success' || !copy?.localUri) {
          return rejectWithValue('Could not read the selected file. Please try again.');
        }
        localPath = copy.localUri;
      }
      // blob-util wants the bare path, without the scheme.
      localPath = localPath.replace(/^file:\/\//, '');

      const task = ReactNativeBlobUtil.fetch(
        'PUT',
        uploadUrl,
        // ONLY Content-Type. Adding an Authorization header here would break the signature —
        // the presigned URL carries its own credentials, and S3 rejects extra signed headers.
        { 'Content-Type': contentType },
        ReactNativeBlobUtil.wrap(localPath),
      );

      if (typeof onProgress === 'function') {
        task.uploadProgress({ interval: 250 }, (written, total) => {
          if (total > 0) onProgress(written / total);
        });
      }

      const putRes = await task;
      const putStatus = putRes?.info?.().status ?? putRes?.respInfo?.status;
      if (putStatus !== 200 && putStatus !== 204) {
        return rejectWithValue(
          'The upload did not complete. Check your connection and try again.',
        );
      }

      // ---- 3. finalize ----
      // Only now does a record exist, so an abandoned upload never leaves a row pointing at
      // nothing.
      const finRes = await postApiCall('/api/health-records/imaging/finalize', {
        s3Key,
        name: name || file.name,
        originalFileName: file.name,
        documentDate,
        studyDescription,
        modality,
      });
      if (finRes?.status !== 201 && finRes?.status !== 200) {
        return rejectWithValue(
          finRes?.data?.error || 'The scan uploaded but could not be saved. Please try again.',
        );
      }
      return { record: finRes.data?.record, success: true };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.error || error?.message || 'Failed to upload the scan.',
      );
    }
  },
);

export default uploadImagingStudy;
