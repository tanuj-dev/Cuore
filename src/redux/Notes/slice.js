import { createSlice } from '@reduxjs/toolkit';
import { fetchNotes, createNote, updateNote, deleteNote } from './notesThunk';

const notesSlice = createSlice({
  name: 'notes',
  initialState: {
    data: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      // fetch
      .addCase(fetchNotes.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload || [];
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // create
      .addCase(createNote.pending, state => {
        state.saving = true;
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.saving = false;
        state.data = [action.payload, ...state.data];
      })
      .addCase(createNote.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // update
      .addCase(updateNote.pending, state => {
        state.saving = true;
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        state.saving = false;
        state.data = state.data.map(n =>
          n._id === action.payload._id ? action.payload : n,
        );
      })
      .addCase(updateNote.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // delete
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.data = state.data.filter(n => n._id !== action.payload);
      })
      .addCase(deleteNote.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default notesSlice;
