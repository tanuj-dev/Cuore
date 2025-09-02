import React, {useState} from 'react';
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Images, hp, wp, Color} from '../../utilities';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import color from '../../utilities/Color';
import images from '../../utilities/Images';

const CreateAccountScreen = () => {
  const navigation = useNavigation();
  const [isChecked, setIsChecked] = useState(false);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{flex: 1}}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled">
          <Pressable
            style={styles.backArrow}
            onPress={() => navigation.goBack()}>
            <Image
              source={Images.BACK_BUTTON}
              style={{
                height: hp(3.5),
                
                width: wp(4),
                // marginLeft: hp(2),
                // tintColor: '#000000',
                resizeMode: 'contain',
              }}
            />
          </Pressable>
          <Image
            style={{
              resizeMode: 'contain',
              height: hp(3.5),
              width: wp(),
              marginBottom: hp(2),
            }}
            source={images.APP_LOGO}
          />

          <Text style={styles.title}>Create Account</Text>

          <Text style={styles.label}>
            Full Name
            <Text
              style={[styles.label, {fontStyle: 'italic', fontWeight: '400'}]}>
              {' '}
              (Required)
            </Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter user’s full name"
            placeholderTextColor="#6B7280"
          />

          <Text style={styles.label}>
            Mobile Number
            <Text
              style={[styles.label, {fontStyle: 'italic', fontWeight: '400'}]}>
              {' '}
              (Required)
            </Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your registered mobile number"
            placeholderTextColor="#6B7280"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Family member's mobile number</Text>
          <TextInput
            style={styles.input}
            placeholder="So they can see your progress"
            placeholderTextColor="#6B7280"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Doctor's Code</Text>

          <TextInput
            style={styles.input}
            placeholder="Connect to a partnered doctor for remote supervision"
            placeholderTextColor="#6B7280"
          />

          <Text style={styles.label}>Corporate Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Only for corporate plan users"
            placeholderTextColor="#6B7280"
          />

          <Text style={styles.infoText}>
            By entering your caregiver’s and doctor’s contact details, you
            authorize Cuore to share relevant health information with them to
            enable coordinated, personalized care as part of your program
          </Text>

          <View style={styles.checkboxContainer}>
            <BouncyCheckbox
              size={20}
              fillColor="#9CA3AF"
              unfillColor="#FFFFFF"
              textComponent={
                <Text style={styles.checkboxLabel}>
                  I have read and agree to the{' '}
                  <Text
                    style={styles.link}
                    onPress={() =>
                      Linking.openURL('https://example.com/terms')
                    }>
                    Terms and Conditions
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={styles.link}
                    onPress={() =>
                      Linking.openURL('https://example.com/privacy')
                    }>
                    Privacy Policy
                  </Text>
                  .
                </Text>
              }
              isChecked={isChecked}
              onPress={checked => setIsChecked(checked)}
            />
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('OtpScreen')}
            style={styles.verifyButton}
            // disabled={!isChecked}
          >
            <Text style={styles.verifyText}>Verify</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: wp(5),
    flexGrow: 1,
  },
  backArrow: {
    marginBottom: hp(2),
    marginTop:Platform.OS =='ios'&& hp(2),
  },
  title: {
    color: '#111827',
    fontSize: hp(2.6),
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: hp(3),
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: hp(0.8),
    marginTop: hp(1.5),
    fontFamily: 'Roboto-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp(1.5),
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    fontSize: 14,
    backgroundColor: '#fff',
    fontFamily: 'Roboto-Regular',
  },
  infoText: {
    fontSize: hp(1.5),
    color: '#4B5563',
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(2),
  },
  checkboxLabel: {
    flex: 1,
    fontSize: hp(1.5),
    color: '#4B5563',
    marginLeft: wp(2),
  },
  link: {
    color: '#1E64AC',
    textDecorationLine: 'underline',
  },
  verifyButton: {
    backgroundColor: color.DARK_BLUE,
    paddingVertical: hp(1.6),
    borderRadius: wp(2),
    alignItems: 'center',
  },
  verifyText: {
    color: 'white',
    fontSize: hp(2),
    fontWeight: '600',
  },
});

export default CreateAccountScreen;
