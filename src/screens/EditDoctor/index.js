import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';
import ProfileHeader from '../../components/ProfileHeader';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../redux/slices';
import ToastMessage from '../../components/Toast';

const EditDoctor = ({ navigation }) => {
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

  const renderInputField = (
    label,
    value,
    onChangeText,
    keyboardType = 'default',
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          editable={isEditing}
          keyboardType={keyboardType}
          placeholder={label}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.screen}>
        <ProfileHeader navigation={navigation} title="Add/Edit Doctor" />

        {toastMessage && (
          <ToastMessage
            message={toastMessage}
            type={toastType}
            onHide={() => setToastMessage('')}
            top={60}
          />
        )}

        <View style={styles.container}>
          {!isEditing && (
            <TouchableOpacity
              disabled={role === 'caregiver'}
              style={styles.editButtonWrap}
              onPress={() => setIsEditing(true)}
            >
              <Image source={Images.EDIT} style={styles.editIcon} />
            </TouchableOpacity>
          )}

          {renderInputField(
            'Doctor Name',
            doctorName,
            handleNameChange,
            'default',
          )}
          {renderInputField(
            'Doctor Mobile',
            doctorMobile,
            handleMobileChange,
            'phone-pad',
          )}
          {renderInputField(
            'Doctor Code',
            doctorCode,
            handleCodeChange,
            'default',
          )}

          <View style={styles.buttonRow}>
            {isEditing && (
              <>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSave}
                >
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.noteText}>
            I do not have a Cuore-partnered doctor
          </Text>
          <TouchableOpacity
            disabled={role === 'caregiver'}
            onPressIn={() => navigation.navigate('Doctor')}
            style={styles.findBtn}
          >
            <Text style={styles.findText}>Find Cuore-Partnered Doctors</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: wp(5),
    minHeight: hp(80),
    margin: wp(4),
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'android' && { elevation: 1 }),
  },
  editButtonWrap: {
    marginBottom: hp(2),
    alignSelf: 'flex-end',
  },
  editIcon: {
    width: wp(5),
    height: wp(5),
    resizeMode: 'contain',
  },
  inputGroup: {
    marginBottom: hp(2),
  },
  label: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#475569',
    marginBottom: hp(0.5),
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: wp(3),
    paddingVertical: Platform.OS === 'ios' ? hp(1) : hp(0.5),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#1E293B',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(3),
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: '#11418A',
    paddingVertical: hp(1.5),
    width: wp(40),
    borderRadius: 10,
  },
  saveText: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    width: wp(40),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: hp(1.5),
    borderRadius: 10,
  },
  cancelText: {
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  noteText: {
    alignSelf: 'center',
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    fontSize: 15,
    fontStyle: 'italic',
    marginTop: hp(24),
    letterSpacing: 0.2,
  },
  findBtn: {
    backgroundColor: '#11418A',
    padding: hp(1.5),
    marginHorizontal: hp(6),
    borderRadius: 10,
    marginTop: hp(1),
  },
  findText: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    fontSize: 14,
    alignSelf: 'center',
    letterSpacing: 0.2,
  },
});

export default EditDoctor;
