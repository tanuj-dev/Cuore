import { createAsyncThunk } from '@reduxjs/toolkit';
import { ccGet, ccPost, ccPatch, withQuery } from '../../utilities/cuoreCareApi';

/**
 * CuoreCare redux thunks (patient app). Endpoints + shapes verified against the backend
 * controllers on `feature/cuorecare` (subscription / appointment / prescription).
 *
 * Convention: cuoreCareApi resolves to `{ status, data }` and never throws. Thunks map
 * non-2xx into rejectWithValue({ code, message, httpStatus, ... }) so screens can branch
 * on `code` (e.g. TOO_EARLY, WINDOW_CLOSED, CUORECARE_SUBSCRIPTION_REQUIRED).
 */

const fail = (res, fallback) => ({
  httpStatus: res?.status ?? 0,
  code: res?.data?.code || null,
  message: res?.data?.message || res?.data?.error || fallback,
  opensAt: res?.data?.opensAt || null,
});

/* ------------------------------- Subscription ------------------------------ */

export const getCuoreCareStatus = createAsyncThunk(
  'cuoreCare/getStatus',
  async (_arg, { rejectWithValue }) => {
    const res = await ccGet('/api/cuorecare/subscription/status');
    if (res.status === 200 && res.data?.status === 'success') {
      return res.data.cuoreCare; // { active, plan, state, expiryDate }
    }
    return rejectWithValue(fail(res, 'Could not load your CuoreCare subscription'));
  },
);

// The one centralized permission response — subscription OR admin-granted entitlement,
// per feature. Drives tab visibility + action-level gating (see utilities/cuoreCareAccess).
export const getCuoreCareAccess = createAsyncThunk(
  'cuoreCare/getAccess',
  async (doctorId, { rejectWithValue }) => {
    const res = await ccGet(withQuery('/api/cuorecare/access', { doctorId }));
    if (res.status === 200 && res.data?.status === 'success') {
      return res.data; // { subscription, doctor, access }
    }
    return rejectWithValue(fail(res, 'Could not load your CuoreCare access'));
  },
);

// The verify endpoint returns { payment: 'done' | 'expired' | 'failed', ... } — a 200 with
// payment !== 'done' is NOT an active entitlement.
export const verifyCuoreCareSubscription = createAsyncThunk(
  'cuoreCare/verifySubscription',
  async (payload, { rejectWithValue }) => {
    const res = await ccPost('/api/cuorecare/subscription/verify', payload);
    if (res.status === 200 && res.data?.payment === 'done') {
      return res.data; // { payment, plan, startDate, endDate }
    }
    return rejectWithValue({
      ...fail(res, 'We could not verify this purchase'),
      payment: res?.data?.payment || 'failed',
    });
  },
);

/* ---------------------------------- Doctors -------------------------------- */

export const getCuoreCareDoctors = createAsyncThunk(
  'cuoreCare/getDoctors',
  async (filters = {}, { rejectWithValue }) => {
    const { search = '', specialization = '', page = 1, limit = 20 } = filters || {};
    const path = withQuery('/api/cuorecare/doctors', {
      search,
      specialization,
      page,
      limit,
    });
    const res = await ccGet(path);
    if (res.status === 200 && res.data?.status === 'success') {
      return { doctors: res.data.doctors || [], total: res.data.total || 0, page: res.data.page || 1 };
    }
    return rejectWithValue(fail(res, 'Could not load CuoreCare doctors'));
  },
);

/* ----------------------------- Availability & slots ------------------------ */

// Dates (within the doctor's booking horizon) that have at least one open slot.
export const getDoctorAvailableDates = createAsyncThunk(
  'cuoreCare/getAvailableDates',
  async ({ doctorId, from, to } = {}, { rejectWithValue }) => {
    const path = withQuery(`/api/cuorecare/doctors/${doctorId}/available-dates`, { from, to });
    const res = await ccGet(path);
    if (res.status === 200 && res.data?.status === 'success') {
      return {
        dates: res.data.dates || [],
        configured: res.data.configured !== false,
        slotDurationMinutes: res.data.slotDurationMinutes || null,
        timezone: res.data.timezone || null,
      };
    }
    return rejectWithValue(fail(res, 'Could not load available dates'));
  },
);

// Open slots for one date. Booked / blocked / expired are already filtered out server-side.
export const getDoctorSlots = createAsyncThunk(
  'cuoreCare/getSlots',
  async ({ doctorId, date } = {}, { rejectWithValue }) => {
    const path = withQuery(`/api/cuorecare/doctors/${doctorId}/slots`, { date });
    const res = await ccGet(path);
    if (res.status === 200 && res.data?.status === 'success') {
      return { date, slots: res.data.slots || [], configured: res.data.configured !== false };
    }
    return rejectWithValue({ ...fail(res, 'Could not load time slots'), date });
  },
);

/* -------------------------------- Appointments ----------------------------- */

export const bookAppointment = createAsyncThunk(
  'cuoreCare/book',
  async (body, { rejectWithValue }) => {
    const res = await ccPost('/api/cuorecare/appointments', body);
    if (res.status === 201 && res.data?.status === 'success') {
      return res.data.appointment;
    }
    return rejectWithValue(fail(res, 'Could not book this appointment'));
  },
);

export const getAppointments = createAsyncThunk(
  'cuoreCare/getAppointments',
  async (params = {}, { rejectWithValue }) => {
    const { scope = 'all', search = '' } = params || {};
    const path = withQuery('/api/cuorecare/appointments', { scope, search });
    const res = await ccGet(path);
    if (res.status === 200 && res.data?.status === 'success') {
      return { scope, appointments: res.data.appointments || [], count: res.data.count || 0 };
    }
    return rejectWithValue(fail(res, 'Could not load your appointments'));
  },
);

export const getAppointment = createAsyncThunk(
  'cuoreCare/getAppointment',
  async (appointmentId, { rejectWithValue }) => {
    const res = await ccGet(`/api/cuorecare/appointments/${appointmentId}`);
    if (res.status === 200 && res.data?.status === 'success') {
      return res.data.appointment;
    }
    return rejectWithValue(fail(res, 'Could not load this appointment'));
  },
);

export const cancelAppointment = createAsyncThunk(
  'cuoreCare/cancel',
  async ({ appointmentId, reason = '' }, { rejectWithValue }) => {
    const res = await ccPatch(`/api/cuorecare/appointments/${appointmentId}/cancel`, { reason });
    if (res.status === 200 && res.data?.status === 'success') {
      return res.data.appointment;
    }
    return rejectWithValue(fail(res, 'Could not cancel this appointment'));
  },
);

export const rescheduleAppointment = createAsyncThunk(
  'cuoreCare/reschedule',
  async ({ appointmentId, scheduledStart, durationMinutes }, { rejectWithValue }) => {
    const body = { scheduledStart };
    if (durationMinutes) body.durationMinutes = durationMinutes;
    const res = await ccPatch(`/api/cuorecare/appointments/${appointmentId}/reschedule`, body);
    if (res.status === 200 && res.data?.status === 'success') {
      return res.data.appointment;
    }
    return rejectWithValue(fail(res, 'Could not reschedule this appointment'));
  },
);

/* -------------------------------- Prescriptions ---------------------------- */

export const getPrescriptions = createAsyncThunk(
  'cuoreCare/getPrescriptions',
  async (_arg, { rejectWithValue }) => {
    const res = await ccGet('/api/cuorecare/prescriptions');
    if (res.status === 200 && res.data?.status === 'success') {
      return { prescriptions: res.data.prescriptions || [], count: res.data.count || 0 };
    }
    return rejectWithValue(fail(res, 'Could not load your prescriptions'));
  },
);

/* -------------------------------- Certificates ----------------------------- */

export const getCertificates = createAsyncThunk(
  'cuoreCare/getCertificates',
  async (_arg, { rejectWithValue }) => {
    const res = await ccGet('/api/cuorecare/certificates');
    if (res.status === 200 && res.data?.status === 'success') {
      return { certificates: res.data.certificates || [], count: res.data.count || 0 };
    }
    return rejectWithValue(fail(res, 'Could not load your certificates'));
  },
);

/* ----------------------- Transient (screen-local) actions ------------------ *
 * join / token refresh / presence events / signed-URL fetch return short-lived
 * capabilities (ZEGO tokens, presigned S3 URLs). These are NOT stored in redux — the
 * consultation/prescription screens call them directly and hold the result in local state.
 * Each resolves to { ok, data } | { ok:false, error } and never throws.
 * -------------------------------------------------------------------------- */

export async function joinConsultation(appointmentId) {
  const res = await ccPost(`/api/cuorecare/appointments/${appointmentId}/join`);
  if (res.status === 200 && res.data?.status === 'success') {
    // { appId, roomId, userId, mode, rtcToken, zimToken, rtcTokenTtlSec }
    return { ok: true, data: res.data };
  }
  return { ok: false, error: fail(res, 'Could not join the consultation') };
}

export async function refreshConsultationToken(appointmentId) {
  const res = await ccPost(`/api/cuorecare/appointments/${appointmentId}/token/refresh`);
  if (res.status === 200 && res.data?.status === 'success') {
    return { ok: true, data: res.data }; // { rtcToken, zimToken, rtcTokenTtlSec }
  }
  return { ok: false, error: fail(res, 'Could not refresh the call token') };
}

export async function recordConsultationEvent(appointmentId, type) {
  const res = await ccPost(`/api/cuorecare/appointments/${appointmentId}/events`, { type });
  return { ok: res.status === 200, error: res.status === 200 ? null : fail(res, 'event failed') };
}

export async function fetchPrescriptionUrl(idOrRxId) {
  const res = await ccGet(`/api/cuorecare/prescriptions/${idOrRxId}`);
  if (res.status === 200 && res.data?.status === 'success') {
    return { ok: true, data: res.data }; // { prescriptionId, issuedAt, url, expiresInSec }
  }
  return { ok: false, error: fail(res, 'Could not open this prescription') };
}

export async function fetchCertificateUrl(idOrCertId) {
  const res = await ccGet(`/api/cuorecare/certificates/${idOrCertId}`);
  if (res.status === 200 && res.data?.status === 'success') {
    return { ok: true, data: res.data }; // { certificateId, type, issuedAt, url, expiresInSec }
  }
  return { ok: false, error: fail(res, 'Could not open this certificate') };
}

// The finalised casesheet for a consultation. Returns { ok, data: casesheet|null } — the
// server returns null (not an error) while the doctor is still drafting it.
export async function fetchCasesheet(appointmentId) {
  const res = await ccGet(`/api/cuorecare/appointments/${appointmentId}/casesheet`);
  if (res.status === 200 && res.data?.status === 'success') {
    return { ok: true, data: res.data.casesheet || null };
  }
  return { ok: false, error: fail(res, 'Could not load the consultation notes') };
}
