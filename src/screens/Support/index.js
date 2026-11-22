import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Phone, Clock } from 'lucide-react-native';
import { hp, wp } from '../../utilities';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const PHONE = '+918595220225';

const Support = ({ navigation }) => {
  const { alert, AlertComponent } = useCustomAlert();
  useLightStatusBar();

  const callSupport = async () => {
    const url = `tel:${PHONE}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      alert('Error', 'Phone dialer not supported on this device');
    }
  };

  return (
    <>
      {AlertComponent}
      <View style={styles.wrapper}>
        <HeroHeader
          title="Support"
          subtitle="We are here to help"
          onBack={() => navigation.goBack()}
        />

        <View style={styles.body}>
          <View style={styles.card}>
            <View style={styles.iconTile}>
              <Phone size={28} color="#1E64AC" />
            </View>
            <Text style={styles.heading}>Call our support team</Text>
            <Text style={styles.muted}>Support line</Text>
            <TouchableOpacity
              onPress={callSupport}
              style={styles.callBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Call support"
            >
              <Phone size={18} color="#FFFFFF" />
              <Text style={styles.callText}>Call +91 85952 20225</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, styles.hoursCard]}>
            <View style={styles.smallTile}>
              <Clock size={20} color="#1E64AC" />
            </View>
            <View style={styles.hoursText}>
              <Text style={styles.hoursTitle}>Support hours</Text>
              <Text style={styles.muted}>Monday - Saturday</Text>
              <Text style={styles.hoursTime}>9:00 AM - 6:00 PM</Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F4F7FB' },
  body: { padding: wp(4), gap: hp(2) },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: wp(5),
    alignItems: 'center',
  },
  iconTile: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.5),
  },
  heading: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  muted: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 2,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1.8),
    borderRadius: 999,
    marginTop: hp(2.5),
  },
  callText: {
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    fontSize: 15,
  },
  hoursCard: { flexDirection: 'row', alignItems: 'center' },
  smallTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursText: { flex: 1, marginLeft: wp(3.5) },
  hoursTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#0F172A',
  },
  hoursTime: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#0F172A',
    marginTop: 2,
  },
});

export default Support;
