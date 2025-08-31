import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
// import {Ionicons} from '@expo/vector-icons';
import {hp, wp, Images} from '../../utilities'; // height/width percentage helpers

const TermsAndConditions = ({navigation}) => {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      // Proceed to next screen or action
      Alert.alert('Accepted', 'You have accepted the Terms & Conditions.');
    } else {
      Alert.alert('Required', 'Please accept the Terms & Conditions.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
     <View style={{
          backgroundColor: '#FFFFFF',
          elevation: 1,
      }}>
 <View
        style={{
       
        
          alignItems: 'center',
          padding: hp(2),
          flexDirection: 'row',
           marginTop:Platform.OS =='ios'&& hp(5),
        }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={Images.BACK_BUTTON}
            style={{
              height: hp(3),
              width: wp(4),
              resizeMode: 'contain',
              tintColor: '#000000',
            }}
          />
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: 'Roboto-Regular',
            fontSize: 20,
            fontWeight: '400',
            color: '#000000',
            marginLeft: hp(2),
          }}>
        Terms and Condition
        </Text>
      </View>
      </View>

      {/* Content */}
      <View
        style={{
          margin: hp(1),
          backgroundColor: '#FFFFFF',
          padding: hp(1),
          height: hp(85),
          elevation: 1,
          marginTop: hp(2),
          borderRadius: hp(2),
        }}>
        <ScrollView style={styles.content}>
          <Text style={styles.paragraph}>
            Welcome to Cuore. These Terms & Conditions govern your access to and
            use of our services. By accessing or using Cuore, you confirm that
            you are legally competent to enter into this agreement and agree to
            be legally bound by these Terms.
          </Text>

          <Text style={styles.sectionTitle}>Services Offered</Text>
          <Text style={styles.paragraph}>
            Cuore provides health and wellness services including, but not
            limited to:
          </Text>
          <Text style={styles.list}>
            • Personalized lifestyle modification plans
          </Text>
          <Text style={styles.list}>• Health monitoring tools</Text>
          <Text style={styles.list}>• Advisory content for wellbeing</Text>
          <Text style={styles.list}>
            • Remote progress monitoring with your caregiver and/or doctor (if
            authorized)
          </Text>
          <Text style={styles.paragraph}>
            These services are intended to support and enhance your personal
            health journey, but do not replace medical advice.
          </Text>

          <Text style={styles.sectionTitle}>Eligibility</Text>
          <Text style={styles.paragraph}>
            Cuore’s services are intended for individuals aged 18 years and
            above. By using our services, you represent and warrant that you
            meet this eligibility requirement and have the legal capacity to
            enter into a binding agreement.
          </Text>

          <Text style={styles.sectionTitle}>Payment & Refund Policy</Text>
          <Text style={styles.list}>
            • Subscription payments must be made in advance, unless explicitly
            agreed otherwise.
          </Text>
          <Text style={styles.list}>
            • Remote supervision by doctors may be included in your subscription
            or a separately payable service.
          </Text>
          <Text style={styles.list}>
            • Direct supervision fees charged by your doctor are between you and
            them.
          </Text>
          <Text style={styles.list}>
            • Refunds are discretionary and only considered under exceptional
            circumstances.
          </Text>

          <Text style={styles.sectionTitle}>
            Doctor Monitoring and Service Fee
          </Text>
          <Text style={styles.list}>
            • Your doctor may access your key health parameters upon your
            consent.
          </Text>
          <Text style={styles.list}>
            • Doctors may be paid directly by you or by Cuore on your behalf.
          </Text>
          <Text style={styles.list}>
            • Cuore is not responsible for clinical decisions made by your
            doctor.
          </Text>

          <Text style={styles.sectionTitle}>
            Disclaimer & Limitation of Liability
          </Text>
          <Text style={styles.list}>
            • Services are for informational and educational purposes only.
          </Text>
          <Text style={styles.list}>• Not medical diagnosis or treatment.</Text>
          <Text style={styles.list}>
            • Consult licensed providers before making decisions.
          </Text>
          <Text style={styles.list}>
            • Cuore is not liable for any misuse or damages.
          </Text>

          <Text style={styles.sectionTitle}>
            Confidentiality & Data Protection
          </Text>
          <Text style={styles.list}>
            • Your privacy is very important to us.
          </Text>
          <Text style={styles.list}>
            • You must obtain consent from caregivers and doctors before
            submitting their data.
          </Text>
          <Text style={styles.list}>
            • Personal data handling follows our Privacy Policy.
          </Text>

          {/* Checkbox */}
          <TouchableOpacity
            style={styles.checkboxWrapper}
            onPress={() => setAccepted(!accepted)}>
            <Text style={styles.checkboxText}>
              ✅ I accept the Terms & Conditions and Privacy Policy.
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Continue Button */}
    </View>
  );
};

export default TermsAndConditions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(4),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 20,
    fontWeight: '400',
    marginLeft: wp(3),
    color: '#000000',
  },
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
  },
  sectionTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 11,
    fontWeight: '700',
    // marginTop: hp(2),
    color: '#6B7280',
  },
  paragraph: {
    fontFamily: 'Roboto-Regular',
    fontSize: 11,
    color: '#6B7280',
    // marginTop: hp(1),
    lineHeight: hp(2.8),
  },
  list: {
    fontFamily: 'Roboto-Regular',
    fontSize: 11,
    marginLeft: wp(2),
    marginTop: 4,
    color: '#6B7280',
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(3),
    marginBottom: hp(5),
  },
  checkboxText: {
    fontFamily: 'Roboto-Regular',
    marginLeft: wp(2),
    fontSize: 11,
    color: '#6B7280',
  },
  continueButton: {
    padding: hp(1.5),
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: wp(5),
    marginBottom: hp(2),
  },
  continueText: {
    fontFamily: 'Roboto-Regular',
    color: '#6B7280',
    fontWeight: '600',
    fontSize: hp(2),
  },
});
