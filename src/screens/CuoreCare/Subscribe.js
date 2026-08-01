import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIAP, getAvailablePurchases } from 'react-native-iap';
import { useDispatch } from 'react-redux';
import { ShieldCheck, Video, Phone, MessageSquare, FileText, Lock } from 'lucide-react-native';

import { CC } from './ccTheme';
import { CCHeader, PrimaryButton } from './components';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import {
  CUORECARE_IAP_PRODUCT_IDS,
  CUORECARE_IAP_PLANS,
} from '../../utilities/cuoreCareConfig';
import {
  verifyCuoreCareSubscription,
  getCuoreCareStatus,
} from '../../redux/CuoreCare/thunks';

const F = CC.fonts;

const INCLUDED = [
  { icon: Video, text: 'Unlimited video consultations' },
  { icon: Phone, text: 'Voice consultations' },
  { icon: MessageSquare, text: 'Chat with your doctor' },
  { icon: FileText, text: 'Signed digital prescriptions' },
];

/** Play Billing offer token resolver (mirrors the base Checkout screen). */
function getAndroidOfferToken(sub) {
  const legacy = sub?.subscriptionOfferDetailsAndroid;
  if (Array.isArray(legacy)) {
    for (const d of legacy) {
      const t = d?.offerToken ?? d?.offerTokenAndroid;
      if (t) return String(t);
    }
  }
  const std = sub?.subscriptionOffers;
  if (Array.isArray(std)) {
    for (const o of std) {
      const t = o?.offerTokenAndroid ?? o?.offerToken;
      if (t) return String(t);
    }
  }
  return null;
}

const planForProduct = productId =>
  CUORECARE_IAP_PLANS.find(p => p.productId === productId)?.plan ||
  (/annual|year/i.test(productId || '') ? 'annual' : 'monthly');

export default function Subscribe({ navigation }) {
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();
  const [selectedKey, setSelectedKey] = useState('annual');
  const [processing, setProcessing] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const subscriptionsRef = useRef([]);

  const selected =
    CUORECARE_IAP_PLANS.find(p => p.key === selectedKey) || CUORECARE_IAP_PLANS[0];

  // Grant access only when the CuoreCare backend confirms payment === 'done'.
  const grantIfVerified = useCallback(
    async purchase => {
      const payload = {
        platform: Platform.OS,
        productId: purchase.productId,
        plan: planForProduct(purchase.productId),
        purchaseToken: purchase.transactionReceipt || purchase.purchaseToken,
        orderId: purchase.transactionId,
      };
      const res = await dispatch(verifyCuoreCareSubscription(payload));
      if (verifyCuoreCareSubscription.fulfilled.match(res)) {
        await dispatch(getCuoreCareStatus());
        setProcessing(false);
        alert('You are all set', 'Your CuoreCare subscription is now active.', [
          { text: 'Start', onPress: () => navigation.goBack() },
        ]);
        return true;
      }
      setProcessing(false);
      const kind = res.payload?.payment;
      alert(
        kind === 'expired' ? 'Subscription expired' : 'Not activated',
        res.payload?.message ||
          'We could not verify your purchase. If you were charged, tap Restore.',
      );
      return false;
    },
    [dispatch, alert, navigation],
  );

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async purchase => {
      try {
        await finishTransaction({ purchase, isConsumable: false });
        await grantIfVerified(purchase);
      } catch (e) {
        setProcessing(false);
        alert('Purchase error', 'Could not complete your purchase. Please try again.');
      }
    },
    onPurchaseError: async e => {
      setProcessing(false);
      if (e?.code === 'already-owned' || e?.code === 'E_ALREADY_OWNED') {
        try {
          const purchases = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
          const owned = purchases?.find(p => CUORECARE_IAP_PRODUCT_IDS.includes(p.productId));
          if (owned) {
            setProcessing(true);
            await grantIfVerified(owned);
            return;
          }
        } catch (_) {}
        alert('Already subscribed', 'This store account already has a CuoreCare subscription.');
        return;
      }
      if (e?.code !== 'E_USER_CANCELLED' && e?.code !== 'user-cancelled') {
        alert('Purchase failed', e?.message || 'Something went wrong. Please try again.');
      }
    },
    onError: e => console.warn('[CuoreCare IAP]', e?.message || e),
  });

  useEffect(() => {
    subscriptionsRef.current = subscriptions || [];
  }, [subscriptions]);

  useEffect(() => {
    if (!connected) return;
    setLoadingProducts(true);
    fetchProducts({ skus: CUORECARE_IAP_PRODUCT_IDS, type: 'subs' })
      .catch(e => console.warn('[CuoreCare IAP] fetchProducts', e?.message))
      .finally(() => setLoadingProducts(false));
  }, [connected, fetchProducts]);

  const loadedIds = useMemo(
    () => (subscriptions || []).map(s => s.productId || s.id).filter(Boolean),
    [subscriptions],
  );
  const selectedAvailable = loadedIds.length === 0 || loadedIds.includes(selected.productId);

  const handleSubscribe = async () => {
    if (!connected) {
      alert('Please wait', 'The payment system is still loading.');
      return;
    }
    setProcessing(true);
    try {
      if (Platform.OS === 'android') {
        const sub = (subscriptions || []).find(
          p => p.productId === selected.productId || p.id === selected.productId,
        );
        const offerToken = sub ? getAndroidOfferToken(sub) : null;
        const purchaseSku = sub?.id ?? sub?.productId ?? selected.productId;
        if (!offerToken) {
          setProcessing(false);
          alert(
            'Unavailable',
            'No Google Play offer for this plan yet. Ensure the product is active with a base plan and price.',
          );
          return;
        }
        await requestPurchase({
          type: 'subs',
          request: { google: { skus: [purchaseSku], subscriptionOffers: [{ sku: purchaseSku, offerToken }] } },
        });
      } else {
        if (!subscriptionsRef.current.length) {
          await fetchProducts({ skus: [selected.productId], type: 'subs' });
          await new Promise(r => setTimeout(r, 800));
        }
        if (!subscriptionsRef.current.length) {
          setProcessing(false);
          alert('Product unavailable', 'This subscription could not be loaded from the App Store.');
          return;
        }
        await requestPurchase({ type: 'subs', request: { apple: { sku: selected.productId } } });
      }
    } catch (e) {
      setProcessing(false);
      if (e?.code !== 'E_USER_CANCELLED') alert('Purchase error', e?.message || 'Failed to start purchase.');
    }
  };

  const handleRestore = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const purchases = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
      const owned = purchases?.find(p => CUORECARE_IAP_PRODUCT_IDS.includes(p.productId));
      if (!owned) {
        setProcessing(false);
        alert('No purchases found', 'No active CuoreCare subscription was found for this account.');
        return;
      }
      await grantIfVerified(owned);
    } catch (e) {
      setProcessing(false);
      alert('Restore failed', 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {AlertComponent}
      <CCHeader title="CuoreCare" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroIcon}>
          <ShieldCheck size={30} color={CC.primary} />
        </View>
        <Text style={styles.title}>Unlock doctor consultations</Text>
        <Text style={styles.subtitle}>
          Subscribe to CuoreCare and consult verified doctors by video, voice or chat — with a
          digital prescription every time.
        </Text>

        {/* Included */}
        <View style={styles.included}>
          {INCLUDED.map(item => {
            const Icon = item.icon;
            return (
              <View key={item.text} style={styles.includedRow}>
                <View style={styles.includedIcon}>
                  <Icon size={16} color={CC.primary} />
                </View>
                <Text style={styles.includedText}>{item.text}</Text>
              </View>
            );
          })}
        </View>

        {/* Plans */}
        <Text style={styles.section}>Choose your plan</Text>
        {CUORECARE_IAP_PLANS.map(plan => {
          const active = selectedKey === plan.key;
          return (
            <TouchableOpacity
              key={plan.key}
              style={[styles.planCard, active && styles.planCardActive]}
              onPress={() => setSelectedKey(plan.key)}
              activeOpacity={0.85}
            >
              <View style={styles.radioOuter}>{active && <View style={styles.radioInner} />}</View>
              <View style={{ flex: 1 }}>
                <View style={styles.planTop}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  {plan.topPick && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Best value</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
              </View>
              <View style={styles.priceCol}>
                <Text style={styles.priceNew}>₹{plan.newPrice}</Text>
                <Text style={styles.priceOld}>₹{plan.oldPrice}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {!loadingProducts && connected && loadedIds.length > 0 && !selectedAvailable && (
          <Text style={styles.warn}>This plan is not available in the store yet.</Text>
        )}

        <PrimaryButton
          label={processing ? 'Processing…' : `Subscribe · ₹${selected.newPrice}`}
          icon={!processing ? <Lock size={16} color={CC.white} /> : null}
          onPress={handleSubscribe}
          loading={processing}
          disabled={!connected || loadingProducts || (loadedIds.length > 0 && !selectedAvailable)}
          style={{ marginTop: 20 }}
        />

        {(!connected || loadingProducts) && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={CC.primary} />
            <Text style={styles.loadingText}>
              {!connected ? 'Setting up secure payment…' : 'Loading plans…'}
            </Text>
          </View>
        )}

        {Platform.OS === 'ios' && (
          <TouchableOpacity onPress={handleRestore} style={styles.restore}>
            <Text style={styles.restoreText}>Restore purchases</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.legal}>
          Billed to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google account'}. Auto-renews
          unless cancelled at least 24 hours before the period ends.
        </Text>
        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL('https://cuore.health/terms')}>
            <Text style={styles.legalLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}> · </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://cuore.health/privacy')}>
            <Text style={styles.legalLink}>Privacy</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CC.surface },
  scroll: { padding: 20 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: CC.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8,
  },
  title: { fontFamily: F.PoppinsBold, fontSize: 21, color: CC.text, textAlign: 'center', marginTop: 14 },
  subtitle: {
    fontFamily: F.PoppinsRegular,
    fontSize: 13.5,
    color: CC.subText,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  included: { backgroundColor: CC.white, borderRadius: 14, borderWidth: 1, borderColor: CC.border, padding: 8, marginTop: 22 },
  includedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 8 },
  includedIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: CC.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  includedText: { fontFamily: F.PoppinsMedium, fontSize: 13.5, color: CC.text },
  section: { fontFamily: F.PoppinsSemiBold, fontSize: 15, color: CC.text, marginTop: 24, marginBottom: 12 },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CC.white,
    borderWidth: 1.5,
    borderColor: CC.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  planCardActive: { borderColor: CC.primary, backgroundColor: CC.primarySoft },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: CC.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: CC.primary },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planTitle: { fontFamily: F.PoppinsSemiBold, fontSize: 15, color: CC.text },
  badge: { backgroundColor: CC.success, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontFamily: F.PoppinsMedium, fontSize: 10, color: CC.white },
  planSubtitle: { fontFamily: F.PoppinsRegular, fontSize: 12, color: CC.subText, marginTop: 2 },
  priceCol: { alignItems: 'flex-end', marginLeft: 8 },
  priceNew: { fontFamily: F.PoppinsBold, fontSize: 18, color: CC.text },
  priceOld: { fontFamily: F.PoppinsRegular, fontSize: 12, color: CC.muted, textDecorationLine: 'line-through' },
  warn: { fontFamily: F.PoppinsRegular, fontSize: 12.5, color: CC.warning, textAlign: 'center', marginTop: 4 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  loadingText: { fontFamily: F.PoppinsRegular, fontSize: 13, color: CC.subText, marginLeft: 8 },
  restore: { alignSelf: 'center', paddingVertical: 16 },
  restoreText: { fontFamily: F.PoppinsMedium, fontSize: 14, color: CC.primary, textDecorationLine: 'underline' },
  legal: { fontFamily: F.PoppinsRegular, fontSize: 11.5, color: CC.muted, textAlign: 'center', marginTop: 8, lineHeight: 17 },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  legalLink: { fontFamily: F.PoppinsMedium, fontSize: 12, color: CC.primary },
  legalDot: { color: CC.muted },
});
