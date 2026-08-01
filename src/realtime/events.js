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
};

export default EV;
