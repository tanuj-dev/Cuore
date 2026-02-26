import React, { useState, useEffect, useCallback } from 'react';
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
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
} from 'react-native-iap';
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
  const dispatch = useDispatch();
  const [selectedPlan, setSelectedPlan] = useState('Thrive');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [products, setProducts] = useState([]);
  const [isIAPInitialized, setIsIAPInitialized] = useState(false);
  const { alert, AlertComponent } = useCustomAlert();
  const userId = useSelector(state => state.auth?.userId);

  const selected = IAP_PLANS.find(p => p.title === selectedPlan);
  const gstAmount = selected ? selected.newPrice * IAP_GST_RATE : 0;

  // Initialize IAP connection
  useEffect(() => {
    let purchaseUpdateSub = null;
    let purchaseErrorSub = null;

    const initIAP = async () => {
      try {
        await initConnection();

        // v14 API: fetchProducts with type 'subs'
        const subs = await fetchProducts({
          skus: [IAP_SUBSCRIPTION_ID],
          type: 'subs',
        });
        console.log('Subscriptions fetched:', JSON.stringify(subs));
        setProducts(subs);
        setIsIAPInitialized(true);

        // Listen for successful purchases
        purchaseUpdateSub = purchaseUpdatedListener(async purchase => {
          console.log('Purchase updated:', purchase);
          try {
            await finishTransaction({ purchase, isConsumable: false });
            handleSuccessfulPurchase(purchase);
          } catch (err) {
            console.error('Finish transaction error:', err);
            alert(
              'Purchase Error',
              'Could not complete your purchase. Please try again.',
            );
          }
        });

        // Listen for purchase errors
        purchaseErrorSub = purchaseErrorListener(err => {
          console.error('Purchase error:', err);
          setIsProcessingPayment(false);
          if (err.code !== 'E_USER_CANCELLED') {
            alert(
              'Purchase Failed',
              err.message || 'Something went wrong. Please try again.',
            );
          }
        });
      } catch (err) {
        console.error('IAP init error:', err);
        if (!__DEV__) {
          alert(
            'Payment Error',
            `Code: ${err?.code || 'unknown'}\n${
              err?.message || 'Failed to set up payment.'
            }`,
          );
        }
      }
    };

    initIAP();

    return () => {
      purchaseUpdateSub?.remove();
      purchaseErrorSub?.remove();
      endConnection();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

        if (response?.status === 200 || response?.status === 201) {
          console.log('Subscription verified successfully');
          // Handle successful verification
          const verificationData = response.data;
          if (verificationData?.payment === 'done') {
            console.log(
              'Payment confirmed, expiry date:',
              verificationData.expiryDate,
            );
            // Persist payment status so Score/Splash see completed state
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
            // Show success alert after successful verification
            alert(
              'Subscription Active!',
              'Thank you for subscribing to Cuore. Your account has been upgraded.',
              [
                {
                  text: 'Get Started',
                  onPress: () =>
                    navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
                },
              ],
            );
          }
        } else {
          console.warn('Subscription verify failed:', response?.data?.message);
          throw new Error(response?.data?.message || 'Verification failed');
        }
      } catch (err) {
        console.error('Subscription verify error:', err);
        throw err; // Re-throw to be caught by the outer catch block
      }
    },
    [navigation, alert, userId, dispatch],
  );

  const handlePlanSelect = planTitle => {
    setSelectedPlan(planTitle);
  };

  const handleRestorePurchases = async () => {
    if (isProcessingPayment) return;

    try {
      setIsProcessingPayment(true);

      // For iOS, we can check existing purchases
      if (Platform.OS === 'ios') {
        // In a real implementation, you would check for existing purchases
        // and restore them if found
        console.log('Restoring purchases for iOS');

        // Simulate API call to restore purchases
        const response = await postApiCall(EndPoints.RESTORE_PURCHASES, {
          userId,
          platform: 'ios',
        });

        if (response?.status === 200) {
          alert('Success', 'Your purchases have been restored successfully.', [
            {
              text: 'OK',
              onPress: () =>
                navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
            },
          ]);
        } else {
          alert(
            'No Purchases Found',
            'No previous purchases were found for your account.',
          );
        }
      }
    } catch (err) {
      console.error('Restore purchases error:', err);
      alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCheckout = async () => {
    if (__DEV__) {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      return;
    }

    if (!isIAPInitialized) {
      alert(
        'Not Ready',
        'Payment system is still loading. Please wait a moment.',
      );
      return;
    }

    // v14 uses `id` as the primary field (not `productId`)
    const subscription = products.find(
      p => p.id === selected.productId || p.productId === selected.productId,
    );
    console.log(
      'Products in state:',
      products.map(p => ({ id: p.id, productId: p.productId })),
    );
    console.log('Looking for:', selected.productId, '| Found:', !!subscription);

    if (!subscription) {
      alert(
        'Unavailable',
        'This subscription is not available right now. Please try again later.',
      );
      return;
    }

    try {
      setIsProcessingPayment(true);

      if (Platform.OS === 'android') {
        // v14 API: subscriptionOfferDetailsAndroid holds offer tokens
        const offerToken =
          subscription?.subscriptionOfferDetailsAndroid?.[0]?.offerToken;

        console.log('offerToken:', offerToken);

        if (!offerToken) {
          setIsProcessingPayment(false);
          alert(
            'Unavailable',
            'No valid offer found for this subscription. Please try again later.',
          );
          return;
        }

        // v14 API: requestPurchase replaces requestSubscription
        await requestPurchase({
          type: 'subs',
          request: {
            android: {
              skus: [selected.productId],
              subscriptionOffers: [{ sku: selected.productId, offerToken }],
            },
          },
        });
      } else {
        // iOS
        await requestPurchase({
          type: 'subs',
          request: {
            apple: { sku: selected.productId },
          },
        });
      }
    } catch (err) {
      console.error('Purchase request error:', err);
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
                onPress={() => navigation.goBack()}
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
                Duration: {selected.duration}
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceOld}>₹{selected.oldPrice}</Text>
                <Text style={styles.priceNew}>₹{selected.newPrice}</Text>
              </View>
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
                (isProcessingPayment || (!__DEV__ && !isIAPInitialized)) &&
                  styles.checkoutButtonDisabled,
              ]}
              disabled={isProcessingPayment || (!__DEV__ && !isIAPInitialized)}
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
            {!__DEV__ && !isIAPInitialized && (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="small" color="#11418A" />
                <Text style={styles.statusText}>
                  Setting up secure payment...
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
});

export default Checkout;
