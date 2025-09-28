import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  //   CheckBox,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';

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
  const [selectedPlan, setSelectedPlan] = useState('Progress');
  const [promoCode, setPromoCode] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);
  const [selectPaymentMethod, setSelectPaymentMethod] = useState('Credit');
  const [enableAutoRenewal, setEnableAutoRenewal] = useState(false);
  const GST = 0.18;

  const selected = plans.find(p => p.title === selectedPlan);
  const gstAmount = selected.newPrice * GST;
  const totalAmount = selected.newPrice + gstAmount;

  return (
    <ScrollView>
      <View
        style={{ backgroundColor: '#FFFFFF', paddingTop: hp(2), elevation: 1 }}
      >
        <View
          style={{
            flexDirection: 'row',
          }}
        >
          <TouchableOpacity
            style={{
              marginTop: Platform.OS == 'ios' && hp(7),
              marginBottom: hp(2),
            }}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={Images.BACK_BUTTON}
              style={{
                resizeMode: 'contain',
                height: hp(3.5),
                width: wp(4),
                marginLeft: hp(2),
                tintColor: '#000000',
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.title}>Checkout</Text>
        </View>
        <View style={{ marginBottom: hp(1) }}>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              textAlign: 'center',
              fontSize: 15,
              fontWeight: '400',
              color: '#000000',
              marginHorizontal: hp(2),
            }}
          >
            Remote supervision is billed separately by the doctor, & does not
            include consultation
          </Text>
        </View>
      </View>

      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Select Plan</Text>
        <View style={styles.planContainer}>
          {plans.map(plan => (
            <TouchableOpacity
              key={plan.title}
              style={[
                styles.planBox,
                selectedPlan === plan.title && styles.selectedBox,
              ]}
              onPress={() => setSelectedPlan(plan.title)}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              >
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.discount}>🔻{plan.discount} OFF</Text>
              </View>

              <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
              <Text style={styles.planDuration}>Duration: {plan.duration}</Text>
              <Text style={styles.priceOld}>₹{plan.oldPrice}</Text>
              <Text style={styles.priceNew}>Now ₹{plan.newPrice}</Text>
              <Text style={styles.dailyPrice}>~{plan.daily}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentMethods}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setSelectPaymentMethod('Credit')}
              style={{
                height: hp(2.5),
                width: wp(5),
                borderWidth: 1,
                borderRadius: hp(2),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  height: hp(1.5),
                  width: wp(3),
                  borderRadius: hp(4),
                  backgroundColor:
                    selectPaymentMethod === 'Credit' ? '#000000' : '',
                }}
              ></View>
            </TouchableOpacity>
            <Image
              source={Images.CREDIT}
              style={{
                resizeMode: 'contain',
                height: hp(2),
                width: wp(4.5),
                marginHorizontal: hp(1),
              }}
            />
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontSize: 14,
                fontWeight: '400',
                color: '#000000',
              }}
            >
              Credit/Debit Card
            </Text>
          </View>

          {/* paypa; */}

          <View
            style={{
              flexDirection: 'row',
              marginTop: hp(1),
              alignItems: 'center',
            }}
          >
            <TouchableOpacity
              onPress={() => setSelectPaymentMethod('PayPal')}
              style={{
                height: hp(2.5),
                width: wp(5),
                borderWidth: 1,
                borderRadius: hp(2),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  height: hp(1.5),
                  width: wp(3),
                  borderRadius: hp(4),
                  backgroundColor:
                    selectPaymentMethod == 'PayPal' ? '#000000' : '#FFFFFF',
                }}
              ></View>
            </TouchableOpacity>
            <Image
              source={Images.PAYPAL}
              style={{
                resizeMode: 'contain',
                height: hp(2),
                width: wp(4.5),
                marginHorizontal: hp(1),
              }}
            />
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontSize: 14,
                fontWeight: '400',
                color: '#000000',
              }}
            >
              PayPal
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryBox}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: hp(3),
            }}
          >
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontSize: 14,
                fontWeight: '400',
                color: '#000000',
              }}
            >
              Subscription: {selected.title}
            </Text>
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontSize: 14,
                fontWeight: '400',
                color: '#000000',
              }}
            >
              ₹{(selected.newPrice - gstAmount).toFixed(2)}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: hp(2.5),
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontSize: 14,
                fontWeight: '400',
                color: '#000000',
              }}
            >
              GST 18%:{' '}
            </Text>
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontSize: 14,
                fontWeight: '400',
                color: '#000000',
              }}
            >
              ₹{gstAmount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.promoBox}>
            <TextInput
              style={styles.promoInput}
              placeholder="Promo Code"
              value={promoCode}
              onChangeText={setPromoCode}
            />
            <TouchableOpacity style={styles.applyButton}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: hp(0.5),
              borderTopWidth: 1,
              paddingTop: hp(1),
              borderColor: '#E5E7EB',
            }}
          >
            <Text style={styles.total}>Total: </Text>
            <Text style={styles.total}> ₹{totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.checkboxRow}>
          <TouchableOpacity
            onPress={() => setEnableAutoRenewal(!enableAutoRenewal)}
            style={{
              height: hp(2.5),
              width: wp(5),
              borderWidth: 1,
              borderRadius: hp(0.7),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                height: hp(1.5),
                width: wp(3),
                borderRadius: hp(4),
                backgroundColor:
                  enableAutoRenewal == true ? '#000000' : '#FFFFFF',
              }}
            ></View>
          </TouchableOpacity>
          <Text style={styles.checkboxText}>Enable auto-renewal</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('PaymentDetails')}
          activeOpacity={0.9}
          style={styles.checkoutButton}
        >
          <Image
            source={Images.LOCK}
            style={{
              resizeMode: 'contain',
              height: hp(2),
              width: wp(3),
              marginRight: hp(1),
              //   marginLeft: hp(-1.8),
              //   tintColor: '#00e0000',
            }}
            resizeMode="contain"
          />
          <Text style={styles.checkoutText}> Secure Checkout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: hp(2),
          }}
        >
          <Image
            source={Images.SECURE}
            style={{
              resizeMode: 'contain',
              height: hp(2),
              width: wp(4),
              marginRight: hp(0.5),
            }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 14,
              color: 'black',
            }}
          >
            {' '}
            Secure Checkout
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            marginTop: hp(10),
            fontSize: 18,
            fontWeight: '400',
            color: '#000000',
            fontFamily: 'Roboto-Regular',
          }}
        >
          FAQ
        </Text>
        <TouchableOpacity style={styles.faqSection}>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 14,
              fontWeight: '400',
              color: '#000000',
            }}
          >
            Does remote supervision include consultation?
          </Text>
          <Image
            source={Images.DOWN}
            style={{
              resizeMode: 'contain',
              height: hp(2),
              width: wp(4),
              marginRight: hp(0.5),
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.faqSection, { marginBottom: hp(22) }]}>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 14,
              fontWeight: '400',
              color: '#000000',
            }}
          >
            Is there a refund policy?
          </Text>
          <Image
            source={Images.DOWN}
            style={{
              resizeMode: 'contain',
              height: hp(2),
              width: wp(4),
              marginRight: hp(0.5),
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
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
  paymentMethods: {
    marginBottom: hp(2),
    backgroundColor: '#FFFFFF',
    padding: hp(2),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: hp(1),
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
  checkboxText: { marginLeft: 8, marginLeft: hp(1) },
  checkoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E64AC',
    padding: hp(1.5),
    borderRadius: hp(0.5),
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontSize: hp(2),
    fontFamily: 'Roboto-Regular',
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
