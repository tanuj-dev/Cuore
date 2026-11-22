import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Pencil, Phone, UserRound, Hash, Stethoscope, Search } from 'lucide-react-native';
import { hp, wp } from '../../utilities';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../redux/slices';
import ToastMessage from '../../components/Toast';

const EditDoctor = ({ navigation }) => {
  useLightStatusBar();
  const [doctorName, setDoctorName] = useState('');
  const [doctorMobile, setDoctorMobile] = useState('+91');
  const [doctorCode, setDoctorCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const dispatch = useDispatch();
  const userID = useSelector(state => state.auth.userId);
  const userProfile = useSelector(state => state.profile.data?.data?.doctor);
  const role = useSelector(state => state.auth.role);

  useEffect(() => {
    if (userProfile) {
      setDoctorName(userProfile.name || '');
      setDoctorMobile(
        userProfile?.mobile?.startsWith('+91')
          ? userProfile.mobile.slice(3)
          : userProfile.mobile,
      );
      setDoctorCode(userProfile.doctorCode || '');
    }
  }, [userProfile]);

  // ✅ Handle input validations
  const handleNameChange = text => {
    if (text.length <= 20) {
      setDoctorName(text);
    } else {
      setToastMessage('Doctor name cannot exceed 20 characters.');
      setToastType('error');
    }
  };

  const handleMobileChange = text => {
    // Remove any non-digit characters
    const digitsOnly = text.replace(/[^0-9]/g, '');
    if (digitsOnly.length <= 10) {
      setDoctorMobile(digitsOnly);
    } else {
      setToastMessage('Mobile number cannot exceed 10 digits.');
      setToastType('error');
    }
  };

  const handleCodeChange = text => {
    // Accept whatever the user types
    if (text.length <= 10) {
      setDoctorCode(text);
    } else {
      setToastMessage('Doctor code cannot exceed 10 characters.');
      setToastType('error');
    }
  };

  const handleSave = async () => {
    // per-field validation with specific messages
    if (!userID) {
      setToastMessage('User not found. Please log in again.');
      setToastType('error');
      return;
    }

    if (!doctorName.trim()) {
      setToastMessage('Please enter the doctor name.');
      setToastType('error');
      return;
    }

    if (!doctorMobile || doctorMobile.length !== 10) {
      setToastMessage('Please enter a valid 10-digit mobile number.');
      setToastType('error');
      return;
    }

    if (!doctorCode.trim() || doctorCode.length !== 10) {
      setToastMessage('Please enter a valid 10-character doctor code.');
      setToastType('error');
      return;
    }

    const payload = {
      display_name: '',
      phone: '',
      caregiver_mobile: '',
      doctor_code: doctorCode.trim(),
      doctor_name: doctorName.trim(),
      doctor_phone: doctorMobile.trim(),
      consent_flags: {
        tos: true,
        share_with_doctor: true,
      },
    };

    try {
      const resultAction = await dispatch(
        updateProfile({ userId: userID, profileData: payload }),
      );

      if (updateProfile.fulfilled.match(resultAction)) {
        setToastMessage('Profile updated successfully!');
        setToastType('success');
        setIsEditing(false);
      } else {
        const errorMessage =
          resultAction.payload?.message || 'Failed to update profile';
        setToastMessage(errorMessage);
        setToastType('error');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setToastMessage('Something went wrong. Please try again.');
      setToastType('error');
    }
  };

  const handleCancel = () => {
    setDoctorName(userProfile?.name || '');
    setDoctorMobile(userProfile?.mobile ? `+91${userProfile.mobile}` : '+91');
    setDoctorCode(userProfile?.doctorCode || '');
    setIsEditing(false);
  };

  const canEdit = role !== 'caregiver';

  const renderInputField = (label, value, onChangeText, Icon, keyboardType = 'default') => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, !isEditing && styles.inputRowOff]}>
        <Icon size={18} color="#94A3B8" />
        <TextInput
          style={[styles.input, !isEditing && styles.inputOff]}
          value={value}
          onChangeText={onChangeText}
          editable={isEditing}
          keyboardType={keyboardType}
          placeholder={label}
          placeholderTextColor="#94A3B8"
        />
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <HeroHeader
        title="Your Doctor"
        subtitle="Link the doctor who looks after you"
        onBack={() => navigation.goBack()}
        right={
          !isEditing && canEdit ? (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={styles.heroBtn}
              accessibilityRole="button"
              accessibilityLabel="Edit doctor"
            >
              <Pencil size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null
        }
      />

      {toastMessage ? (
        <ToastMessage
          message={toastMessage}
          type={toastType}
          onHide={() => setToastMessage('')}
          top={60}
        />
      ) : null}

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.tile}>
              <Stethoscope size={20} color="#1E64AC" />
            </View>
            <View style={styles.cardHeadText}>
              <Text style={styles.cardTitle}>Doctor details</Text>
              <Text style={styles.cardSub}>
                {isEditing ? 'Update and save the details' : 'Tap the pencil to edit'}
              </Text>
            </View>
          </View>

          {renderInputField('Doctor Name', doctorName, handleNameChange, UserRound)}
          {renderInputField('Doctor Mobile', doctorMobile, handleMobileChange, Phone, 'phone-pad')}
          {renderInputField('Doctor Code', doctorCode, handleCodeChange, Hash)}

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

        <View style={[styles.card, styles.findCard]}>
          <Text style={styles.noteText}>
            I do not have a Cuore-partnered doctor
          </Text>
          <TouchableOpacity
            disabled={!canEdit}
            onPress={() => navigation.navigate('Doctor')}
            style={[styles.findBtn, !canEdit && styles.findBtnOff]}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Search size={18} color="#1E64AC" />
            <Text style={styles.findText}>Find Cuore-Partnered Doctors</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  body: { padding: wp(4), gap: hp(2), paddingBottom: hp(6) },
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
  inputGroup: { marginBottom: hp(2) },
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
  input: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#0F172A',
    marginLeft: wp(2.5),
    paddingVertical: 0,
  },
  inputOff: { color: '#64748B' },
  buttonRow: { flexDirection: 'row', gap: wp(3), marginTop: hp(1) },
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
  findCard: { alignItems: 'center' },
  noteText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  findBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    marginTop: hp(1.5),
    paddingVertical: hp(1.6),
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
  },
  findBtnOff: { opacity: 0.5 },
  findText: { fontFamily: 'Poppins-SemiBold', fontSize: 14.5, color: '#1E64AC' },
});

export default EditDoctor;
