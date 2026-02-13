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
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases,
  validateReceiptIos,
  validateReceiptAndroid,
  flushFailedPurchasesCachedAsPendingAndroid,
} from 'react-native-iap';
import { hp, wp, Images } from '../../utilities';
import { useCustomAlert } from '../../hooks/useCustomAlert';

// IAP Product IDs - These should match your App Store/Play Store product IDs
const PRODUCT_IDS = [
  'com.cuore.stabilise', // 3 Months
  'com.cuore.progress', // 6 Months
  'com.cuore.thrive', // 12 Months
];

// Map IAP products to UI plans
const plans = [
  {
    title: 'Cuore Annual',
    subtitle: 'Complete health and wellness program',
    duration: '12 Months',
    oldPrice: 1999,
    newPrice: 1499,
    daily: ' ₹4.1/day',
    discount: '25%',
    productId: 'com.cuore.annual',
    topPick: true,
  },
];

const Checkout = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState('Cuore Annual');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [products, setProducts] = useState([]);
  const [isIAPInitialized, setIsIAPInitialized] = useState(false);
  const { alert, AlertComponent } = useCustomAlert();

  const selected = plans.find(p => p.title === selectedPlan);
  const GST = 0.18;
  const gstAmount = selected ? selected.newPrice * GST : 0;
  const totalAmount = selected ? selected.newPrice + gstAmount : 0;

  // Initialize IAP connection
  // useEffect(() => {
  //   const initIAP = async () => {
  //     try {
  //       const result = await initConnection();
  //       console.log('IAP Connection Result:', result);

  //       if (result) {
  //         // Flush failed purchases for Android
  //         if (Platform.OS === 'android') {
  //           await flushFailedPurchasesCachedAsPendingAndroid();
  //         }

  //         // Get available products
  //         const availableProducts = await getProducts({ skus: PRODUCT_IDS });
  //         console.log('Available Products:', availableProducts);
  //         setProducts(availableProducts);
  //         setIsIAPInitialized(true);

  //         // Listen for purchase updates
  //         purchaseUpdatedListener(async purchase => {
  //           console.log('Purchase Updated:', purchase);
  //           try {
  //             // Validate receipt
  //             let receiptValidationResult;
  //             if (Platform.OS === 'ios') {
  //               receiptValidationResult = await validateReceiptIos(
  //                 {
  //                   'receipt-data': purchase.transactionReceipt,
  //                   password: 'YOUR_SHARED_SECRET', // Add your Apple Shared Secret
  //                 },
  //                 __DEV__,
  //               );
  //             } else {
  //               receiptValidationResult = await validateReceiptAndroid(
  //                 {
  //                   packageName: 'com.cuore',
  //                   productId: purchase.productId,
  //                   purchaseToken: purchase.purchaseToken,
  //                   subscription: false,
  //                 },
  //                 'YOUR_GOOGLE_SERVICE_ACCOUNT', // Add your Google Service Account
  //               );
  //             }

  //             console.log('Receipt Validation:', receiptValidationResult);

  //             // Finish the transaction
  //             await finishTransaction({ purchase, isConsumable: false });

  //             // Handle successful purchase
  //             handleSuccessfulPurchase(purchase);
  //           } catch (error) {
  //             console.error('Purchase validation error:', error);
  //             Alert.alert(
  //               'Purchase Error',
  //               'There was an error validating your purchase.',
  //             );
  //           }
  //         });

  //         // Listen for purchase errors
  //         purchaseErrorListener(error => {
  //           console.error('Purchase Error:', error);
  //           setIsProcessingPayment(false);
  //           Alert.alert(
  //             'Purchase Failed',
  //             error.message || 'There was an error processing your purchase.',
  //           );
  //         });
  //       }
  //     } catch (error) {
  //       console.error('IAP Initialization Error:', error);
  //       Alert.alert(
  //         'Error',
  //         'Failed to initialize payment system. Please try again.',
  //       );
  //     }
  //   };

  //   initIAP();

  //   // Cleanup
  //   return () => {
  //     endConnection();
  //   };
  // }, []);

  // Handle successful purchase
  // const handleSuccessfulPurchase = useCallback(
  //   purchase => {
  //     setIsProcessingPayment(false);
  //     Alert.alert(
  //       'Purchase Successful',
  //       'Thank you for your subscription! Your account has been upgraded.',
  //       [
  //         {
  //           text: 'OK',
  //           onPress: () => {
  //             // Navigate to appropriate screen after successful purchase
  //             navigation.reset({
  //               index: 0,
  //               routes: [{ name: 'Home' }],
  //             });
  //           },
  //         },
  //       ],
  //     );
  //   },
  //   [navigation],
  // );

  const handlePlanSelect = planTitle => {
    setSelectedPlan(planTitle);
  };

  const handleCheckout = async () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });

    // if (!isIAPInitialized) {
    //   Alert.alert('Error', 'Payment system is not ready. Please try again.');
    //   return;
    // }

    // try {
    //   setIsProcessingPayment(true);

    //   // Find the product for the selected plan
    //   const product = products.find(p => p.productId === selected.productId);

    //   if (!product) {
    //     throw new Error('Product not found');
    //   }

    //   console.log('Requesting purchase for:', product.productId);

    //   // Request purchase
    //   await requestPurchase({ sku: product.productId });

    //   // The purchase listener will handle the success/failure

    // } catch (error) {
    //   console.error('Purchase Request Error:', error);
    //   setIsProcessingPayment(false);
    //   Alert.alert('Purchase Error', error.message || 'Failed to initiate purchase.');
    // }
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
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            <View style={styles.planContainer}>
              {plans.map(plan => {
                const isSelected = plan.title === selectedPlan;
                return (
                  <TouchableOpacity
                    key={plan.title}
                    style={[
                      styles.planBox,
                      isSelected && styles.selectedBox,
                      plan.topPick && styles.topPickPlan,
                    ]}
                    onPress={() => handlePlanSelect(plan.title)}
                  >
                    {plan.topPick && (
                      <Text style={styles.topPick}>BEST VALUE</Text>
                    )}

                    <View style={styles.planHeaderRow}>
                      <Text
                        style={[
                          styles.planTitle,
                          isSelected && styles.selectedPlanTitleText,
                        ]}
                      >
                        {plan.title}
                      </Text>
                      {plan.discount && (
                        <View
                          style={[
                            styles.discountBadge,
                            isSelected && styles.discountBadgeSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.discount,
                              isSelected && styles.selectedText,
                            ]}
                          >
                            {plan.discount}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.planSubtitle,
                        isSelected && styles.selectedText,
                      ]}
                    >
                      {plan.subtitle}
                    </Text>

                    <Text
                      style={[
                        styles.planDuration,
                        isSelected && styles.selectedText,
                      ]}
                    >
                      {plan.duration}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text
                        style={[
                          styles.priceOld,
                          isSelected && styles.selectedText,
                        ]}
                      >
                        {/* ₹{plan.oldPrice} */}
                      </Text>
                      <Text
                        style={[
                          styles.priceNew,
                          isSelected && styles.selectedText,
                        ]}
                      >
                        ₹{plan.newPrice}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.dailyPrice,
                        isSelected && styles.selectedText,
                      ]}
                    >
                      {plan.daily}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected Plan Summary */}
            <View style={styles.selectedPlanCard}>
              <Text style={styles.selectedPlanTitle}>
                {selected.title} Plan
              </Text>
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
                isProcessingPayment && styles.checkoutButtonDisabled,
              ]}
              // disabled={isProcessingPayment || !isIAPInitialized}
            >
              {/* {isProcessingPayment ? (
                <>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.checkoutText}> Processing...</Text>
                </>
              ) : ( */}
              <>
                <Image source={Images.LOCK} style={styles.lockIcon} />
                <Text style={styles.checkoutText}>Subscribe Now</Text>
              </>
              {/* )} */}
            </TouchableOpacity>

            {/* IAP Status */}
            {!isIAPInitialized && (
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

            {/* IAP Footer */}
            <View style={styles.iapFooter}>
              <Text style={styles.iapFooterText}>
                Subscriptions will be charged to your Apple ID/Google Account at
                confirmation of purchase.
              </Text>
              <Text style={styles.iapFooterText}>
                Subscription automatically renews unless auto-renew is turned
                off at least 24-hours before the end of the current period.
              </Text>
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
});

export default Checkout;
