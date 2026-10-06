// The slice imports the thunks, which import utilities/Services -> Common -> NetInfo, a native
// module Jest cannot load. Stubbing the API client cuts that chain — same approach as the
// notifications slice test. createAsyncThunk only needs its payload creator at definition time,
// and these tests drive the reducer with action objects rather than dispatching real thunks.
jest.mock('../../../utilities/Services', () => ({
  getApiCall: jest.fn(),
  postApiCall: jest.fn(),
  putApiCall: jest.fn(),
  deleteApiCall: jest.fn(),
}));

import reducer, {
  setActiveProfile,
  resetDependants,
  selectActiveDependant,
  selectActivePatientId,
} from '../slice';
import {
  fetchDependants,
  addDependant,
  updateDependant,
  removeDependant,
} from '../thunks';

const CHILD = { dependantId: 'c1', name: 'Aarav', relationship: 'child' };
const SPOUSE = { dependantId: 's1', name: 'Riya', relationship: 'spouse' };

const initial = reducer(undefined, { type: 'init' });

describe('dependants slice', () => {
  it('starts as the account holder, not as a dependant', () => {
    expect(initial.activeProfileId).toBeNull();
    expect(initial.items).toEqual([]);
  });

  it('loads the family list', () => {
    const s = reducer(initial, { type: fetchDependants.fulfilled.type, payload: [CHILD, SPOUSE] });
    expect(s.items).toHaveLength(2);
    expect(s.loading).toBe(false);
  });

  it('switches profile and back', () => {
    let s = reducer(initial, { type: fetchDependants.fulfilled.type, payload: [CHILD] });
    s = reducer(s, setActiveProfile('c1'));
    expect(s.activeProfileId).toBe('c1');
    s = reducer(s, setActiveProfile(null));
    expect(s.activeProfileId).toBeNull();
  });

  // The case that would otherwise leave the app acting as somebody the server has stopped
  // accepting: the profile was removed on another device, so it is gone from the refreshed list.
  it('falls back to the account holder when the active profile vanishes from a refresh', () => {
    let s = reducer(initial, { type: fetchDependants.fulfilled.type, payload: [CHILD, SPOUSE] });
    s = reducer(s, setActiveProfile('s1'));
    expect(s.activeProfileId).toBe('s1');
    s = reducer(s, { type: fetchDependants.fulfilled.type, payload: [CHILD] });
    expect(s.activeProfileId).toBeNull();
  });

  it('keeps the active profile when it is still on the refreshed list', () => {
    let s = reducer(initial, { type: fetchDependants.fulfilled.type, payload: [CHILD, SPOUSE] });
    s = reducer(s, setActiveProfile('c1'));
    s = reducer(s, { type: fetchDependants.fulfilled.type, payload: [SPOUSE, CHILD] });
    expect(s.activeProfileId).toBe('c1');
  });

  it('appends a newly added family member', () => {
    let s = reducer(initial, { type: fetchDependants.fulfilled.type, payload: [CHILD] });
    s = reducer(s, { type: addDependant.fulfilled.type, payload: SPOUSE });
    expect(s.items.map(d => d.dependantId)).toEqual(['c1', 's1']);
    expect(s.saving).toBe(false);
  });

  it('replaces an updated member in place rather than duplicating it', () => {
    let s = reducer(initial, { type: fetchDependants.fulfilled.type, payload: [CHILD, SPOUSE] });
    s = reducer(s, {
      type: updateDependant.fulfilled.type,
      payload: { ...CHILD, name: 'Aarav Sharma' },
    });
    expect(s.items).toHaveLength(2);
    expect(s.items.find(d => d.dependantId === 'c1').name).toBe('Aarav Sharma');
  });

  it('removes a member', () => {
    let s = reducer(initial, { type: fetchDependants.fulfilled.type, payload: [CHILD, SPOUSE] });
    s = reducer(s, { type: removeDependant.fulfilled.type, payload: { dependantId: 'c1' } });
    expect(s.items.map(d => d.dependantId)).toEqual(['s1']);
  });

  // Removing the profile in use must not leave the app pointed at it — every subsequent request
  // would name a patient the server refuses.
  it('resets to the account holder when the ACTIVE profile is removed', () => {
    let s = reducer(initial, { type: fetchDependants.fulfilled.type, payload: [CHILD, SPOUSE] });
    s = reducer(s, setActiveProfile('c1'));
    s = reducer(s, { type: removeDependant.fulfilled.type, payload: { dependantId: 'c1' } });
    expect(s.activeProfileId).toBeNull();
  });

  it('leaves the active profile alone when a DIFFERENT member is removed', () => {
    let s = reducer(initial, { type: fetchDependants.fulfilled.type, payload: [CHILD, SPOUSE] });
    s = reducer(s, setActiveProfile('c1'));
    s = reducer(s, { type: removeDependant.fulfilled.type, payload: { dependantId: 's1' } });
    expect(s.activeProfileId).toBe('c1');
  });

  it('surfaces the server message rather than a generic one', () => {
    const s = reducer(initial, {
      type: removeDependant.rejected.type,
      payload: { error: 'This family member has an upcoming or ongoing consultation. Cancel it first.' },
    });
    expect(s.error).toMatch(/upcoming or ongoing consultation/);
    expect(s.saving).toBe(false);
  });

  it('clears everything on reset (logout)', () => {
    let s = reducer(initial, { type: fetchDependants.fulfilled.type, payload: [CHILD] });
    s = reducer(s, setActiveProfile('c1'));
    s = reducer(s, resetDependants());
    expect(s).toEqual(initial);
  });

  describe('selectors', () => {
    const withChild = { dependants: reducer(reducer(initial, { type: fetchDependants.fulfilled.type, payload: [CHILD] }), setActiveProfile('c1')) };
    const asSelf = { dependants: reducer(initial, { type: fetchDependants.fulfilled.type, payload: [CHILD] }) };

    it('resolves the active dependant', () => {
      expect(selectActiveDependant(withChild).name).toBe('Aarav');
      expect(selectActiveDependant(asSelf)).toBeNull();
    });

    // undefined, not the user's own id: an absent patientId is what the API treats as "me", and
    // keeping one rule is what stops booking and records disagreeing about who is selected.
    it('returns undefined for the account holder, so patientId is omitted from the request', () => {
      expect(selectActivePatientId(asSelf)).toBeUndefined();
      expect(selectActivePatientId(withChild)).toBe('c1');
    });

    it('does not throw when the slice is missing entirely', () => {
      expect(selectActiveDependant({})).toBeNull();
      expect(selectActivePatientId({})).toBeUndefined();
    });
  });
});
