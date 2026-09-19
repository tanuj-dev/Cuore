/**
 * Whose document is this?
 *
 * The CuoreCare document APIs return the WHOLE HOUSEHOLD's prescriptions, certificates,
 * vaccinations and bills. They have to: a family member never signs in, so the guardian's token
 * is the only way a child's prescription can be opened at all. Each row that is NOT the account
 * holder's own carries a `forPatient` label naming the person it belongs to (the server adds it
 * in utils/dependants.js labelForPatient).
 *
 * The documents screen used to render all of it as one list, so a child's prescription sat in the
 * parent's history looking exactly like the parent's — "prescription generated for that number
 * should be separate under dependent and not clubbed under primary".
 *
 * Pure and separate from the screen for the same reason cancelWindow.js and joinWindow.js are:
 * the rule is worth testing on its own, and a filter that is subtly wrong hides a patient's own
 * prescription from them.
 */

/**
 * @param {object} doc              a prescription / certificate / vaccination / bill row
 * @param {string|null} activeProfileId  the family member the app is acting as, null for the
 *                                       account holder
 * @returns {boolean}
 */
export function belongsToProfile(doc, activeProfileId) {
  // `forPatient` is present ONLY on a family member's row. Its absence is therefore a positive
  // statement that the row is the account holder's own, not missing data.
  const owner = doc && doc.forPatient && doc.forPatient.patientId ? String(doc.forPatient.patientId) : null;
  return activeProfileId ? owner === String(activeProfileId) : owner === null;
}

/** The same rule over a list, tolerant of a list that has not loaded yet. */
export function documentsForProfile(list, activeProfileId) {
  return (Array.isArray(list) ? list : []).filter(d => belongsToProfile(d, activeProfileId));
}
