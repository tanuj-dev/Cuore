import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  getApiCall,
  postApiCall,
  putApiCall,
  deleteApiCall,
} from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

export const fetchNotes = createAsyncThunk(
  'notes/fetchNotes',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getApiCall(EndPoints.NOTES);
      if (res?.status === 200) {
        return res.data?.data;
      }
      return rejectWithValue(res?.data?.message || 'Failed to fetch notes');
    } catch (err) {
      return rejectWithValue(err?.message || 'Network error');
    }
  },
);

export const createNote = createAsyncThunk(
  'notes/createNote',
  async (text, { rejectWithValue }) => {
    try {
      const res = await postApiCall(EndPoints.NOTES, { text });
      if (res?.status === 201 || res?.status === 200) {
        return res.data?.data;
      }
      return rejectWithValue(res?.data?.message || 'Failed to create note');
    } catch (err) {
      return rejectWithValue(err?.message || 'Network error');
    }
  },
);

export const updateNote = createAsyncThunk(
  'notes/updateNote',
  async ({ id, text }, { rejectWithValue }) => {
    try {
      const res = await putApiCall(`${EndPoints.NOTES}/${id}`, { text });
      if (res?.status === 200) {
        return res.data?.data;
      }
      return rejectWithValue(res?.data?.message || 'Failed to update note');
    } catch (err) {
      return rejectWithValue(err?.message || 'Network error');
    }
  },
);

export const deleteNote = createAsyncThunk(
  'notes/deleteNote',
  async (id, { rejectWithValue }) => {
    try {
      const res = await deleteApiCall(`${EndPoints.NOTES}/${id}`);
      if (res?.status === 200) {
        return id;
      }
      return rejectWithValue(res?.data?.message || 'Failed to delete note');
    } catch (err) {
      return rejectWithValue(err?.message || 'Network error');
    }
  },
);
