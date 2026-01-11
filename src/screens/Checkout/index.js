import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const plans = [
  {
    title: 'Stabilise',
    subtitle: 'Build steady habits with expert guidance',
    duration: '3 Months',
    oldPrice: 1499,
    newPrice: 999,
    daily: ' ₹11/day',
    discount: '33%',
  },
  {
    title: 'Progress',
    subtitle: 'Improve your health, one step at a time',
    duration: '6 Months',
    oldPrice: 2249,
    newPrice: 1499,
    daily: ' ₹9/day',
    discount: '33%',
    topPick: true,
  },
  {
    title: 'Thrive',
    subtitle: 'Sustain your best health—long term',
    duration: '12 Months',
    oldPrice: 3299,
    newPrice: 2199,
    daily: ' ₹6/day',
    discount: '33%',
  },
];

const Checkout = ({ navigation }) => {
  const [selectedPlan] = useState('Thrive');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { alert, AlertComponent } = useCustomAlert();

  const selected = plans.find(p => p.title === selectedPlan);
  const GST = 0.18;
  const gstAmount = selected.newPrice * GST;
  const totalAmount = selected.newPrice + gstAmount;

  const handleCheckout = () => {
    setIsProcessingPayment(true);

    setTimeout(() => {
      setIsProcessingPayment(false);
      alert('Checkout', 'Payment flow will be added later. UI only for now.');
    }, 1200);
  };

  return (
    <ScrollView>
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

        <Text style={styles.notice}>
          Remote supervision is billed separately by the doctor, & does not
          include consultation
        </Text>
      </View>

      <View style={styles.container}>
        {/* Offer */}
        <View style={styles.offerBanner}>
          <Text style={styles.offerText}>Launch Offer · Ends 31 March</Text>
        </View>

        {/* Plan */}
        <View style={styles.selectedPlanCard}>
          <Text style={styles.selectedPlanTitle}>{selected.title}</Text>
          <Text style={styles.selectedPlanSubtitle}>{selected.subtitle}</Text>
          <Text style={styles.selectedPlanDuration}>
            Duration: {selected.duration}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceOld}>₹{selected.oldPrice}</Text>
            <Text style={styles.priceNew}>₹{selected.newPrice} / year</Text>
          </View>
        </View>

        {/* Payment Method */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
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
        </View>

        {/* Order Summary */}
        <Text style={styles.sectionTitle}>Order Summary</Text>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>{selected.title}</Text>
            <Text style={styles.summaryText}>
              ₹{(selected.newPrice - gstAmount).toFixed(2)}
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
        </View>

        {/* Checkout Button */}
        <TouchableOpacity
          onPress={handleCheckout}
          style={styles.checkoutButton}
          disabled={isProcessingPayment}
        >
          {isProcessingPayment ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.checkoutText}> Processing...</Text>
            </>
          ) : (
            <>
              <Image source={Images.LOCK} style={styles.lockIcon} />
              <Text style={styles.checkoutText}>Secure Checkout</Text>
            </>
          )}
        </TouchableOpacity>

        {/* SSL */}
        <View style={styles.sslBadge}>
          <Image source={Images.SECURE} style={styles.secureIcon} />
          <Text style={styles.sslText}>Secure SSL Encryption</Text>
        </View>
      </View>
    </ScrollView>
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
});

export default Checkout;
