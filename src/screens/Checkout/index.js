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
    title: 'Stabilise',
    subtitle: 'Build steady habits with expert guidance',
    duration: '3 Months',
    oldPrice: 1499,
    newPrice: 999,
    daily: ' ₹11/day',
    discount: '33%',
    productId: 'com.cuore.stabilise',
  },
];

const Checkout = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState('Stabilise');
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
                  marginTop: Platform.OS === 'ios' ? hp(7) : 0,
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

            <Text style={[styles.notice, { textAlign: 'center' }]}>
              Remote supervision is billed separately by the doctor, & does not
              include consultation
            </Text>
          </View>

          <View style={styles.container}>
            {/* Offer */}
            <View style={styles.offerBanner}>
              <Text style={styles.offerText}>Launch Offer · Ends 31 March</Text>
            </View>

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
                        ₹{plan.oldPrice}
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
            <Text style={styles.sectionTitle}>Payment Method</Text>
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
            </View>

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
                <ActivityIndicator size="small" color="#1E64AC" />
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
  container: { padding: wp(4), backgroundColor: '#F9FAFB' },
  title: {
    fontFamily: 'Roboto-Regular',
    marginTop: hp(2),
    marginLeft: hp(13),
    fontSize: 20,
    fontWeight: '400',
    marginBottom: hp(2),
    // alignSelf: 'center',
    color: '#000000',
    alignSelf: 'center',
    textAlign: 'center',
  },
  header: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(3),
    fontWeight: 'bold',
    marginVertical: hp(1),
  },
  subheader: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(1.6),
    color: '#555',
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 18,
    fontWeight: '400',
    color: '#000000',
    marginBottom: hp(1),
  },
  planContainer: {
    alignItems: 'center',
    // flexDirection: 'row',
    // flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  planBox: {
    width: '90%',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: hp(2),
    marginBottom: hp(2),
    // elevation: 70,
  },
  selectedBox: { borderColor: 'white', backgroundColor: '#D1D5DB' },
  discount: {
    fontFamily: 'Roboto-Regular',
    color: '#000000',
    fontWeight: '400',
    fontSize: 16,
    marginLeft: hp(4),
    // alignSelf: 'flex-end',
  },
  topPick: {
    color: '#FFFFFF',
    fontWeight: '400',
    fontSize: 14,
    position: 'absolute',
    backgroundColor: '#17AD8D',
    padding: hp(1),
    borderRadius: hp(2),
    top: 7,
  },
  planTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 18,

    fontWeight: '600',
    color: '#1E64AC',

    marginLeft: hp(12),
    marginVertical: hp(1),
  },
  planSubtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#374151',
    fontWeight: '400',
    // marginVertical: hp(1),
    numberOfLines: 2,
    width: '60%',
  },
  planDuration: {
    position: 'absolute',
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#374151',
    fontWeight: '400',
    top: hp(11),
    marginTop: hp(1),
    left: hp(2),
  },
  priceOld: {
    fontFamily: 'Roboto-Regular',
    textDecorationLine: 'line-through',
    color: '#000000',
    fontSize: 21,
    fontWeight: '400',
    // marginVertical: hp(2),
    alignSelf: 'flex-end',
  },
  priceNew: {
    fontFamily: 'Roboto-Regular',
    fontSize: 24,
    fontWeight: '400',
    color: '#000000',
    alignSelf: 'flex-end',
  },
  dailyPrice: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#1E64ACBF',
    // marginTop: hp(-1),
    // alignSelf: 'center',
  },
  summaryBox: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: hp(2),
    marginBottom: hp(2),
    backgroundColor: '#FFFFFF',
  },
  promoBox: {
    flexDirection: 'row',
    marginVertical: hp(1),
    // backgroundColor: 'red',
  },
  promoInput: {
    flex: 1,
    // borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
  },
  applyButton: {
    backgroundColor: '#1E64AC',
    borderRadius: 1,
    marginLeft: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  applyText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
  },
  checkboxRow: {
    padding: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  checkboxText: {
    marginLeft: hp(1),
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#000000',
  },
  checkoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E64AC',
    padding: hp(1.5),
    borderRadius: hp(0.5),
  },
  checkoutButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  checkoutText: {
    color: '#fff',
    fontSize: hp(2),
    fontFamily: 'Roboto-Regular',
  },
  offerBanner: {
    backgroundColor: '#F3F4F6',
    padding: hp(1.5),
    borderRadius: 8,
    marginBottom: hp(2),
    alignItems: 'center',
  },
  offerText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: '#1F2937',
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
    shadowRadius: 4,
  },
  selectedPlanTitle: {
    fontFamily: 'Roboto-Bold',
    fontSize: 20,
    color: '#1E64AC',
    marginBottom: hp(0.5),
  },
  selectedPlanSubtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: hp(1.5),
  },
  selectedPlanDuration: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    color: '#374151',
    marginBottom: hp(1),
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
    borderColor: '#1E64AC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: hp(1),
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E64AC',
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
    fontFamily: 'Roboto-Regular',
    fontSize: 15,
    color: '#374151',
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
    // tintColor: '#6B7280',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  summaryText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#374151',
  },
  totalRow: {
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    paddingTop: hp(1.5),
    marginTop: hp(0.5),
  },
  totalText: {
    fontFamily: 'Roboto-Bold',
    fontSize: 16,
    color: '#1F2937',
  },
  lockIcon: {
    width: 16,
    height: 16,
    marginRight: hp(1),
    // tintColor: '#',
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
    // tintColor: '#6B7280',
  },
  sslText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 13,
    color: '#6B7280',
  },
  ssl: {
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    marginTop: hp(1),
    color: '#888',
  },
  faqSection: {
    borderWidth: 2,
    padding: hp(2),
    marginTop: hp(2),
    // marginBottom: hp(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: hp(0.5),
    borderColor: '#E5E7EB',
    // elevation: 0.1,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  discountBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: hp(1),
    paddingVertical: hp(0.5),
    borderRadius: hp(1),
  },
  discountBadgeSelected: {
    backgroundColor: '#FECACA',
  },
  selectedPlanTitleText: {
    color: '#1E64AC',
  },
  selectedText: {
    color: '#1E64AC',
  },
  topPickPlan: {
    borderColor: '#17AD8D',
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
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: hp(1),
  },
  iapFooter: {
    backgroundColor: '#F9FAFB',
    padding: hp(2),
    borderRadius: 8,
    marginTop: hp(2),
    marginBottom: hp(4),
  },
  iapFooterText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: hp(1),
    lineHeight: 18,
  },
});

export default Checkout;
