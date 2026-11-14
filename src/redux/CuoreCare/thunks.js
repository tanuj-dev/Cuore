import { createAsyncThunk } from '@reduxjs/toolkit';
import { ccGet, ccPost, ccPatch, withQuery } from '../../utilities/cuoreCareApi';
import { saveCachedAccess } from '../../utilities/cuoreCareAccessCache';

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
      // Remember the tab gate for the next cold start (see cuoreCareAccessCache.js). Only the
      // patient-wide answer is cached — a doctor-scoped lookup isn't what the tab bar reads.
      if (!doctorId) saveCachedAccess(res.data.access);
      return res.data; // { subscription, doctor, branding, access }
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
// `channel` ('walkin' | 'teleconsult') is required by the backend — a walk-in and a
// teleconsult have independent slot lists for the same doctor.
export const getDoctorAvailableDates = createAsyncThunk(
  'cuoreCare/getAvailableDates',
  async ({ doctorId, channel, from, to } = {}, { rejectWithValue }) => {
    const path = withQuery(`/api/cuorecare/doctors/${doctorId}/available-dates`, { channel, from, to });
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
  async ({ doctorId, date, channel } = {}, { rejectWithValue }) => {
    const path = withQuery(`/api/cuorecare/doctors/${doctorId}/slots`, { date, channel });
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
      /* §7.1 — the booking now comes back UNPAID unless the patient is exempt, so the caller
       * needs the payment block to decide between checkout and the appointment screen. Returned
       * alongside the appointment rather than fetched separately: two calls means a window where
       * the app knows it booked but not whether money is owed. */
      return { appointment: res.data.appointment, payment: res.data.payment || null };
    }
    return rejectWithValue(fail(res, 'Could not book this appointment'));
  },
);

/* §8.2 — the itemised breakdown for a booked consultation. Reads the SNAPSHOTTED quote, so the
 * figure shown here is the figure that will be charged even if the doctor's fee changes. */
export const getConsultationPayment = createAsyncThunk(
  'cuoreCare/getPayment',
  async (appointmentId, { rejectWithValue }) => {
    const res = await ccGet(`/api/cuorecare/appointments/${appointmentId}/payment`);
    if (res.status === 200 && res.data?.status === 'success') return res.data.payment;
    return rejectWithValue(fail(res, 'Could not load the payment details'));
  },
);

/* §7.1 — asks the server to VERIFY the payment. The app never reports success itself: it hands
 * over whatever the checkout SDK returned and the server checks it against the provider and
 * re-checks the amount. A 402 back means still unpaid. */
export const confirmConsultationPayment = createAsyncThunk(
  'cuoreCare/confirmPayment',
  async ({ appointmentId, paymentId, signature }, { rejectWithValue }) => {
    const res = await ccPost(`/api/cuorecare/appointments/${appointmentId}/payment/confirm`, {
      paymentId,
      signature,
    });
    if (res.status === 200 && res.data?.status === 'success') return res.data;
    return rejectWithValue(fail(res, 'Payment could not be confirmed'));
  },
);

/* "I paid, but the app could not tell you."
 *
 * The confirm call carries evidence that exists only in this app's memory — Razorpay's payment
 * id and signature. If that request is lost (dropped connection, server restarting, app killed)
 * the money is gone and the booking still says unpaid, with no way to retry. This asks the
 * server to look OUR order up with the gateway instead, which needs nothing from the client.
 *
 * Safe to call when nothing was paid: the server answers 402 NOT_PAID and nothing moves. */
export const reconcileConsultationPayment = createAsyncThunk(
  'cuoreCare/reconcilePayment',
  async ({ appointmentId }, { rejectWithValue }) => {
    const res = await ccPost(`/api/cuorecare/appointments/${appointmentId}/payment/reconcile`, {});
    if (res.status === 200 && res.data?.status === 'success') return res.data;
    return rejectWithValue(fail(res, 'Could not check that payment'));
  },
);

/* "I'll pay at the clinic" — walk-in only, enforced server-side.
 *
 * Until this existed, "Pay later" on a walk-in only navigated away: the booking stayed in
 * `pending_payment`, the doctor never saw it, and a cron quietly released the slot. The patient
 * left believing they had an appointment and nobody had one. This promotes the booking the way
 * a paid one is promoted, with the fee recorded as owed and collected at reception. */
export const deferConsultationPayment = createAsyncThunk(
  'cuoreCare/deferPayment',
  async ({ appointmentId }, { rejectWithValue }) => {
    const res = await ccPost(`/api/cuorecare/appointments/${appointmentId}/payment/defer`, {});
    if (res.status === 200 && res.data?.status === 'success') return res.data;
    return rejectWithValue(fail(res, 'Could not confirm your booking'));
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

// Today's confirmed consultations, for the Home/Today time-card.
//
// Hits the SAME /appointments endpoint (scope=today -> scheduled|in_progress starting
// today, server-side) rather than reimplementing any of that filtering client-side. It
// lands in its own slice bucket because `appointments` is a single scope-keyed list shared
// with the CuoreCare tab — writing this into it would clobber whatever scope that tab is
// showing whenever Today refreshes.
export const getTodayConsultations = createAsyncThunk(
  'cuoreCare/getTodayConsultations',
  async (_arg, { rejectWithValue }) => {
    const res = await ccGet(withQuery('/api/cuorecare/appointments', { scope: 'today' }));
    if (res.status === 200 && res.data?.status === 'success') {
      return res.data.appointments || [];
    }
    return rejectWithValue(fail(res, 'Could not load your consultations'));
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
      // `refund` is set when the patient cancelled: { status, amountPaise } — completed,
      // processing, failed, or NOTHING_TO_REFUND / ALREADY_REFUNDED / NO_PAYMENT. The slice
      // unwraps `appointment` from this shape (same as bookAppointment's).
      return { appointment: res.data.appointment, refund: res.data.refund || null };
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

/* -------------------------------- Vaccinations ------------------------------ *
 * Written only by the doctor-side walk-in EMR — no CuoreCare appointment involved, so
 * this is a patient's own record across every doctor, not scoped to one consultation.
 * ---------------------------------------------------------------------------- */

export const getVaccinations = createAsyncThunk(
  'cuoreCare/getVaccinations',
  async (_arg, { rejectWithValue }) => {
    const res = await ccGet('/api/cuorecare/my/vaccinations');
    if (res.status === 200 && res.data?.status === 'success') {
      return { vaccinations: res.data.vaccinations || [] };
    }
    return rejectWithValue(fail(res, 'Could not load your vaccinations'));
  },
);

/* Child vaccine schedule — the household's children (account holder's dependants) with
 * their age-based schedule, each item already resolved to done/due/overdue/upcoming by the
 * backend. `children` is empty when there is no child on the account. */
export const getVaccineSchedule = createAsyncThunk(
  'cuoreCare/getVaccineSchedule',
  async (_arg, { rejectWithValue }) => {
    const res = await ccGet('/api/cuorecare/my/vaccine-schedule');
    if (res.status === 200 && res.data?.status === 'success') {
      return { children: Array.isArray(res.data.children) ? res.data.children : [] };
    }
    return rejectWithValue(fail(res, 'Could not load the vaccine schedule'));
  },
);

/* ----------------------------------- Bills ---------------------------------- */

export const getBills = createAsyncThunk(
  'cuoreCare/getBills',
  async (_arg, { rejectWithValue }) => {
    const res = await ccGet('/api/cuorecare/my/bills');
    if (res.status === 200 && res.data?.status === 'success') {
      return { bills: res.data.bills || [], totalDue: res.data.totalDue || 0 };
    }
    return rejectWithValue(fail(res, 'Could not load your bills'));
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
