import { createSlice } from '@reduxjs/toolkit';
import {
  fetchDependants,
  addDependant,
  updateDependant,
  removeDependant,
} from './thunks';

/**
 * Family members, plus the ACTIVE PROFILE — who the app is currently acting for.
 *
 * The active profile is the part that matters beyond this screen. Booking and Records both need
 * to know whether the user is looking at themselves or at their child, and holding that in one
 * place is what stops the two surfaces disagreeing — a booking made for a child while the Records
 * tab still shows the parent's documents is exactly the confusion this feature exists to remove.
 *
 * `activeProfileId` is null for the account holder. Null rather than the user's own id on
 * purpose: the app does not know its own user id everywhere, and null reads unambiguously as
 * "me", which is also what the API wants (omit patientId and the server acts as the caller).
 */
const initialState = {
  items: [],
  loading: false,
  saving: false,
  error: null,
  // null = the account holder. Otherwise a dependantId.
  activeProfileId: null,
};

const dependantsSlice = createSlice({
  name: 'dependants',
  initialState,
  reducers: {
    setActiveProfile: (state, action) => {
      state.activeProfileId = action.payload || null;
    },
    resetDependants: () => initialState,
  },
  extraReducers: builder => {
    builder
      .addCase(fetchDependants.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDependants.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
        // If the profile the app was acting for is no longer on the account — removed on another
        // device, or archived — fall back to the account holder rather than leaving the app
        // pointed at a profile the server will now refuse.
        if (
          state.activeProfileId &&
          !state.items.some(d => String(d.dependantId) === String(state.activeProfileId))
        ) {
          state.activeProfileId = null;
        }
      })
      .addCase(fetchDependants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Could not load family members';
      })

      .addCase(addDependant.pending, state => {
        state.saving = true;
        state.error = null;
      })
      .addCase(addDependant.fulfilled, (state, action) => {
        state.saving = false;
        if (action.payload) state.items = [...state.items, action.payload];
      })
      .addCase(addDependant.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload?.error || 'Could not add the family member';
      })

      .addCase(updateDependant.pending, state => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateDependant.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload;
        if (!updated) return;
        state.items = state.items.map(d =>
          String(d.dependantId) === String(updated.dependantId) ? updated : d,
        );
      })
      .addCase(updateDependant.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload?.error || 'Could not update the family member';
      })

      .addCase(removeDependant.pending, state => {
        state.saving = true;
        state.error = null;
      })
      .addCase(removeDependant.fulfilled, (state, action) => {
        state.saving = false;
        const id = action.payload?.dependantId;
        state.items = state.items.filter(d => String(d.dependantId) !== String(id));
        // Removing the profile currently in use must not leave the app acting as a person the
        // server no longer accepts.
        if (String(state.activeProfileId) === String(id)) state.activeProfileId = null;
      })
      .addCase(removeDependant.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload?.error || 'Could not remove the family member';
      });
  },
});

export const { setActiveProfile, resetDependants } = dependantsSlice.actions;

/** The active dependant's record, or null when acting as the account holder. */
export const selectActiveDependant = state => {
  const id = state.dependants?.activeProfileId;
  if (!id) return null;
  return (state.dependants?.items || []).find(d => String(d.dependantId) === String(id)) || null;
};

/**
 * What to send as `patientId`, or undefined for the account holder.
 *
 * Every caller should use this rather than reading activeProfileId directly: sending the
 * account holder's own id would work, but omitting it is what the API treats as "me", and
 * keeping one rule means booking and records cannot drift apart.
 */
export const selectActivePatientId = state => state.dependants?.activeProfileId || undefined;

export { dependantsSlice };
export default dependantsSlice.reducer;
