import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { ShieldCheck, Clock, AlertTriangle, Lock } from 'lucide-react-native';
import RazorpayCheckout from 'react-native-razorpay';

import { CC } from './ccTheme';
import { CCHeader, PrimaryButton, SecondaryButton, Card } from './components';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import {
  getConsultationPayment,
  confirmConsultationPayment,
} from '../../redux/CuoreCare/thunks';

/**
 * Consultation checkout (§7.1, §8.2).
 *
 * The screen that makes payment-before-request real for the patient:
 *
 *     pick a slot → submit request → THIS SCREEN → payment verified server-side
 *                                               → only then does the doctor see the request
 *
 * ── WHY THE BREAKDOWN IS RENDERED FROM THE SERVER, NOT COMPUTED HERE ─────────────────────────
 * §8.2 requires the amount shown to the patient to equal the amount sent to the gateway. So this
 * screen renders `payment.lines` verbatim and never does arithmetic — not even to re-add the
 * total. If the app computed anything, a rounding difference between the two implementations
 * would become a real discrepancy between the receipt and the charge, which is the one thing that
 * requirement forbids.
 *
 * ── THE APP NEVER DECIDES THAT PAYMENT SUCCEEDED ─────────────────────────────────────────────
 * `confirmConsultationPayment` asks the SERVER to verify. Whatever a checkout SDK hands back is
 * passed along as evidence, not as a conclusion — the server checks it with the provider and
 * re-checks the amount. A 402 back means still unpaid, and the booking stays invisible to the
 * doctor. This screen is deliberately incapable of releasing an unpaid consultation.
 *
 * ── RAZORPAY ─────────────────────────────────────────────────────────────────────────────────
 * "Pay" opens Razorpay's checkout with the order the SERVER created (`payment.checkout`), and
 * hands whatever comes back to the confirm call as EVIDENCE. Every field — key id, order id,
 * amount — comes from the server, so the app cannot pay a different amount than it was quoted
 * and a key rotation needs no app release.
 *
 * The same Razorpay merchant account the Cuore website already charges through.
 */
export default function Checkout({ route, navigation }) {
  const dispatch = useDispatch();
  const { alert } = useCustomAlert();

  const appointmentId = route?.params?.appointmentId;
  // Handed straight from the booking response so the breakdown paints immediately rather than
  // showing a spinner for something the previous screen already knew.
  const [payment, setPayment] = useState(route?.params?.payment || null);
  const [loading, setLoading] = useState(!route?.params?.payment);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!appointmentId) return;
    setLoading(true);
    const res = await dispatch(getConsultationPayment(appointmentId));
    setLoading(false);
    if (getConsultationPayment.fulfilled.match(res)) setPayment(res.payload);
    else setError(res.payload?.message || 'Could not load the payment details.');
  }, [appointmentId, dispatch]);

  /* Fetch when there is nothing to show — and ALSO when what was handed over cannot open a
   * payment sheet.
   *
   * The booking response is passed straight here as route params so the breakdown paints with
   * no spinner. That summary used to arrive without a `checkout` block, so the screen had the
   * amount, the lines and the order id but no way to open Razorpay: it fell through to confirm
   * with no evidence and the server answered "no payment id was supplied to verify" for an
   * order that had been created perfectly. The server now sends `checkout` on both responses;
   * this second condition is what makes the screen recover on its own against a build that
   * does not, instead of presenting a dead Pay button. */
  const needsCheckout = !!payment && payment.payable !== false && payment.amountPaise > 0 && !payment.checkout;
  useEffect(() => {
    if (!payment || needsCheckout) load();
    // `needsCheckout` is false once a fetched payment carries its checkout block, so this
    // cannot loop: a payment that genuinely has no gateway (bypassed, zero amount) never
    // satisfies the condition in the first place.
  }, [payment, needsCheckout, load]);

  const onPay = async () => {
    setError('');
    setPaying(true);

    /* Open Razorpay with the SERVER's order. Every value here was minted server-side; the app
     * contributes nothing to the amount, which is what keeps §8.2's "displayed equals charged"
     * true no matter what the client does. */
    const co = payment?.checkout;
    let receipt = {};
    /* Can a real checkout actually open? The server sends `checkout` describing the order it
     * created; when the gateway is not configured it falls back to a refusing stub, and that
     * block arrives without a razorpay key. Recorded explicitly rather than inferred twice,
     * because what happens AFTER a failed confirm depends on it: a patient who never saw a
     * payment sheet must not be told their payment was declined. */
    const canCheckout = !!(co && co.provider === 'razorpay' && co.keyId && co.orderId);
    if (canCheckout) {
      try {
        const result = await RazorpayCheckout.open({
          key: co.keyId,
          order_id: co.orderId,
          amount: co.amountPaise,
          currency: co.currency || 'INR',
          name: co.name || 'Cuore',
          description: co.description || 'Consultation fee',
          prefill: co.prefill || {},
          theme: { color: CC.primary },
        });
        /* Evidence, NOT a conclusion. The server re-verifies this against Razorpay and re-checks
         * the amount before anything is marked paid — see utils/razorpayProvider.js. */
        receipt = {
          paymentId: result?.razorpay_payment_id,
          signature: result?.razorpay_signature,
        };
      } catch (e) {
        setPaying(false);
        /* A cancelled or failed checkout leaves the booking exactly as it was: held, unpaid and
         * invisible to the doctor. The slot stays reserved until the hold expires, so the patient
         * can simply try again — nothing needs undoing. */
        const cancelled = e?.code === 0 || /cancel/i.test(e?.description || e?.message || '');
        setError(
          cancelled
            ? 'Payment cancelled. Your slot is still held — you can try again.'
            : e?.description || 'Payment failed. Your consultation has not been sent to the doctor.',
        );
        return;
      }
    }

    /* Confirm with the server. Called even when checkout could not open (no gateway configured),
     * because the server then reports the true state rather than the app inventing one — and
     * because a payment completed on a previous attempt is confirmed idempotently here. */
    const res = await dispatch(confirmConsultationPayment({ appointmentId, ...receipt }));
    setPaying(false);

    if (confirmConsultationPayment.fulfilled.match(res)) {
      navigation.replace('CuoreCareAppointment', { appointmentId, justBooked: true });
      return;
    }

    const err = res.payload;
    if (err?.code === 'EXPIRED') {
      // The hold lapsed and the slot was released, so retrying here cannot work.
      alert('Booking expired', err.message || 'This booking’s payment window closed. Please book again.', [
        { text: 'Book again', onPress: () => navigation.replace('CuoreCareDoctors') },
      ]);
      return;
    }
    /* The server's `message` is already written for a patient (see
     * utils/consultationPaymentService.js — the gateway's own wording stays in the logs). The
     * one thing it cannot know is whether this app ever managed to show a payment sheet, so
     * that case is worded here: "we could not take your payment" is true and actionable, where
     * anything implying an attempt was made and refused would not be. */
    if (!canCheckout) {
      setError(
        err?.message ||
          'Payments are unavailable right now, so your consultation has not been sent. Your slot is held — please try again shortly.',
      );
      return;
    }
    setError(err?.message || 'Payment could not be confirmed. Your consultation has not been sent to the doctor yet.');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <CCHeader title="Payment" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator color={CC.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // An exempt patient should never reach this screen (booking sends them straight through), but
  // if they do — a deep link, a stale navigation — say so plainly instead of showing a ₹0 bill.
  if (payment && !payment.payable) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <CCHeader title="Payment" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ShieldCheck size={34} color={CC.success} />
          <Text style={styles.coveredTitle}>No payment needed</Text>
          <Text style={styles.coveredBody}>
            This consultation is covered by your Cuore plan.
          </Text>
          <PrimaryButton
            label="View consultation"
            style={{ marginTop: 20, alignSelf: 'stretch' }}
            onPress={() => navigation.replace('CuoreCareAppointment', { appointmentId })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CCHeader
        title="Payment"
        subtitle="Complete payment to send your request"
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* Says exactly what payment does, because a patient who thinks the doctor already has
            their request will not understand why nothing is happening. */}
        <View style={styles.notice}>
          <Clock size={15} color={CC.warning} />
          <Text style={styles.noticeText}>
            Your slot is held while you pay. Your doctor receives the request once payment is
            confirmed.
          </Text>
        </View>

        <Card style={{ marginTop: 14 }}>
          <Text style={styles.cardTitle}>Payment summary</Text>
          {/* Rendered verbatim from the server. No arithmetic on this screen — see the header. */}
          {(payment?.lines || []).map(line => (
            <View key={line.label} style={styles.row}>
              <Text style={styles.rowLabel}>{line.label}</Text>
              <Text style={styles.rowValue}>{line.amount}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total payable</Text>
            <Text style={styles.totalValue}>{payment?.total}</Text>
          </View>
        </Card>

        {error ? (
          <View style={styles.error}>
            <AlertTriangle size={15} color={CC.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          label={`Pay ${payment?.total || ''}`}
          loading={paying}
          disabled={paying}
          style={{ marginTop: 18 }}
          onPress={onPay}
        />
        <SecondaryButton
          label="Pay later"
          style={{ marginTop: 10 }}
          onPress={() => navigation.replace('CuoreCareAppointment', { appointmentId })}
        />
        {/* "Pay later" is honest about the consequence rather than implying the booking is safe. */}
        <Text style={styles.footnote}>
          If you leave without paying, your slot is released and the request is not sent.
        </Text>

        <View style={styles.secure}>
          <Lock size={12} color={CC.muted} />
          <Text style={styles.secureText}>Payment is verified securely by Cuore.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CC.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  body: { padding: 16, paddingBottom: 40 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: CC.warningSoft,
    borderRadius: 12,
    padding: 12,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17, color: CC.warning, fontFamily: CC.fonts.Regular },
  cardTitle: { fontSize: 14, color: CC.text, fontFamily: CC.fonts.SemiBold, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { flex: 1, fontSize: 13, color: CC.subText, fontFamily: CC.fonts.Regular },
  rowValue: { fontSize: 13, color: CC.text, fontFamily: CC.fonts.Medium },
  divider: { height: 1, backgroundColor: CC.border, marginVertical: 8 },
  totalLabel: { flex: 1, fontSize: 14, color: CC.text, fontFamily: CC.fonts.SemiBold },
  totalValue: { fontSize: 16, color: CC.primary, fontFamily: CC.fonts.SemiBold },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: CC.dangerSoft,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  errorText: { flex: 1, fontSize: 12, lineHeight: 17, color: CC.danger, fontFamily: CC.fonts.Regular },
  footnote: { fontSize: 11, color: CC.muted, textAlign: 'center', marginTop: 12, fontFamily: CC.fonts.Regular },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 18 },
  secureText: { fontSize: 11, color: CC.muted, fontFamily: CC.fonts.Regular },
  coveredTitle: { fontSize: 17, color: CC.text, fontFamily: CC.fonts.SemiBold, marginTop: 14 },
  coveredBody: { fontSize: 13, color: CC.subText, textAlign: 'center', marginTop: 6, fontFamily: CC.fonts.Regular },
});
