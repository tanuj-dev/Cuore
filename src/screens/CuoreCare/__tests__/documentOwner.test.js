import { belongsToProfile, documentsForProfile } from '../documentOwner';

/**
 * Which documents belong to whom.
 *
 * The reported problem: "Prescription generated for that number should be separate under
 * dependent and not clubbed under primary." The API returns the whole household's documents —
 * it must, because a family member never signs in — and labels a family member's row with
 * `forPatient`. The screen rendered all of them as one list, so a child's prescription appeared
 * in the parent's history indistinguishable from the parent's own.
 *
 * Both directions of the filter matter and both are wrong in a dangerous way:
 *   - too loose, and a parent's history still shows their child's prescriptions as their own;
 *   - too tight, and a patient's OWN prescription disappears from their history.
 */

const ME = { prescriptionId: 'rx_me' };
const CHILD_ID = '65f0000000000000000000aa';
const OTHER_CHILD_ID = '65f0000000000000000000bb';
const CHILD = {
  prescriptionId: 'rx_child',
  forPatient: { patientId: CHILD_ID, name: 'Aarav', relationship: 'child', isDependant: true },
};
const OTHER_CHILD = {
  prescriptionId: 'rx_other',
  forPatient: { patientId: OTHER_CHILD_ID, name: 'Meera', relationship: 'child', isDependant: true },
};

describe('viewing as the account holder', () => {
  it('shows their own documents', () => {
    expect(belongsToProfile(ME, null)).toBe(true);
  });

  it("does NOT show a family member's — that is the 'clubbed under primary' bug", () => {
    expect(belongsToProfile(CHILD, null)).toBe(false);
  });
});

describe('viewing as a family member', () => {
  it('shows that member\'s documents', () => {
    expect(belongsToProfile(CHILD, CHILD_ID)).toBe(true);
  });

  it("does not show the account holder's", () => {
    expect(belongsToProfile(ME, CHILD_ID)).toBe(false);
  });

  it('does not show a SIBLING\'s — two children on one account stay separate', () => {
    expect(belongsToProfile(OTHER_CHILD, CHILD_ID)).toBe(false);
  });
});

describe('the ids are compared as strings', () => {
  it('an ObjectId-like value still matches its string form', () => {
    const doc = { forPatient: { patientId: { toString: () => CHILD_ID } } };
    expect(belongsToProfile(doc, CHILD_ID)).toBe(true);
  });
});

describe('malformed rows', () => {
  it('a row with an empty forPatient is treated as the account holder\'s own', () => {
    // Which is what it is: the server sets forPatient only when the row belongs to somebody else.
    expect(belongsToProfile({ forPatient: {} }, null)).toBe(true);
    expect(belongsToProfile({ forPatient: {} }, CHILD_ID)).toBe(false);
  });

  it('null and undefined do not throw', () => {
    expect(belongsToProfile(null, null)).toBe(true);
    expect(belongsToProfile(undefined, CHILD_ID)).toBe(false);
  });
});

describe('the list helper', () => {
  const all = [ME, CHILD, OTHER_CHILD];

  it('splits one household list into three disjoint lists', () => {
    expect(documentsForProfile(all, null)).toEqual([ME]);
    expect(documentsForProfile(all, CHILD_ID)).toEqual([CHILD]);
    expect(documentsForProfile(all, OTHER_CHILD_ID)).toEqual([OTHER_CHILD]);
  });

  it('loses nothing — every document belongs to exactly one profile', () => {
    const buckets = [null, CHILD_ID, OTHER_CHILD_ID].map(id => documentsForProfile(all, id));
    expect(buckets.flat()).toHaveLength(all.length);
  });

  it('survives a list that has not loaded yet', () => {
    expect(documentsForProfile(undefined, null)).toEqual([]);
    expect(documentsForProfile(null, CHILD_ID)).toEqual([]);
  });
});
