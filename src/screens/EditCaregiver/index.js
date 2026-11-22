import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Pencil, Phone, UserRound } from 'lucide-react-native';
import { hp, wp } from '../../utilities';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, getProfile } from '../../redux/slices';
import ToastMessage from '../../components/Toast';

const EditCaregiver = ({ navigation }) => {
  const dispatch = useDispatch();
  const userID = useSelector(state => state.auth.userId);
  const caregiverData = useSelector(
    state => state.profile.data?.data?.caregiver || {},
  );

  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverMobile, setCaregiverMobile] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const role = useSelector(state => state.auth.role);
  useLightStatusBar();

  useEffect(() => {
    if (caregiverData) {
      setCaregiverName(caregiverData.name || '');
      setCaregiverMobile(
        caregiverData.mobile?.startsWith('+91')
          ? caregiverData.mobile.slice(3)
          : caregiverData.mobile || '',
      );
    }
    return () => setToast({ message: '', type: 'success' });
  }, [caregiverData]);

  // eslint-disable-next-line no-unused-vars -- used when Caregiver Name field is enabled
  const handleNameChange = text => {
    if (text.length <= 20) {
      setCaregiverName(text);
    } else {
      setToast({
        message: 'Caregiver name cannot exceed 20 characters.',
        type: 'error',
      });
    }
  };

  const handleMobileChange = text => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 10) {
      setCaregiverMobile(digits);
    } else {
      setToast({
        message: 'Mobile number cannot exceed 10 digits.',
        type: 'error',
      });
    }
  };

  const handleSave = useCallback(async () => {
    const payload = {
      display_name: caregiverName.trim(),
      phone: '',
      caregiver_mobile: `+91${caregiverMobile.trim()}`,
      doctor_code: '',
      consent_flags: {
        tos: true,
        share_with_doctor: true,
      },
    };

    try {
      const res = await dispatch(
        updateProfile({ userId: userID, profileData: payload }),
      ).unwrap();

      if (res && res.success) {
        setIsEditing(false);
        setToast({ message: 'Profile updated successfully!', type: 'success' });
        dispatch(getProfile(userID));
      } else {
        const errorMsg =
          res?.message || 'Something went wrong. Please try again.';
        setToast({ message: errorMsg, type: 'error' });
      }
    } catch (error) {
      console.error('Update error:', error);
      const errorMsg =
        error?.message || 'Something went wrong. Please try again.';
      setToast({ message: errorMsg, type: 'error' });
    }
  }, [userID, caregiverName, caregiverMobile, dispatch]);

  const handleCancel = useCallback(() => {
    setCaregiverName(caregiverData.name || '');
    setCaregiverMobile(
      caregiverData.mobile?.startsWith('+91')
        ? caregiverData.mobile.slice(3)
        : caregiverData.mobile || '',
    );
    setIsEditing(false);
    navigation.goBack();
  }, [caregiverData, navigation]);

  const canEdit = role !== 'caregiver';

  return (
    <View style={styles.screen}>
      <HeroHeader
        title="Caregiver"
        subtitle="Who helps manage your care"
        onBack={() => navigation.goBack()}
        right={
          !isEditing && canEdit ? (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={styles.heroBtn}
              accessibilityRole="button"
              accessibilityLabel="Edit caregiver"
            >
              <Pencil size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null
        }
      />
      {toast.message ? (
        <ToastMessage
          top={60}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ message: '', type: 'success' })}
        />
      ) : null}
      <View style={styles.body}>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.tile}>
              <UserRound size={20} color="#1E64AC" />
            </View>
            <View style={styles.cardHeadText}>
              <Text style={styles.cardTitle}>Caregiver details</Text>
              <Text style={styles.cardSub}>
                {isEditing ? 'Update the mobile number' : 'Tap the pencil to edit'}
              </Text>
            </View>
          </View>

          <Text style={styles.label}>Caregiver mobile</Text>
          <View style={[styles.inputRow, !isEditing && styles.inputRowOff]}>
            <Phone size={18} color="#94A3B8" />
            <Text style={styles.prefix}>+91</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputOff]}
              value={caregiverMobile}
              editable={isEditing}
              keyboardType="number-pad"
              onChangeText={handleMobileChange}
              placeholder="10-digit mobile"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {isEditing && (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default memo(EditCaregiver);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  body: { padding: wp(4) },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: wp(5),
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: hp(2.5) },
  tile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeadText: { flex: 1, marginLeft: wp(3.5) },
  cardTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: '#0F172A' },
  cardSub: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#64748B' },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#64748B',
    marginBottom: hp(0.8),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: wp(3.5),
    height: hp(6),
    backgroundColor: '#FFFFFF',
  },
  inputRowOff: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  prefix: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#0F172A',
    marginLeft: wp(2.5),
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#0F172A',
    marginLeft: wp(2),
    paddingVertical: 0,
  },
  inputOff: { color: '#64748B' },
  buttonRow: { flexDirection: 'row', gap: wp(3), marginTop: hp(3) },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1.6),
    borderRadius: 999,
  },
  saveText: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 15 },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: hp(1.6),
    borderRadius: 999,
  },
  cancelText: { fontFamily: 'Poppins-Medium', color: '#0F172A', fontSize: 15 },
});
