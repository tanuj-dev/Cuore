import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
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
  IAP_SUBSCRIPTION_ID,
  IAP_GST_RATE,
  IAP_PLANS,
} from '../../utilities/Constants';

const Checkout = ({ navigation }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const dispatch = useDispatch();
  const [selectedPlan, setSelectedPlan] = useState('Thrive');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const { alert, AlertComponent } = useCustomAlert();
  const userId = useSelector(state => state.auth?.userId);

  const selected = IAP_PLANS.find(p => p.title === selectedPlan);
  const gstAmount = selected ? selected.newPrice * IAP_GST_RATE : 0;

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
      console.error('IAP: Purchase error:', err);
      setIsProcessingPayment(false);

      if (err.code === 'already-owned' || err.code === 'E_ALREADY_OWNED') {
        console.log('IAP: Item already owned, verifying with backend...');
        try {
          const purchases = await getAvailablePurchases({
            onlyIncludeActiveItemsIOS: true,
          });
          const relevantPurchase = purchases?.find(
            p => p.productId === IAP_SUBSCRIPTION_ID,
          );

          if (relevantPurchase) {
            const payload = {
              userId,
              platform: Platform.OS,
              productId: relevantPurchase.productId,
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

            if (response?.status === 200) {
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

  // Fetch subscription once IAP is connected
  useEffect(() => {
    if (connected) {
      console.log('IAP: Connected, fetching:', IAP_SUBSCRIPTION_ID);
      setIsLoadingProducts(true);
      fetchProducts({ skus: [IAP_SUBSCRIPTION_ID], type: 'subs' })
        .then(result => {
          console.log(
            'IAP: fetchProducts (subs) done, result:',
            JSON.stringify(result),
          );
          setIsLoadingProducts(false);
        })
        .catch(e => {
          console.error('IAP: fetchProducts error:', JSON.stringify(e));
          setIsLoadingProducts(false);
        });
    }
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSuccessfulPurchase = useCallback(
    async purchase => {
      try {
        const payload = {
          userId,
          platform: Platform.OS,
          productId: purchase.productId,
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

        // Persist payment status and navigate to Home
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
      } catch (err) {
        console.error('Subscription verify error:', err);
        // Payment was successful with Apple/Google, persist status and navigate even if backend fails
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
      }
    },
    [navigation, userId, dispatch],
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

      const relevantPurchase = purchases.find(
        p => p.productId === IAP_SUBSCRIPTION_ID,
      );

      if (!relevantPurchase) {
        alert(
          'No Purchases Found',
          'No active subscription for this app was found.',
        );
        return;
      }

      console.log(
        'Restore: found relevant purchase, verifying with backend...',
      );

      const payload = {
        userId,
        platform: Platform.OS,
        productId: relevantPurchase.productId,
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

      if (response?.status === 200) {
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
      subscriptions?.map(p => p.productId),
    );
    console.log('IAP: Attempting purchase for:', selected.productId);

    try {
      setIsProcessingPayment(true);

      if (Platform.OS === 'android') {
        const subscription = subscriptions?.find(
          p =>
            p.productId === selected.productId || p.id === selected.productId,
        );
        const offerToken =
          subscription?.subscriptionOfferDetailsAndroid?.[0]?.offerToken;
        console.log('IAP: Android offerToken:', offerToken);
        if (!offerToken) {
          setIsProcessingPayment(false);
          alert('Unavailable', 'No valid offer found. Please try again later.');
          return;
        }
        await iapRequestPurchase({
          type: 'subs',
          request: {
            android: {
              skus: [selected.productId],
              subscriptionOffers: [{ sku: selected.productId, offerToken }],
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

            {/* Plan Selection */}
            {/* <Text style={styles.sectionTitle}>Choose Your Plan</Text> */}

            {/* Selected Plan Summary */}
            <View style={styles.selectedPlanCard}>
              <Text style={styles.selectedPlanTitle}>{selected.title}</Text>
              <Text style={styles.selectedPlanSubtitle}>
                {selected.subtitle}
              </Text>
              <Text style={styles.selectedPlanDuration}>
                Duration: {selected.duration} · Auto-renews annually
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceOld}>₹{selected.oldPrice}</Text>
                <Text style={styles.priceNew}>₹{selected.newPrice}</Text>
              </View>

              {/* What's included */}
              <View style={styles.featuresDivider} />
              <Text style={styles.featuresHeading}>What you get</Text>
              {[
                {
                  title: 'Track & stay consistent',
                  desc: 'Track BP, sugar, daily guidance',
                },
                {
                  title: 'Understand your health clearly',
                  desc: 'Clear trends, insights, simple summaries',
                },
                {
                  title: 'Be prepared & stay ahead',
                  desc: 'Doctor updates, alerts, records organized',
                },
              ].map(item => (
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

            {/* Order Summary */}
            {/* <Text style={styles.sectionTitle}>Order Summary</Text> */}

            {/* <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>
                  {selected?.title ?? 'Plan'} Plan
                </Text>
                <Text style={styles.summaryText}>
                  ₹{(selected ? selected.newPrice - gstAmount : 0).toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>GST 18%</Text>
                <Text style={styles.summaryText}>₹{gstAmount.toFixed(2)}</Text>
              </View>

              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalText}>Total</Text>
                <Text style={styles.totalText}>₹{totalAmount.toFixed(2)}</Text>
              </View>
            </View> */}

            {/* Checkout Button */}
            <TouchableOpacity
              onPress={handleCheckout}
              style={[
                styles.checkoutButton,
                (isProcessingPayment || !connected || isLoadingProducts) &&
                  styles.checkoutButtonDisabled,
              ]}
              disabled={isProcessingPayment || !connected || isLoadingProducts}
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

const createStyles = c => StyleSheet.create({
  container: { padding: wp(4), backgroundColor: c.surface },
  title: {
    fontFamily: 'Poppins-Medium',
    marginTop: hp(2),
    marginLeft: hp(13),
    fontSize: 20,
    marginBottom: hp(2),
    color: c.text,
    alignSelf: 'center',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  header: {
    fontFamily: 'Poppins-Medium',
    fontSize: 22,
    marginVertical: hp(1),
    color: c.text,
    letterSpacing: -0.3,
  },
  subheader: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.subText,
    marginBottom: hp(2),
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: c.text,
    marginBottom: hp(1.5),
    letterSpacing: -0.3,
  },
  planContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planBox: {
    width: '90%',
    borderWidth: 2,
    borderColor: c.border,
    borderRadius: 12,
    padding: hp(2),
    marginBottom: hp(2),
    backgroundColor: c.card,
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
    color: c.card,
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
    color: c.primary,
    marginLeft: hp(12),
    marginVertical: hp(1),
    letterSpacing: -0.2,
  },
  planSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.subText,
    numberOfLines: 2,
    width: '60%',
    letterSpacing: 0.2,
  },
  planDuration: {
    position: 'absolute',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.subText,
    top: hp(11),
    marginTop: hp(1),
    left: hp(2),
    letterSpacing: 0.2,
  },
  priceOld: {
    fontFamily: 'Poppins-Regular',
    textDecorationLine: 'line-through',
    color: c.tabInactive,
    fontSize: 20,
    alignSelf: 'flex-end',
    letterSpacing: 0.2,
  },
  priceNew: {
    fontFamily: 'Poppins-Medium',
    fontSize: 26,
    color: c.text,
    alignSelf: 'flex-end',
    marginLeft: hp(10),
    letterSpacing: -0.5,
  },
  dailyPrice: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.primary,
    letterSpacing: 0.2,
  },
  summaryBox: {
    borderWidth: 1.5,
    borderColor: c.border,
    borderRadius: 12,
    padding: hp(2),
    marginBottom: hp(2),
    backgroundColor: c.card,
  },
  promoBox: {
    flexDirection: 'row',
    marginVertical: hp(1),
  },
  promoInput: {
    flex: 1,
    borderColor: c.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: c.surface,
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
    color: c.card,
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
    color: c.subText,
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
    color: c.card,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.5,
  },
  offerBanner: {
    backgroundColor: c.mutedSurface,
    padding: hp(1.5),
    borderRadius: 12,
    marginBottom: hp(2),
    alignItems: 'center',
  },
  offerText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: c.text,
    letterSpacing: 0.3,
  },
  selectedPlanCard: {
    backgroundColor: c.card,
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
    color: c.primary,
    marginBottom: hp(0.5),
    letterSpacing: -0.3,
  },
  selectedPlanSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.subText,
    marginBottom: hp(1.5),
    letterSpacing: 0.2,
  },
  selectedPlanDuration: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.subText,
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
    backgroundColor: c.card,
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
    color: c.subText,
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
    color: c.subText,
    letterSpacing: 0.2,
  },
  totalRow: {
    borderTopWidth: 1,
    borderColor: c.border,
    paddingTop: hp(1.5),
    marginTop: hp(0.5),
  },
  totalText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: c.text,
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
    color: c.subText,
    letterSpacing: 0.2,
  },
  ssl: {
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginTop: hp(1),
    color: c.tabInactive,
    letterSpacing: 0.1,
  },
  faqSection: {
    borderWidth: 2,
    padding: hp(2),
    marginTop: hp(2),
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderColor: c.border,
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
    color: c.primary,
  },
  selectedText: {
    color: c.primary,
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
    color: c.subText,
    marginLeft: hp(1),
    letterSpacing: 0.2,
  },
  iapFooter: {
    backgroundColor: c.surface,
    padding: hp(2),
    borderRadius: 12,
    marginTop: hp(2),
    marginBottom: hp(4),
    borderWidth: 1,
    borderColor: c.border,
  },
  iapFooterText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: c.subText,
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
    color: c.primary,
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
    color: c.primary,
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: c.subText,
  },
  featuresDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: hp(1.5),
  },
  featuresHeading: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: c.text,
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
    color: c.subText,
    flex: 1,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  featureTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: c.text,
    marginBottom: 2,
  },

  featureDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: c.subText,
    lineHeight: 18,
  },
});

export default Checkout;
