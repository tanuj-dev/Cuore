import { createAsyncThunk } from '@reduxjs/toolkit';
import EndPoints from '../../utilities/Endpoints';
import { getApiCall, postApiCall, putApiCall } from '../../utilities/Services';

const buildDoctorEndpoint = (filters = {}) => {
  const {
    search = '',
    specialization = '',
    page = 1,
    limit = 10,
  } = filters || {};

  const params = new URLSearchParams();
  const normalizedSearch = String(search || '').trim();
  // Always send snake_case (e.g. general_physician), never spaced or odd casing.
  const normalizedSpec = String(specialization || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  if (normalizedSearch) params.append('search', normalizedSearch);
  if (normalizedSpec) params.append('specialization', normalizedSpec);
  if (page != null) params.append('page', String(page));
  if (limit != null) params.append('limit', String(limit));

  const query = params.toString();
  return `/api/v1/users/find-doctor${query ? `?${query}` : ''}`;
};

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async ({ userId, profileData }, { rejectWithValue }) => {
    try {
      const endpoint = `/api/v1/users/${userId}/profile`;

      // profileData can be either FormData (with image) or regular object (without image)
      const res = await putApiCall(endpoint, profileData);
      const data = res?.data;

      if (res?.status === 200) {
        return {
          success: true,
          data: data,
        };
      } else {
        return rejectWithValue({
          success: false,
          message: data?.message || 'Failed to update profile',
        });
      }
    } catch (err) {
      return rejectWithValue({
        success: false,
        message: err?.message || 'Network error',
      });
    }
  },
);

export const getProfile = createAsyncThunk(
  'profile/getProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const endpoint = `/api/v1/users/${userId}/profile`;

      const res = await getApiCall(endpoint);
      const data = res?.data;

      if (res?.status === 200) {
        return {
          success: true,
          message: data?.message || 'Profile fetched successfully',
          data: data,
        };
      } else {
        return rejectWithValue({
          success: false,
          message: data?.message || 'Failed to update profile',
        });
      }
    } catch (err) {
      return rejectWithValue({
        success: false,
        message: err?.message || 'Network error',
      });
    }
  },
);

export const getDoctors = createAsyncThunk(
  'profile/getDoctors',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const endpoint = buildDoctorEndpoint(filters);
      const res = await getApiCall(endpoint);
      const data = res?.data;

      if (res?.status === 200) {
        return {
          success: true,
          message: data?.message || 'Doctors fetched successfully',
          data: data,
        };
      } else {
        return rejectWithValue({
          success: false,
          message: data?.message || 'Failed to fetch doctors',
        });
      }
    } catch (err) {
      return rejectWithValue(err?.message || 'Network error');
    }
  },
);
export const searchDoctors = createAsyncThunk(
  'profile/searchDoctors',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const normalizedFilters =
        typeof filters === 'string'
          ? { specialization: filters }
          : filters || {};
      const endpoint = buildDoctorEndpoint(normalizedFilters);
      const res = await getApiCall(endpoint);
      const data = res?.data;
      if (res?.status === 200) {
        return {
          success: true,
          message: data?.message || 'Doctors fetched successfully',
          data: data,
        };
      }
      return rejectWithValue({
        success: false,
        message: data?.message || 'Failed to fetch doctors',
      });
    } catch (err) {
      return rejectWithValue({
        success: false,
        message: err?.message || 'Network error',
      });
    }
  },
);

export const requestSupervision = createAsyncThunk(
  'profile/requestSupervision',
  async ({ _id }, { rejectWithValue }) => {
    const doctorId = _id != null ? String(_id).trim() : '';
    if (!doctorId) {
      return rejectWithValue({
        success: false,
        message: 'Doctor ID is required',
      });
    }
    try {
      const res = await postApiCall(EndPoints.REQUEST_SUPERVISION, {
        doctorId,
      });
      const status = res?.status;
      const data = res?.data;

      if (status === 200 || status === 201) {
        const ok = data?.success !== false && data?.status !== 'error';
        if (ok) {
          return {
            success: true,
            message: data?.message || 'Request sent successfully',
            data,
          };
        }
        return rejectWithValue({
          success: false,
          message:
            data?.message ||
            data?.error ||
            'Unable to send supervision request',
        });
      }

      return rejectWithValue({
        success: false,
        message:
          data?.message ||
          data?.error ||
          (typeof data === 'string' ? data : null) ||
          'Unable to send supervision request',
      });
    } catch (err) {
      return rejectWithValue({
        success: false,
        message: err?.message || 'Network error',
      });
    }
  },
);
