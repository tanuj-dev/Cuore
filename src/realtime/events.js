// CuoreCare real-time event names — MUST stay identical to the backend's
// config/cuoreCareEvents.js (clients can't import server files, so this is a mirror).
export const EV = {
  APPOINTMENT_NEW: 'appointment:new',
  APPOINTMENT_UPDATED: 'appointment:updated',
  CALL_INCOMING: 'call:incoming',
  CALL_ACCEPTED: 'call:accepted',
  CALL_DECLINED: 'call:declined',
  CALL_ENDED: 'call:ended',
  CALL_MISSED: 'call:missed',
  PARTICIPANT_JOINED: 'participant:joined',
  PARTICIPANT_LEFT: 'participant:left',
  PRESCRIPTION_READY: 'prescription:ready',
  // Invalidation signal for a doctor's bookable slot list. Payload is only
  // { doctorId, channel, dates? } -- no appointment or patient data, because the
  // slots:<doctorId>:<channel> room is shared by every patient viewing that doctor.
  // On receipt, refetch through the normal slots endpoint.
  SLOTS_CHANGED: 'slots:changed',
};

export default EV;
