import { createSlice } from '@reduxjs/toolkit';
import {
  getCuoreCareStatus,
  getCuoreCareAccess,
  verifyCuoreCareSubscription,
  getCuoreCareDoctors,
  getDoctorAvailableDates,
  getDoctorSlots,
  bookAppointment,
  getAppointments,
  getTodayConsultations,
  getAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getPrescriptions,
  getCertificates,
  getVaccinations,
  getBills,
} from './thunks';

const initialState = {
  // Subscription entitlement (separate CuoreCare tier)
  subscription: {
    loading: false,
    checked: false, // true once a status call has resolved at least once
    active: false,
    plan: null,
    state: 'none', // active | expired | none
    startDate: null,
    expiryDate: null,
    platform: null, // ios | android | razorpay
    productId: null, // which product paid for it — distinguishes All Access from a legacy tier
    error: null,
  },
  // Centralized permission object (subscription OR admin-granted entitlement, per
  // feature) — see utilities/cuoreCareAccess.js. Additive to `subscription` above: that
  // state still drives the paywall/Profile subscription card unchanged; `access` drives
  // tab visibility + feature-level gating so Essential+granted users are also covered.
  access: {
    loading: false,
    checked: false,
    // True once cuoreCare/emr were seeded from the last-known cache, before `checked`. Lets
    // the tab bar render the right tab immediately instead of guessing "no access".
    fromCache: false,
    cuoreCare: false,
    appointmentBooking: false,
    videoCall: false,
    voiceCall: false,
    chat: false,
    emr: false,
    doctor: null, // { id, name } | null
    /* White-labelling: the practice's identity for THIS patient's linked doctor, resolved
     * server-side (utils/doctorBranding.js) as clinic → practice name → physician. Null when the
     * doctor has none of those — the UI then shows its own title rather than inventing one. */
    branding: null, // { name, logoUrl, doctorName, specialization, source } | null
    error: null,
  },
  doctors: { loading: false, list: [], total: 0, page: 1, error: null },
  // Slot booking: available dates for the chosen doctor + slots for the chosen date.
  availability: {
    datesLoading: false,
    dates: [], // [{ date: 'YYYY-MM-DD', slotCount }]
    configured: true, // false → doctor hasn't published availability
    slotsLoading: false,
    slotsDate: null,
    slots: [], // [{ start, end, label, durationMinutes }]
    error: null,
  },
  appointments: { loading: false, list: [], count: 0, scope: 'all', error: null },
  // Separate from `appointments` above on purpose: the Today screen and the CuoreCare tab
  // load different scopes and would otherwise overwrite each other's list.
  todayConsults: { loading: false, list: [], error: null },
  current: { loading: false, data: null, error: null },
  prescriptions: { loading: false, list: [], error: null },
  certificates: { loading: false, list: [], error: null },
  vaccinations: { loading: false, list: [], error: null },
  bills: { loading: false, list: [], totalDue: 0, error: null },
  // Shared transient flag for write actions (book/cancel/reschedule/verify)
  action: { loading: false, error: null, lastResult: null },
};

const cuoreCareSlice = createSlice({
  name: 'cuoreCare',
  initialState,
  reducers: {
    clearCuoreCareAction: state => {
      state.action.error = null;
      state.action.lastResult = null;
    },
    // Optimistic local patch used when a screen already has the fresh appointment doc.
    setCurrentAppointment: (state, action) => {
      state.current.data = action.payload || null;
    },
    // Clear the slot-picker state (e.g. when leaving the booking screen).
    resetBookingAvailability: state => {
      state.availability = initialState.availability;
    },
    // Seed the tab gate from cuoreCareAccessCache. Ignored once the live answer has landed,
    // so a slow storage read can never overwrite fresher server state.
    hydrateCuoreCareAccess: (state, action) => {
      if (state.access.checked || !action.payload) return;
      state.access.cuoreCare = !!action.payload.cuoreCare;
      state.access.emr = !!action.payload.emr;
      state.access.fromCache = true;
    },
    resetCuoreCare: () => initialState,
  },
  extraReducers: builder => {
    /* ---- subscription status ---- */
    builder
      .addCase(getCuoreCareStatus.pending, state => {
        state.subscription.loading = true;
        state.subscription.error = null;
      })
      .addCase(getCuoreCareStatus.fulfilled, (state, action) => {
        const cc = action.payload || {};
        state.subscription.loading = false;
        state.subscription.checked = true;
        state.subscription.active = !!cc.active;
        state.subscription.plan = cc.plan || null;
        state.subscription.state = cc.state || 'none';
        state.subscription.startDate = cc.startDate || null;
        state.subscription.expiryDate = cc.expiryDate || null;
        state.subscription.platform = cc.platform || null;
      })
      .addCase(getCuoreCareStatus.rejected, (state, action) => {
        state.subscription.loading = false;
        state.subscription.checked = true;
        state.subscription.error = action.payload?.message || 'Failed to load subscription';
      });

    /* ---- centralized access config ---- */
    builder
      .addCase(getCuoreCareAccess.pending, state => {
        state.access.loading = true;
        state.access.error = null;
      })
      .addCase(getCuoreCareAccess.fulfilled, (state, action) => {
        const a = action.payload?.access || {};
        state.access.loading = false;
        state.access.checked = true;
        state.access.cuoreCare = !!a.cuoreCare;
        state.access.appointmentBooking = !!a.appointmentBooking;
        state.access.videoCall = !!a.videoCall;
        state.access.voiceCall = !!a.voiceCall;
        state.access.chat = !!a.chat;
        state.access.emr = !!a.emr;
        state.access.doctor = action.payload?.doctor || null;
        state.access.branding = action.payload?.branding || null;
      })
      .addCase(getCuoreCareAccess.rejected, (state, action) => {
        state.access.loading = false;
        state.access.checked = true;
        state.access.error = action.payload?.message || 'Failed to load CuoreCare access';
      });

    /* ---- verify subscription (IAP) ---- */
    builder
      .addCase(verifyCuoreCareSubscription.pending, state => {
        state.action.loading = true;
        state.action.error = null;
      })
      .addCase(verifyCuoreCareSubscription.fulfilled, (state, action) => {
        state.action.loading = false;
        state.action.lastResult = 'subscribed';
        // Reflect the new entitlement immediately (a status refetch will confirm).
        state.subscription.active = true;
        state.subscription.state = 'active';
        state.subscription.plan = action.payload?.plan || state.subscription.plan;
        state.subscription.expiryDate = action.payload?.endDate || state.subscription.expiryDate;
        state.subscription.checked = true;
        // A real subscription grants every feature outright — reflect it immediately so
        // the tab/gates don't wait on a follow-up /access fetch.
        state.access.checked = true;
        state.access.cuoreCare = true;
        state.access.appointmentBooking = true;
        state.access.videoCall = true;
        state.access.voiceCall = true;
        state.access.chat = true;
      })
      .addCase(verifyCuoreCareSubscription.rejected, (state, action) => {
        state.action.loading = false;
        state.action.error = action.payload?.message || 'Verification failed';
      });

    /* ---- doctors ---- */
    builder
      .addCase(getCuoreCareDoctors.pending, state => {
        state.doctors.loading = true;
        state.doctors.error = null;
      })
      .addCase(getCuoreCareDoctors.fulfilled, (state, action) => {
        state.doctors.loading = false;
        state.doctors.list = action.payload.doctors;
        state.doctors.total = action.payload.total;
        state.doctors.page = action.payload.page;
      })
      .addCase(getCuoreCareDoctors.rejected, (state, action) => {
        state.doctors.loading = false;
        state.doctors.error = action.payload?.message || 'Failed to load doctors';
      });

    /* ---- availability: dates + slots ---- */
    builder
      .addCase(getDoctorAvailableDates.pending, state => {
        state.availability.datesLoading = true;
        state.availability.error = null;
        state.availability.dates = [];
        state.availability.slots = [];
        state.availability.slotsDate = null;
      })
      .addCase(getDoctorAvailableDates.fulfilled, (state, action) => {
        state.availability.datesLoading = false;
        state.availability.dates = action.payload.dates;
        state.availability.configured = action.payload.configured;
      })
      .addCase(getDoctorAvailableDates.rejected, (state, action) => {
        state.availability.datesLoading = false;
        state.availability.error = action.payload?.message || 'Failed to load dates';
      })
      .addCase(getDoctorSlots.pending, state => {
        state.availability.slotsLoading = true;
        state.availability.error = null;
      })
      .addCase(getDoctorSlots.fulfilled, (state, action) => {
        state.availability.slotsLoading = false;
        state.availability.slotsDate = action.payload.date;
        state.availability.slots = action.payload.slots;
        state.availability.configured = action.payload.configured;
      })
      .addCase(getDoctorSlots.rejected, (state, action) => {
        state.availability.slotsLoading = false;
        state.availability.slots = [];
        state.availability.error = action.payload?.message || 'Failed to load slots';
      });

    /* ---- appointments list ---- */
    builder
      .addCase(getTodayConsultations.pending, state => {
        state.todayConsults.loading = true;
        state.todayConsults.error = null;
      })
      .addCase(getTodayConsultations.fulfilled, (state, action) => {
        state.todayConsults.loading = false;
        state.todayConsults.list = action.payload || [];
      })
      .addCase(getTodayConsultations.rejected, (state, action) => {
        state.todayConsults.loading = false;
        state.todayConsults.list = [];
        state.todayConsults.error = action.payload?.message || 'Failed to load consultations';
      })

      .addCase(getAppointments.pending, state => {
        state.appointments.loading = true;
        state.appointments.error = null;
      })
      .addCase(getAppointments.fulfilled, (state, action) => {
        state.appointments.loading = false;
        state.appointments.list = action.payload.appointments;
        state.appointments.count = action.payload.count;
        state.appointments.scope = action.payload.scope;
      })
      .addCase(getAppointments.rejected, (state, action) => {
        state.appointments.loading = false;
        state.appointments.error = action.payload?.message || 'Failed to load appointments';
      });

    /* ---- appointment detail ---- */
    builder
      .addCase(getAppointment.pending, state => {
        state.current.loading = true;
        state.current.error = null;
      })
      .addCase(getAppointment.fulfilled, (state, action) => {
        state.current.loading = false;
        state.current.data = action.payload;
      })
      .addCase(getAppointment.rejected, (state, action) => {
        state.current.loading = false;
        state.current.error = action.payload?.message || 'Failed to load appointment';
      });

    /* ---- book / cancel / reschedule share the `action` flag + refresh `current` ---- */
    const writeActions = [bookAppointment, cancelAppointment, rescheduleAppointment];
    writeActions.forEach(thunk => {
      builder
        .addCase(thunk.pending, state => {
          state.action.loading = true;
          state.action.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.action.loading = false;
          state.action.lastResult = 'ok';
          /* bookAppointment returns `{ appointment, payment }` since §7.1 (the caller needs the
           * payment state to decide whether to show checkout), cancel returns `{ appointment, refund }`,
           * reschedule still returns the appointment directly. Both shapes are unwrapped here rather than at the call sites,
           * because keying on `payload.appointmentId` alone silently stopped updating
           * `current.data` after a booking — the screen then showed stale data with no error. */
          const appt = action.payload?.appointment || action.payload;
          if (appt?.appointmentId) {
            state.current.data = appt;
          }
        })
        .addCase(thunk.rejected, (state, action) => {
          state.action.loading = false;
          state.action.error = action.payload?.message || 'Action failed';
        });
    });

    /* ---- prescriptions ---- */
    builder
      .addCase(getPrescriptions.pending, state => {
        state.prescriptions.loading = true;
        state.prescriptions.error = null;
      })
      .addCase(getPrescriptions.fulfilled, (state, action) => {
        state.prescriptions.loading = false;
        state.prescriptions.list = action.payload.prescriptions;
      })
      .addCase(getPrescriptions.rejected, (state, action) => {
        state.prescriptions.loading = false;
        state.prescriptions.error = action.payload?.message || 'Failed to load prescriptions';
      });

    /* ---- certificates ---- */
    builder
      .addCase(getCertificates.pending, state => {
        state.certificates.loading = true;
        state.certificates.error = null;
      })
      .addCase(getCertificates.fulfilled, (state, action) => {
        state.certificates.loading = false;
        state.certificates.list = action.payload.certificates;
      })
      .addCase(getCertificates.rejected, (state, action) => {
        state.certificates.loading = false;
        state.certificates.error = action.payload?.message || 'Failed to load certificates';
      });

    /* ---- vaccinations ---- */
    builder
      .addCase(getVaccinations.pending, state => {
        state.vaccinations.loading = true;
        state.vaccinations.error = null;
      })
      .addCase(getVaccinations.fulfilled, (state, action) => {
        state.vaccinations.loading = false;
        state.vaccinations.list = action.payload.vaccinations;
      })
      .addCase(getVaccinations.rejected, (state, action) => {
        state.vaccinations.loading = false;
        state.vaccinations.error = action.payload?.message || 'Failed to load vaccinations';
      });

    /* ---- bills ---- */
    builder
      .addCase(getBills.pending, state => {
        state.bills.loading = true;
        state.bills.error = null;
      })
      .addCase(getBills.fulfilled, (state, action) => {
        state.bills.loading = false;
        state.bills.list = action.payload.bills;
        state.bills.totalDue = action.payload.totalDue;
      })
      .addCase(getBills.rejected, (state, action) => {
        state.bills.loading = false;
        state.bills.error = action.payload?.message || 'Failed to load bills';
      });
  },
});

export const {
  clearCuoreCareAction,
  setCurrentAppointment,
  resetBookingAvailability,
  hydrateCuoreCareAccess,
  resetCuoreCare,
} = cuoreCareSlice.actions;

export default cuoreCareSlice;
