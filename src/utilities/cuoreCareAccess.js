import { useSelector } from 'react-redux';

/**
 * Centralized CuoreCare permission utility — a thin selector over
 * `state.cuoreCare.access` (populated by GET /api/cuorecare/access, see
 * redux/CuoreCare/thunks.js `getCuoreCareAccess`). One place to ask "can this user do X"
 * instead of re-deriving subscription/entitlement logic in every screen.
 *
 * `access.cuoreCare` is already `subscriptionActive OR admin-granted cuoreCareEnabled` —
 * real CuoreCare subscribers and Essential+granted users are indistinguishable here by
 * design, so screens never need their own subscription-vs-entitlement branching.
 */
const FEATURES = ['cuoreCare', 'appointmentBooking', 'videoCall', 'voiceCall', 'chat'];

export function useCuoreCareAccess() {
  const access = useSelector(state => state?.cuoreCare?.access) || {};

  const canAccess = feature => {
    if (!FEATURES.includes(feature)) return false;
    return !!access[feature];
  };

  return {
    checked: !!access.checked,
    loading: !!access.loading,
    doctor: access.doctor || null,
    canAccess,
  };
}

export default useCuoreCareAccess;
