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
import React from 'react';
import { hp, wp, Images } from '../../utilities';

const PaymentConfirmation = ({
  navigation,
  paymentSuccessModalVisible,
  setPaymentSuccessModalVisible,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={paymentSuccessModalVisible}
      onRequestClose={() => setPaymentSuccessModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={{
            marginTop: Platform.OS == 'ios' && hp(2),
            flexDirection: 'row',
            backgroundColor: '#FFFFFF',
            // paddingTop: hp(6),
            height: hp(15),
            elevation: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: hp(2),
          }}
        >
          <Text style={styles.title}>Confirmation</Text>
        </View>
        <View
          style={{
            padding: hp(2),
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            margin: hp(2),
            elevation: 2,
            borderRadius: hp(1),
          }}
        >
          <Image
            source={Images.RIGHT}
            style={{
              resizeMode: 'cover',
              height: hp(10),
              width: wp(18),
              resizeMode: 'contain',
            }}
          />
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 24,
              fontWeight: '400',
              color: '#000000',
              marginVertical: hp(2),
            }}
          >
            Payment Successful!
          </Text>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 14,
              fontWeight: '400',
              color: '#4B5563',
              marginBottom: hp(0.5),
            }}
          >
            Your transaction has been completed
          </Text>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 14,
              fontWeight: '400',
              color: '#4B5563',
            }}
          >
            Payment Successful.
          </Text>
          <View
            style={{
              height: 1,
              backgroundColor: '#E5E7EB',
              //   borderWidth: 1,
              width: '100%',
              marginTop: hp(2),
            }}
          ></View>

          <View style={{ marginTop: hp(1.5) }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Roboto-Regular',
                  fontSize: 14,
                  fontWeight: '400',
                  color: '#4B5563',
                }}
              >
                Transaction ID:
              </Text>
              <Text
                style={{
                  fontFamily: 'Roboto-Regular',
                  fontSize: 14,
                  fontWeight: '400',
                  color: '#000000',
                }}
              >
                TXN123456789
              </Text>
            </View>
            <View
              style={{
                marginVertical: hp(1.5),
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Roboto-Regular',
                  fontSize: 14,
                  fontWeight: '400',
                  color: '#4B5563',
                }}
              >
                Amount Paid:
              </Text>
              <Text
                style={{
                  fontFamily: 'Roboto-Regular',
                  fontSize: 14,
                  fontWeight: '400',
                  color: '#000000',
                }}
              >
                ₹1699.00
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Roboto-Regular',
                  fontSize: 14,
                  fontWeight: '400',
                  color: '#4B5563',
                }}
              >
                Payment Method:
              </Text>
              <Text
                style={{
                  fontFamily: 'Roboto-Regular',
                  fontSize: 14,
                  fontWeight: '400',
                  color: '#000000',
                }}
              >
                **** 3456
              </Text>
            </View>
          </View>
        </View>

        {/* button */}

        <TouchableOpacity
          onPress={
            () =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              })
            // setPaymentSuccessModalVisible(!paymentSuccessModalVisible)
          }
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1E64AC',
            marginHorizontal: hp(2),
            padding: hp(2),
            borderRadius: hp(0.5),
            marginTop: hp(2),
          }}
        >
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 15,
              fontWeight: '400',
              color: '#FFFFFF',
            }}
          >
            Home
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontFamily: 'Roboto-Regular',
    fontSize: 20,
    fontWeight: '400',
    alignSelf: 'center',
    color: '#000000',
    marginBottom: hp(2),
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

export default PaymentConfirmation;
