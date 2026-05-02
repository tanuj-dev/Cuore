import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import PaymentConfirmation from '../../components/PaymentCoinfirmation';
import { useAppTheme } from '../../hooks/useAppTheme';

const PaymentScreen = ({ route, navigation }) => {
  const { colors: c } = useAppTheme();
  const { paymentSuccess, paymentId, orderId, amount, plan } =
    route.params || {};
  const [paymentSuccessModalVisible, setPaymentSuccessModalVisible] =
    useState(false);

  useEffect(() => {
    // Show modal when component mounts if payment was successful
    if (paymentSuccess) {
      setPaymentSuccessModalVisible(true);
    }
  }, [paymentSuccess]);

  const paymentData = {
    transactionId: paymentId,
    orderId: orderId,
    amount: amount,
    plan: plan,
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.surface }}>
      {/* Payment Success Modal */}
      <PaymentConfirmation
        navigation={navigation}
        setPaymentSuccessModalVisible={setPaymentSuccessModalVisible}
        paymentSuccessModalVisible={paymentSuccessModalVisible}
        paymentData={paymentData}
      />
    </View>
  );
};

export default PaymentScreen;
