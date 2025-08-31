import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import {hp, wp, Images} from '../../utilities';
import PaymentConfirmation from '../../components/PaymentCoinfirmation';

const PaymentScreen = ({route, navigation}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [paymentSuccessModalVisible, setPaymentSuccessModalVisible] =
    useState(false);

  const progressAmount = 1439.83;
  const gst = 0.18 * progressAmount;
  const totalAmount = progressAmount + gst;

  const handlePayment = () => {
    // Payment logic here
    setPaymentSuccessModalVisible(true);
  };

  return (
    <ScrollView style={{flex: 1, backgroundColor: '#F9FAFB'}}>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#FFFFFF',
          paddingTop: hp(2),
          elevation: 1,
        }}>
        <TouchableOpacity style={{ marginTop:Platform.OS =='ios'&& hp(8)}} onPress={() => navigation.goBack()}>
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
        <Text style={styles.title}>Payment Details</Text>
      </View>

      {/* Card Info */}
      <View style={styles.container}>
        <View style={styles.cardBox}>
          <Text style={styles.sectionTitle}>Card Information</Text>
          <Text style={styles.upperInputText}>Card Number</Text>
          <TextInput
            placeholder="1234 5678 9012 3456"
            style={styles.input}
            keyboardType="number-pad"
            value={cardNumber}
            onChangeText={setCardNumber}
          />

          <View style={styles.row}>
            <View style={{width: wp(40)}}>
              <Text style={styles.upperInputText}>Expiry Date</Text>
              <TextInput
                placeholder="MM/YY"
                style={[styles.input, {flex: 1, marginRight: wp(2)}]}
                value={expiryDate}
                onChangeText={setExpiryDate}
              />
            </View>
            <View style={{width: wp(40)}}>
              <Text style={styles.upperInputText}>CVV</Text>
              <TextInput
                placeholder="123"
                style={[styles.input, {flex: 1}]}
                keyboardType="number-pad"
                secureTextEntry
                value={cvv}
                onChangeText={setCvv}
              />
            </View>
          </View>
          <Text style={styles.upperInputText}>Name on Card</Text>
          <TextInput
            placeholder="John Doe"
            style={styles.input}
            value={nameOnCard}
            onChangeText={setNameOnCard}
          />
        </View>

        {/* Order Summary */}
        <View style={styles.cardBox}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.rowBetween}>
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontSize: 14,
                fontWeight: '400',
                color: '#000000',
              }}>
              Progress
            </Text>
            <Text style={{color: '#000000', fontSize: 14}}>
              ₹{progressAmount.toFixed(2)}
            </Text>
          </View>
          <View
            style={{
              height: 1,
              backgroundColor: '#E5E7EB',
              marginVertical: hp(1),
            }}
          />
          <View style={styles.rowBetween}>
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontSize: 14,
                fontWeight: '400',
                color: '#000000',
              }}>
              GST 18%
            </Text>
            <Text>₹{gst.toFixed(2)}</Text>
          </View>
          <View
            style={{
              height: 1,
              backgroundColor: '#E5E7EB',
              marginVertical: hp(1),
            }}
          />
          <View style={styles.rowBetween}>
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontWeight: '400',
                fontSize: 14,
                color: '#000000',
              }}>
              Total
            </Text>
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontWeight: '400',
                fontSize: 14,
                color: '#000000',
              }}>
              ₹{totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Pay Button */}
        <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
          <Image
            source={Images.LOCK}
            style={{
              resizeMode: 'contain',
              height: hp(1.5),
              width: wp(3),
              marginRight: hp(1),
            }}
          />
          <Text style={styles.payText}>Pay Now</Text>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: hp(1),
          }}>
          <Image
            source={Images.SECURE}
            style={{
              resizeMode: 'contain',
              height: hp(2),
              width: wp(3.5),
              marginRight: hp(0.5),
            }}
          />
          <Text style={styles.sslText}>Secure SSL Encryption</Text>
        </View>
      </View>

      {/* Payment Success Modal */}
      <PaymentConfirmation
        navigation={navigation}
        setPaymentSuccessModalVisible={setPaymentSuccessModalVisible}
        paymentSuccessModalVisible={
          paymentSuccessModalVisible
        }></PaymentConfirmation>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: wp(5),
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontFamily: 'Roboto-Regular',
    marginTop: hp(1),
    marginLeft: hp(10),
    fontSize: 20,
    fontWeight: '400',
    marginBottom: hp(2),
    alignSelf: 'center',
    color: '#000000',
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: hp(1.4),
    padding: hp(2.5),
    marginVertical: hp(1),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
  },
  sectionTitle: {
    fontFamily: 'Roboto-Regular',
    marginLeft: hp(-1.5),
    fontSize: 18,
    fontWeight: '400',
    marginBottom: hp(3),
    color: '#000000',
  },
  input: {
    fontFamily: 'Roboto-Regular',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: wp(2),
    padding: wp(3),
    marginBottom: hp(1.5),
    fontSize: 16,
    fontWeight: '400',
  },
  row: {
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(0.8),
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#1E64AC',
    borderRadius: wp(1),
    paddingVertical: hp(1.6),
    marginTop: hp(3),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 2,
  },
  payText: {
    fontFamily: 'Roboto-Regular',
    color: '#fff',
    fontSize: 15,
    fontWeight: '400',
  },
  sslText: {
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
  },
  upperInputText: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    fontSize: 14,
    color: '#374151',
    marginBottom: hp(1),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  modalBox: {
    width: wp(80),
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: hp(3),
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: hp(1.5),
    color: '#10B981',
  },
  modalText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginBottom: hp(2),
  },
  closeButton: {
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1),
    paddingHorizontal: wp(6),
    borderRadius: 6,
  },
  closeButtonText: {
    fontFamily: 'Roboto-Regular',
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PaymentScreen;
