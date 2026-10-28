import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Linking } from 'react-native';
import { useIAP, getAvailablePurchases } from 'react-native-iap';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useDispatch, useSelector } from 'react-redux';
import { setUserData } from '../../redux/Auth/slice';
import { hp, wp, Images } from '../../utilities';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { postApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';
import {
  IAP_SUBSCRIPTION_IDS,
  IAP_PLANS,
} from '../../utilities/Constants';
import {
  CUORECARE_IAP_PRODUCT_IDS,
  CUORECARE_LEGACY_IAP_PRODUCT_IDS,
} from '../../utilities/cuoreCareConfig';
import {
  verifyCuoreCareSubscription,
  getCuoreCareStatus,
} from '../../redux/CuoreCare/thunks';

/** Play Billing offer token: legacy rows use offerToken; OpenIAP standardized offers use offerTokenAndroid. */
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

// ─── Catalog ────────────────────────────────────────────────────────────────
// ONE plan is sold: Cuore All Access (₹359/year), which includes everything the old
// CuoreEssentials and CuoreCare tiers offered. The retired tier SKUs are still fetched and
// still recognised on restore (see Constants.IAP_SUBSCRIPTION_IDS and
// cuoreCareConfig.CUORECARE_LEGACY_IAP_PRODUCT_IDS) — they are just never offered for sale.
const TIERS = [
  {
    key: 'allaccess',
    label: 'Cuore All Access',
    caption: 'Everything in Cuore, plus doctor consultations',
    plans: IAP_PLANS.map(p => ({ ...p, tier: 'allaccess' })),
  },
];
const ALL_PLANS = TIERS.flatMap(t => t.plans);
// Deduped: the all-access id appears in both lists by design.
const ALL_SKUS = [
  ...new Set([...IAP_SUBSCRIPTION_IDS, ...CUORECARE_IAP_PRODUCT_IDS]),
];
// Which verify endpoint a purchase goes to. Only the RETIRED CuoreCare-only SKUs use the
// CuoreCare endpoint; an All Access purchase goes through the base endpoint, which grants
// both entitlements server-side. Testing against CUORECARE_IAP_PRODUCT_IDS here would be
// wrong — that list now contains the all-access id too.
const isCuoreCareProduct = pid => CUORECARE_LEGACY_IAP_PRODUCT_IDS.includes(pid);
// Plan key the CuoreCare backend expects for a retired CuoreCare-only SKU.
const cuoreCarePlanFor = pid =>
  /annual|year/i.test(pid || '') ? 'annual' : 'quarterly';
// Feature bullets for the one plan on sale.
const FEATURES = {
  allaccess: [
    { title: 'Track & stay consistent', desc: 'Track BP, sugar, daily guidance' },
    { title: 'Understand your health clearly', desc: 'Clear trends, insights, simple summaries' },
    { title: 'Be prepared & stay ahead', desc: 'Doctor updates, alerts, records organized' },
    { title: 'Video, voice & chat consultations', desc: 'Talk to verified CuoreCare doctors' },
    { title: 'Digital prescriptions', desc: 'Signed prescriptions after each consult' },
  ],
};

const Checkout = ({ navigation }) => {
  const dispatch = useDispatch();
  // Titles come from the catalog above; defaulting to the only plan on sale.
  const [selectedPlan, setSelectedPlan] = useState(ALL_PLANS[0].title);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const { alert, AlertComponent } = useCustomAlert();
  const userId = useSelector(state => state.auth?.userId);

  const selected =
    ALL_PLANS.find(p => p.title === selectedPlan) || ALL_PLANS[0];
  const loadedProductIds = useMemo(
    () => subscriptions?.map(s => s.productId || s.id).filter(Boolean) || [],
    [subscriptions],
  );
  const availablePlans = useMemo(
    () =>
      connected && loadedProductIds.length > 0
        ? ALL_PLANS.filter(plan => loadedProductIds.includes(plan.productId))
        : ALL_PLANS,
    [connected, loadedProductIds],
  );
  const plansToRender = useMemo(
    () => (availablePlans.length > 0 ? availablePlans : ALL_PLANS),
    [availablePlans],
  );
  const selectedProductAvailable =
    !!selected && loadedProductIds.includes(selected.productId);
  const getDurationByProductId = useCallback(
    productId =>
      ALL_PLANS.find(plan => plan.productId === productId)?.duration ||
      selected?.duration ||
      '12 Months',
    [selected],
  );
  const isCuoreCareSelected = !!selected && isCuoreCareProduct(selected.productId);

  // The backend returns HTTP 200 even for an EXPIRED subscription
  // (payment:'expired'), so a 200 alone is NOT proof of an active entitlement.
  // Only payment:'done' means the backend confirmed an active subscription.
  const isVerifiedActive = res =>
    res?.status === 200 && res?.data?.payment === 'done';

  // Ref to always have the latest subscriptions value (avoids stale closure in handleCheckout)
  const subscriptionsRef = useRef([]);

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase: iapRequestPurchase,
    finishTransaction: iapFinishTransaction,
  } = useIAP({
    onPurchaseSuccess: async purchase => {
      console.log('IAP: Purchase success:', purchase);
      try {
        await iapFinishTransaction({ purchase, isConsumable: false });
        await handleSuccessfulPurchase(purchase);
      } catch (err) {
        console.error('IAP: finishTransaction error:', err);
        setIsProcessingPayment(false);
        alert(
          'Purchase Error',
          'Could not complete your purchase. Please try again.',
        );
      }
    },
    onPurchaseError: async err => {
      // useIAP maps native errors without productId; log full err for Android debugging.
      console.error('IAP: Purchase error:', err?.code, err?.message, err);
      setIsProcessingPayment(false);

      if (err.code === 'already-owned' || err.code === 'E_ALREADY_OWNED') {
        console.log('IAP: Item already owned, verifying with backend...');
        try {
          const purchases = await getAvailablePurchases({
            onlyIncludeActiveItemsIOS: true,
          });
          const relevantPurchase = purchases?.find(p =>
            ALL_SKUS.includes(p.productId),
          );

          if (relevantPurchase) {
            if (isCuoreCareProduct(relevantPurchase.productId)) {
              await grantCuoreCare(relevantPurchase);
              return;
            }
            const payload = {
              userId,
              platform: Platform.OS,
              productId: relevantPurchase.productId,
              duration: getDurationByProductId(relevantPurchase.productId),
              purchaseToken:
                relevantPurchase.transactionReceipt ||
                relevantPurchase.purchaseToken,
              orderId: relevantPurchase.transactionId,
              purchaseTime: relevantPurchase.transactionDate,
            };

            console.log('IAP: Verifying already-owned purchase:', payload);
            const response = await postApiCall(
              EndPoints.VERIFY_SUBSCRIPTION,
              payload,
            );

            if (isVerifiedActive(response)) {
              try {
                const tokenData = await EncryptedStorage.getItem('auth_tokens');
                if (tokenData) {
                  const parsed = JSON.parse(tokenData);
                  parsed.paymentStatus = 'completed';
                  await EncryptedStorage.setItem(
                    'auth_tokens',
                    JSON.stringify(parsed),
                  );
                  dispatch(setUserData(parsed));
                }
              } catch (e) {
                console.warn('Could not persist payment status:', e);
              }
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            } else {
              alert(
                'Subscription In Use',
                'This Apple ID subscription is already linked to another account. Please use a different Apple ID or log in with the original account.',
              );
            }
            return;
          }
        } catch (restoreErr) {
          console.warn('Could not verify already-owned purchase:', restoreErr);
        }

        alert(
          'Subscription In Use',
          'This Apple ID subscription is already linked to another account. Please use a different Apple ID or log in with the original account.',
        );
        return;
      }

      if (err.code !== 'E_USER_CANCELLED' && err.code !== 'user-cancelled') {
        alert(
          'Purchase Failed',
          err.message || 'Something went wrong. Please try again.',
        );
      }
    },
    onError: err => {
      console.error(
        'IAP: Internal error (fetchProducts/etc):',
        err?.message || err,
      );
    },
  });

  // App Review runs on the US storefront, so a hardcoded "₹359" contradicts the amount on
  // Apple's own purchase sheet — guideline 3.1.2(c) requires the price we SHOW to be the
  // price actually charged. `displayPrice` is StoreKit's already-localised string
  // (currency symbol and formatting included). The ₹ literal survives only as the
  // pre-load fallback, before fetchProducts resolves. Declared below useIAP on purpose:
  // `subscriptions` does not exist above it.
  const storePrice = useCallback(
    (productId, fallback) => {
      const product = subscriptions?.find(
        sub => (sub.productId || sub.id) === productId,
      );
      return product?.displayPrice || `₹${fallback}`;
    },
    [subscriptions],
  );

  const hasStorePrice = useCallback(
    productId =>
      !!subscriptions?.find(sub => (sub.productId || sub.id) === productId)?.displayPrice,
    [subscriptions],
  );

  // Keep ref in sync with latest subscriptions state
  useEffect(() => {
    subscriptionsRef.current = subscriptions;
    if (subscriptions?.length > 0) {
      console.log(
        'IAP: subscriptions updated:',
        subscriptions.map(s => s.productId || s.id),
      );
    } else if (connected) {
      console.log(
        'IAP: subscriptions array is empty (products may not be available in the store)',
      );
    }
  }, [subscriptions, connected]);

  // If selected plan is unavailable from store, fallback to first available plan.
  useEffect(() => {
    if (!loadedProductIds.length) return;
    if (selectedProductAvailable) return;
    const fallback = plansToRender.find(plan =>
      loadedProductIds.includes(plan.productId),
    );
    if (fallback) {
      setSelectedPlan(fallback.title);
    }
  }, [loadedProductIds, selectedProductAvailable, plansToRender]);

  // Fetch subscription once IAP is connected
  useEffect(() => {
    if (connected) {
      console.log('IAP: Connected, fetching:', ALL_SKUS);
      setIsLoadingProducts(true);
      fetchProducts({ skus: ALL_SKUS, type: 'subs' })
        .then(() => {
          // useIAP's fetchProducts resolves to void; subscription details arrive via `subscriptions` state.
          console.log(
            'IAP: fetchProducts (subs) finished; check `subscriptions` state for catalog (not the promise return value).',
          );
          setIsLoadingProducts(false);
        })
        .catch(e => {
          console.error('IAP: fetchProducts error:', JSON.stringify(e));
          setIsLoadingProducts(false);
        });
    }
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  // CuoreCare purchases verify against the CuoreCare backend (staging) via the
  // redux thunk, not the base-premium endpoint. On success we also complete the
  // local premium gate (superset tier) so Essentials features unlock immediately.
  const grantCuoreCare = useCallback(
    async purchase => {
      const payload = {
        platform: Platform.OS,
        productId: purchase.productId,
        plan: cuoreCarePlanFor(purchase.productId),
        purchaseToken: purchase.purchaseToken || purchase.transactionReceipt,
        orderId: purchase.transactionId,
      };
      const res = await dispatch(verifyCuoreCareSubscription(payload));
      if (verifyCuoreCareSubscription.fulfilled.match(res)) {
        try {
          const tokenData = await EncryptedStorage.getItem('auth_tokens');
          if (tokenData) {
            const parsed = JSON.parse(tokenData);
            parsed.paymentStatus = 'completed';
            await EncryptedStorage.setItem(
              'auth_tokens',
              JSON.stringify(parsed),
            );
            dispatch(setUserData(parsed));
          }
        } catch (e) {
          console.warn('Could not persist payment status:', e);
        }
        await dispatch(getCuoreCareStatus());
        setIsProcessingPayment(false);
        alert('You are all set', 'Your CuoreCare subscription is now active.', [
          {
            text: 'Start',
            onPress: () =>
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
          },
        ]);
        return true;
      }
      setIsProcessingPayment(false);
      const kind = res.payload?.payment;
      alert(
        kind === 'expired' ? 'Subscription Expired' : 'Not Activated',
        res.payload?.message ||
          'We could not verify your purchase. If you were charged, tap “Restore Purchases”.',
      );
      return false;
    },
    [dispatch, alert, navigation],
  );

  const handleSuccessfulPurchase = useCallback(
    async purchase => {
      if (isCuoreCareProduct(purchase.productId)) {
        return grantCuoreCare(purchase);
      }
      try {
        const payload = {
          userId,
          platform: Platform.OS,
          productId: purchase.productId,
          duration: getDurationByProductId(purchase.productId),
          purchaseToken: purchase.transactionReceipt || purchase.purchaseToken,
          orderId: purchase.transactionId,
          purchaseTime: purchase.transactionDate,
        };

        console.log('Verifying subscription with backend:', payload);
        const response = await postApiCall(
          EndPoints.VERIFY_SUBSCRIPTION,
          payload,
        );
        console.log(
          'Subscription verify response:',
          response?.status,
          response?.data,
        );

        // Only grant access when the BACKEND confirms an active subscription.
        // (A 200 alone is not enough — the backend returns 200 for expired too.)
        if (isVerifiedActive(response)) {
          try {
            const tokenData = await EncryptedStorage.getItem('auth_tokens');
            if (tokenData) {
              const parsed = JSON.parse(tokenData);
              parsed.paymentStatus = 'completed';
              await EncryptedStorage.setItem(
                'auth_tokens',
                JSON.stringify(parsed),
              );
              dispatch(setUserData(parsed));
            }
          } catch (e) {
            console.warn('Could not persist payment status:', e);
          }
          setIsProcessingPayment(false);
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        } else {
          // Backend says not active (expired / failed / id mismatch) — do NOT
          // grant access off a local store receipt.
          setIsProcessingPayment(false);
          const kind = response?.data?.payment;
          alert(
            kind === 'expired' ? 'Subscription Expired' : 'Not Activated',
            kind === 'expired'
              ? 'This subscription has expired. Please purchase again.'
              : response?.data?.error ||
                  'We could not verify your purchase. If you were charged, tap “Restore Purchases”.',
          );
        }
      } catch (err) {
        console.error('Subscription verify error:', err);
        // The store charge succeeded but our server could not confirm it right
        // now. Do NOT silently grant access (that let expired/forged receipts
        // through) — ask the user to Restore, which re-runs verification.
        setIsProcessingPayment(false);
        alert(
          'Almost There',
          'Your purchase went through, but we could not activate it just now. Please tap “Restore Purchases” in a moment to finish.',
        );
      }
    },
    [navigation, userId, dispatch, getDurationByProductId, grantCuoreCare],
  );

  const handlePlanSelect = planTitle => {
    setSelectedPlan(planTitle);
  };

  const handleRestorePurchases = async () => {
    if (isProcessingPayment) return;

    try {
      setIsProcessingPayment(true);
      console.log('Restore: fetching available purchases from store...');

      const purchases = await getAvailablePurchases({
        onlyIncludeActiveItemsIOS: true,
      });

      console.log('Restore: available purchases:', JSON.stringify(purchases));

      if (!purchases || purchases.length === 0) {
        alert(
          'No Purchases Found',
          'No active subscriptions were found for your account.',
        );
        return;
      }

      const relevantPurchase = purchases.find(p =>
        ALL_SKUS.includes(p.productId),
      );

      if (!relevantPurchase) {
        alert(
          'No Purchases Found',
          'No active subscription for this app was found.',
        );
        return;
      }

      if (isCuoreCareProduct(relevantPurchase.productId)) {
        await grantCuoreCare(relevantPurchase);
        return;
      }

      console.log(
        'Restore: found relevant purchase, verifying with backend...',
      );

      const payload = {
        userId,
        platform: Platform.OS,
        productId: relevantPurchase.productId,
        duration: getDurationByProductId(relevantPurchase.productId),
        purchaseToken:
          relevantPurchase.transactionReceipt || relevantPurchase.purchaseToken,
        orderId: relevantPurchase.transactionId,
        purchaseTime: relevantPurchase.transactionDate,
      };

      console.log('Restore: verify payload:', JSON.stringify(payload));
      const response = await postApiCall(
        EndPoints.VERIFY_SUBSCRIPTION,
        payload,
      );
      console.log(
        'Restore: verify response:',
        response?.status,
        response?.data,
      );

      if (isVerifiedActive(response)) {
        try {
          const tokenData = await EncryptedStorage.getItem('auth_tokens');
          if (tokenData) {
            const parsed = JSON.parse(tokenData);
            parsed.paymentStatus = 'completed';
            await EncryptedStorage.setItem(
              'auth_tokens',
              JSON.stringify(parsed),
            );
            dispatch(setUserData(parsed));
          }
        } catch (e) {
          console.warn('Restore: could not persist payment status:', e);
        }

        alert('Success', 'Your subscription has been restored successfully.', [
          {
            text: 'OK',
            onPress: () =>
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
          },
        ]);
      } else {
        alert(
          'Subscription In Use',
          'This Apple ID subscription is already linked to another account. Please use a different Apple ID or log in with the original account.',
        );
      }
    } catch (err) {
      console.error('Restore purchases error:', err);
      alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCheckout = async () => {
    if (!connected) {
      alert(
        'Not Ready',
        'Payment system is still loading. Please wait a moment.',
      );
      return;
    }

    console.log(
      'IAP: subscriptions state:',
      subscriptions?.map(p => p.productId || p.id),
    );
    console.log('IAP: Attempting purchase for:', selected.productId);

    try {
      setIsProcessingPayment(true);

      if (Platform.OS === 'android') {
        const sku = selected?.productId;
        if (!sku) {
          setIsProcessingPayment(false);
          alert('Unavailable', 'Missing product id for this plan.');
          return;
        }
        const subscription = subscriptions?.find(
          p => (p.productId && p.productId === sku) || p.id === sku,
        );
        const offerToken = subscription
          ? getAndroidOfferToken(subscription)
          : null;
        const purchaseSku = subscription?.id ?? subscription?.productId ?? sku;
        console.log(
          'IAP: Android purchase sku:',
          purchaseSku,
          'offerToken:',
          !!offerToken,
        );
        if (!offerToken) {
          setIsProcessingPayment(false);
          alert(
            'Unavailable',
            'No valid subscription offer for this plan. Check the product is active with a base plan and price, then try again.',
          );
          return;
        }
        await iapRequestPurchase({
          type: 'subs',
          request: {
            google: {
              skus: [purchaseSku],
              subscriptionOffers: [{ sku: purchaseSku, offerToken }],
            },
          },
        });
      } else {
        // iOS — ensure subscription is fetched before purchase
        if (
          !subscriptionsRef.current ||
          subscriptionsRef.current.length === 0
        ) {
          console.log(
            'IAP: subscriptions empty, re-fetching before purchase...',
          );
          await fetchProducts({ skus: [selected.productId], type: 'subs' });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log(
          'IAP: subscriptions after fetch:',
          subscriptionsRef.current?.length,
        );
        // Guard: abort if product still not loaded (not configured in App Store Connect)
        if (
          !subscriptionsRef.current ||
          subscriptionsRef.current.length === 0
        ) {
          setIsProcessingPayment(false);
          alert(
            'Product Unavailable',
            'The subscription could not be loaded from the App Store. Please check your internet connection and try again.',
          );
          return;
        }
        await iapRequestPurchase({
          type: 'subs',
          request: {
            apple: { sku: selected.productId },
          },
        });
      }
    } catch (err) {
      console.error('IAP: iapRequestPurchase error:', err);
      setIsProcessingPayment(false);
      if (err.code !== 'E_USER_CANCELLED') {
        alert('Purchase Error', err.message || 'Failed to start purchase.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {AlertComponent}

          {/* Header */}
          <View style={{ backgroundColor: '#FFFFFF', paddingTop: hp(2) }}>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={{
                  marginTop: Platform.OS === 'ios' ? hp(0) : 0,
                  marginBottom: hp(2),
                }}
                onPress={async () => {
                  try {
                    await EncryptedStorage.removeItem('auth_tokens');
                  } catch (_) {}
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                }}
              >
                <Image
                  source={Images.BACK_BUTTON}
                  style={{
                    height: hp(3.5),
                    width: wp(4),
                    marginLeft: hp(2),
                    tintColor: '#000',
                  }}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <Text style={styles.title}>Checkout</Text>
            </View>

            {/* <Text style={[styles.notice, { textAlign: 'center' }]}>
              Remote supervision is billed separately by the doctor, & does not
              include consultation
            </Text> */}
          </View>

          <View style={styles.container}>
            {/* Offer */}
            {/* <View style={styles.offerBanner}>
              <Text style={styles.offerText}>Launch Offer · Ends 31 March</Text>
            </View> */}

            {/* Plan Selection — two tiers */}
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            {TIERS.map(tier => {
              const tierPlans =
                connected && loadedProductIds.length > 0
                  ? tier.plans.filter(p =>
                      loadedProductIds.includes(p.productId),
                    )
                  : tier.plans;
              if (!tierPlans.length) return null;
              return (
                <View key={tier.key} style={styles.tierBlock}>
                  <Text style={styles.tierLabel}>{tier.label}</Text>
                  <Text style={styles.tierCaption}>{tier.caption}</Text>
                  <View style={styles.planSelectorRow}>
                    {tierPlans.map(plan => {
                      const active = selectedPlan === plan.title;
                      return (
                        <TouchableOpacity
                          key={plan.productId}
                          onPress={() => handlePlanSelect(plan.title)}
                          style={[
                            styles.planSelectorChip,
                            active && styles.planSelectorChipActive,
                          ]}
                          activeOpacity={0.8}
                        >
                          {plan.topPick && (
                            <View style={styles.recommendBadge}>
                              <Text style={styles.recommendBadgeText}>
                                Recommended
                              </Text>
                            </View>
                          )}
                          <Text
                            style={[
                              styles.planSelectorTitle,
                              active && styles.planSelectorTitleActive,
                            ]}
                          >
                            {plan.duration}
                          </Text>
                          <Text
                            style={[
                              styles.planSelectorPrice,
                              active && styles.planSelectorPriceActive,
                            ]}
                          >
                            {storePrice(plan.productId, plan.newPrice)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {/* Selected Plan Summary */}
            <View style={styles.selectedPlanCard}>
              <Text style={styles.selectedPlanTitle}>{selected.title}</Text>
              <Text style={styles.selectedPlanSubtitle}>
                {selected.subtitle}
              </Text>
              <Text style={styles.selectedPlanDuration}>
                Duration: {selected.duration} · Auto-renews{' '}
                {selected.duration === '1 Month'
                  ? 'monthly'
                  : selected.duration === '3 Months'
                  ? 'quarterly'
                  : 'annually'}
              </Text>

              <View style={styles.priceRow}>
                {selected.oldPrice && !hasStorePrice(selected.productId) ? (
                  <Text style={styles.priceOld}>₹{selected.oldPrice}</Text>
                ) : (
                  <View />
                )}
                <Text style={styles.priceNew}>
                  {storePrice(selected.productId, selected.newPrice)}
                </Text>
              </View>

              {/* What's included */}
              <View style={styles.featuresDivider} />
              <Text style={styles.featuresHeading}>What you get</Text>
              {(FEATURES[selected.tier] || FEATURES.allaccess).map(item => (
                <View key={item.title} style={styles.featureRow}>
                  <Text style={styles.featureCheck}>✓</Text>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>{item.title}</Text>
                    <Text style={styles.featureDescription}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Payment Method */}
            {/* <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentMethodCard}>
          <View style={styles.paymentOption}>
            <View style={styles.radioSelected}>
              <View style={styles.radioInner} />
            </View>
            <Text style={styles.cardIcon}>💳</Text>
            <Text style={styles.paymentMethodText}>Credit/Debit Card</Text>
          </View>

          <View style={[styles.paymentOption, { marginTop: hp(1.5) }]}>
            <View style={styles.radioUnselected} />
            <Text style={styles.upiIcon}>📱</Text>
            <Text style={styles.paymentMethodText}>UPI</Text>
          </View>
        </View> */}

            {/* Payment Method */}
            {/* <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentMethodCard}>
              <View style={styles.paymentOption}>
                <View style={styles.radioSelected}>
                  <View style={styles.radioInner} />
                </View>
                <Image source={Images.APPLE_PAY} style={styles.paymentIcon} />
                <Text style={styles.paymentMethodText}>
                  Apple Pay / Google Pay
                </Text>
              </View>

              <View style={[styles.paymentOption, { marginTop: hp(1.5) }]}>
                <View style={styles.radioUnselected} />
                <Image source={Images.CREDIT_CARD} style={styles.paymentIcon} />
                <Text style={styles.paymentMethodText}>Credit/Debit Card</Text>
              </View>
            </View> */}

            {/* Checkout Button */}
            <TouchableOpacity
              onPress={handleCheckout}
              style={[
                styles.checkoutButton,
                (isProcessingPayment ||
                  !connected ||
                  isLoadingProducts ||
                  (loadedProductIds.length > 0 && !selectedProductAvailable)) &&
                  styles.checkoutButtonDisabled,
              ]}
              disabled={
                isProcessingPayment ||
                !connected ||
                isLoadingProducts ||
                (loadedProductIds.length > 0 && !selectedProductAvailable)
              }
            >
              {isProcessingPayment ? (
                <>
                  <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.checkoutText}>Processing...</Text>
                </>
              ) : (
                <>
                  <Image source={Images.LOCK} style={styles.lockIcon} />
                  <Text style={styles.checkoutText}>Subscribe Now</Text>
                </>
              )}
            </TouchableOpacity>

            {/* IAP Status */}
            {(!connected || isLoadingProducts) && (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="small" color="#11418A" />
                <Text style={styles.statusText}>
                  {!connected
                    ? 'Setting up secure payment...'
                    : 'Loading subscription...'}
                </Text>
              </View>
            )}
            {!isLoadingProducts &&
              connected &&
              !selectedProductAvailable &&
              loadedProductIds.length > 0 && (
                <View style={styles.statusContainer}>
                  <Text style={styles.statusText}>
                    Selected plan is not available in the store yet.
                  </Text>
                </View>
              )}

            {/* Security Badge */}
            <View style={styles.sslBadge}>
              <Image source={Images.SECURE} style={styles.secureIcon} />
              <Text style={styles.sslText}>100% Secure In-App Purchase</Text>
            </View>

            {/* Restore Purchases Button (iOS only) */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                onPress={handleRestorePurchases}
                style={styles.restoreButton}
                disabled={isProcessingPayment}
              >
                <Text style={styles.restoreButtonText}>Restore Purchases</Text>
              </TouchableOpacity>
            )}

            {/* IAP Footer with Terms & Privacy Links */}
            <View style={styles.iapFooter}>
              <Text style={styles.iapFooterText}>
                Subscriptions will be charged to your{' '}
                {Platform.OS === 'ios' ? 'Apple ID' : 'Google Account'} at
                confirmation of purchase.
              </Text>
              <Text style={styles.iapFooterText}>
                Subscription automatically renews unless auto-renew is turned
                off at least 24-hours before the end of the current period.
              </Text>
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  onPress={() => Linking.openURL('https://cuore.health/terms')}
                >
                  <Text style={styles.termsLink}>Terms of Use</Text>
                </TouchableOpacity>
                <Text style={styles.linkSeparator}> • </Text>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL('https://cuore.health/privacy')
                  }
                >
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: wp(4), backgroundColor: '#F8FAFC' },
  title: {
    fontFamily: 'Poppins-Medium',
    marginTop: hp(2),
    marginLeft: hp(13),
    fontSize: 20,
    marginBottom: hp(2),
    color: '#1E293B',
    alignSelf: 'center',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  header: {
    fontFamily: 'Poppins-Medium',
    fontSize: 22,
    marginVertical: hp(1),
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  subheader: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#64748B',
    marginBottom: hp(2),
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#1E293B',
    marginBottom: hp(1.5),
    letterSpacing: -0.3,
  },
  planSelectorRow: {
    flexDirection: 'row',
    gap: wp(2.5),
    marginBottom: hp(1.5),
  },
  tierBlock: {
    marginBottom: hp(1),
  },
  tierLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#11418A',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  tierCaption: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748B',
    marginBottom: hp(1),
  },
  recommendBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  recommendBadgeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  planSelectorChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
  },
  planSelectorChipActive: {
    borderColor: '#11418A',
    backgroundColor: '#EFF6FF',
  },
  planSelectorTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#334155',
  },
  planSelectorTitleActive: {
    color: '#11418A',
  },
  planSelectorPrice: {
    marginTop: hp(0.2),
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748B',
  },
  planSelectorPriceActive: {
    color: '#11418A',
  },
  planContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planBox: {
    width: '90%',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: hp(2),
    marginBottom: hp(2),
    backgroundColor: '#FFFFFF',
  },
  selectedBox: {
    borderColor: '#11418A',
    backgroundColor: '#EFF6FF',
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  discount: {
    fontFamily: 'Poppins-Medium',
    color: '#DC2626',
    fontSize: 15,
    marginLeft: hp(4),
    letterSpacing: 0.2,
  },
  topPick: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    fontSize: 13,
    position: 'absolute',
    backgroundColor: '#10B981',
    padding: hp(1),
    borderRadius: hp(2),
    top: 7,
    letterSpacing: 0.5,
  },
  planTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#11418A',
    marginLeft: hp(12),
    marginVertical: hp(1),
    letterSpacing: -0.2,
  },
  planSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#64748B',
    numberOfLines: 2,
    width: '60%',
    letterSpacing: 0.2,
  },
  planDuration: {
    position: 'absolute',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#64748B',
    top: hp(11),
    marginTop: hp(1),
    left: hp(2),
    letterSpacing: 0.2,
  },
  priceOld: {
    fontFamily: 'Poppins-Regular',
    textDecorationLine: 'line-through',
    color: '#94A3B8',
    fontSize: 20,
    alignSelf: 'flex-end',
    letterSpacing: 0.2,
  },
  priceNew: {
    fontFamily: 'Poppins-Medium',
    fontSize: 26,
    color: '#1E293B',
    alignSelf: 'flex-end',
    marginLeft: hp(10),
    letterSpacing: -0.5,
  },
  dailyPrice: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#11418A',
    letterSpacing: 0.2,
  },
  summaryBox: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: hp(2),
    marginBottom: hp(2),
    backgroundColor: '#FFFFFF',
  },
  promoBox: {
    flexDirection: 'row',
    marginVertical: hp(1),
  },
  promoInput: {
    flex: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    fontFamily: 'Poppins-Regular',
  },
  applyButton: {
    backgroundColor: '#11418A',
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  applyText: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  checkboxRow: {
    padding: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  checkboxText: {
    marginLeft: hp(1),
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#475569',
    letterSpacing: 0.2,
  },
  checkoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#11418A',
    padding: hp(2),
    borderRadius: 12,
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.7,
  },
  checkoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.5,
  },
  offerBanner: {
    backgroundColor: '#F1F5F9',
    padding: hp(1.5),
    borderRadius: 12,
    marginBottom: hp(2),
    alignItems: 'center',
  },
  offerText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1E293B',
    letterSpacing: 0.3,
  },
  selectedPlanCard: {
    backgroundColor: '#FFFFFF',
    padding: hp(2.5),
    borderRadius: 12,
    marginBottom: hp(3),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  selectedPlanTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 20,
    color: '#11418A',
    marginBottom: hp(0.5),
    letterSpacing: -0.3,
  },
  selectedPlanSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#64748B',
    marginBottom: hp(1.5),
    letterSpacing: 0.2,
  },
  selectedPlanDuration: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#475569',
    marginBottom: hp(1),
    letterSpacing: 0.2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  paymentMethodCard: {
    backgroundColor: '#FFFFFF',
    padding: hp(2),
    borderRadius: 12,
    marginBottom: hp(3),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#11418A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: hp(1),
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#11418A',
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: hp(1),
  },
  cardIcon: {
    fontSize: 20,
    marginRight: hp(1),
  },
  upiIcon: {
    fontSize: 20,
    marginRight: hp(1),
  },
  paymentMethodText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#475569',
    letterSpacing: 0.2,
  },
  orderSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  dropdownIcon: {
    width: 16,
    height: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  summaryText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#475569',
    letterSpacing: 0.2,
  },
  totalRow: {
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingTop: hp(1.5),
    marginTop: hp(0.5),
  },
  totalText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  lockIcon: {
    width: 16,
    height: 16,
    marginRight: hp(1),
  },
  sslBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(2),
    marginBottom: hp(4),
  },
  secureIcon: {
    width: 16,
    height: 16,
    marginRight: hp(0.5),
  },
  sslText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#64748B',
    letterSpacing: 0.2,
  },
  ssl: {
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginTop: hp(1),
    color: '#94A3B8',
    letterSpacing: 0.1,
  },
  faqSection: {
    borderWidth: 2,
    padding: hp(2),
    marginTop: hp(2),
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderColor: '#E2E8F0',
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  discountBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: hp(1.2),
    paddingVertical: hp(0.6),
    borderRadius: 8,
  },
  discountBadgeSelected: {
    backgroundColor: '#FECACA',
  },
  selectedPlanTitleText: {
    color: '#11418A',
  },
  selectedText: {
    color: '#11418A',
  },
  topPickPlan: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  paymentIcon: {
    width: 24,
    height: 24,
    marginRight: hp(1),
    resizeMode: 'contain',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2),
    padding: hp(1),
  },
  statusText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#64748B',
    marginLeft: hp(1),
    letterSpacing: 0.2,
  },
  iapFooter: {
    backgroundColor: '#F8FAFC',
    padding: hp(2),
    borderRadius: 12,
    marginTop: hp(2),
    marginBottom: hp(4),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iapFooterText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748B',
    marginBottom: hp(1),
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  restoreButton: {
    alignSelf: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
  },
  restoreButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#11418A',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  termsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(1),
    flexWrap: 'wrap',
  },
  termsLink: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#11418A',
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748B',
  },
  featuresDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: hp(1.5),
  },
  featuresHeading: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1E293B',
    marginBottom: hp(1),
    letterSpacing: 0.2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(0.8),
  },
  featureCheck: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#10B981',
    marginRight: hp(1),
    lineHeight: 20,
  },
  featureText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#475569',
    flex: 1,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  featureTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 2,
  },

  featureDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});

export default Checkout;
