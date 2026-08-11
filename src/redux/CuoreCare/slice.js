import { createSlice } from '@reduxjs/toolkit';
import {
  getCuoreCareStatus,
  verifyCuoreCareSubscription,
  getCuoreCareDoctors,
  getDoctorAvailableDates,
  getDoctorSlots,
  bookAppointment,
  getAppointments,
  getAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getPrescriptions,
  getCertificates,
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
    // Admin-granted access to CuoreCare features with one specific linked doctor, as an
    // alternative to a paid subscription. null when no grant exists for this patient.
    doctorGrant: null,
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
  current: { loading: false, data: null, error: null },
  prescriptions: { loading: false, list: [], error: null },
  certificates: { loading: false, list: [], error: null },
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
        state.subscription.doctorGrant = cc.doctorGrant || null;
      })
      .addCase(getCuoreCareStatus.rejected, (state, action) => {
        state.subscription.loading = false;
        state.subscription.checked = true;
        state.subscription.error = action.payload?.message || 'Failed to load subscription';
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
          if (action.payload?.appointmentId) {
            state.current.data = action.payload;
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
  },
});

export const {
  clearCuoreCareAction,
  setCurrentAppointment,
  resetBookingAvailability,
  resetCuoreCare,
} = cuoreCareSlice.actions;

export default cuoreCareSlice;
