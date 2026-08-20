import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  getApiCall,
  postApiCall,
  putApiCall,
  deleteApiCall,
} from '../../utilities/Services';

/**
 * Family members (dependants) on this account — a child, an elderly parent: someone who needs
 * consultations but has no phone of their own and never logs in.
 *
 * Backend: /api/dependants (routes/analyzeRoutes.js), models/User.js `managedBy`,
 * utils/dependants.js. A dependant is a full User row, so their consultations, prescriptions and
 * records are separate from the account holder's — nothing is merged by phone number.
 *
 * Uses the general Services.js client, not utilities/cuoreCareApi.js: these routes live under the
 * main `/api/...` prefix alongside health-records, not `/api/cuorecare/*`.
 */

export const fetchDependants = createAsyncThunk(
  'dependants/fetch',
  async (_, { rejectWithValue }) => {
    const res = await getApiCall('/api/dependants', '');
    if (res?.status === 200 && res.data?.status === 'success') {
      return res.data.data || [];
    }
    return rejectWithValue(res?.data || { error: 'Could not load family members' });
  },
);

export const addDependant = createAsyncThunk(
  'dependants/add',
  async (body, { rejectWithValue }) => {
    const res = await postApiCall('/api/dependants', body);
    if ((res?.status === 201 || res?.status === 200) && res.data?.status === 'success') {
      return res.data.data;
    }
    // The server's message is the useful one here — it distinguishes a bad relationship, the
    // household cap, and the 503 raised while the phone-index migration is still pending.
    return rejectWithValue(res?.data || { error: 'Could not add the family member' });
  },
);

export const updateDependant = createAsyncThunk(
  'dependants/update',
  async ({ dependantId, ...body }, { rejectWithValue }) => {
    const res = await putApiCall(`/api/dependants/${dependantId}`, body);
    if (res?.status === 200 && res.data?.status === 'success') {
      return res.data.data;
    }
    return rejectWithValue(res?.data || { error: 'Could not update the family member' });
  },
);

export const removeDependant = createAsyncThunk(
  'dependants/remove',
  async (dependantId, { rejectWithValue }) => {
    const res = await deleteApiCall(`/api/dependants/${dependantId}`);
    if (res?.status === 200 && res.data?.status === 'success') {
      return { dependantId, message: res.data.message };
    }
    // 409 DEPENDANT_HAS_ACTIVE_APPOINTMENT is the one a patient will actually hit, so the
    // server's wording is passed through rather than replaced with something generic.
    return rejectWithValue(res?.data || { error: 'Could not remove the family member' });
  },
);
