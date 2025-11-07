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
    // Allow only alphanumeric and up to 8 chars
    const formatted = text.replace(/[^a-zA-Z0-9]/g, '');
    if (formatted.length <= 8) {
      setDoctorCode(formatted);
    } else {
      setToastMessage('Doctor code cannot exceed 8 characters.');
      setToastType('error');
    }
  };

  const handleSave = async () => {
    // Extract the number part after +91

    if (
      !userID ||
      !doctorName ||
      doctorMobile.length !== 10 ||
      doctorCode.length !== 8
    ) {
      setToastMessage('Please fill valid details for all required fields.');
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
    <ScrollView style={{ backgroundColor: 'white' }}>
      <View style={{ backgroundColor: '#F3F4F6', flex: 1 }}>
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
              style={{ marginBottom: hp(2), alignSelf: 'flex-end' }}
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
                  style={{ ...styles.saveBtn, width: wp(40) }}
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
  container: {
    padding: wp(5),
    height: hp(80),
    margin: wp(4),
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
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
    fontSize: 14,
    color: '#374151',
    marginBottom: hp(0.5),
    fontWeight: '400',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: wp(3),
    paddingVertical: Platform.OS === 'ios' ? hp(1) : hp(0),
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#6B7280',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(3),
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1.5),
    borderRadius: 8,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    width: wp(40),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
    paddingVertical: hp(1.5),
    borderRadius: 8,
  },
  cancelText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '400',
  },
  noteText: {
    alignSelf: 'center',
    color: '#000000',
    fontSize: 15,
    fontWeight: '400',
    fontStyle: 'italic',
    marginTop: hp(24),
  },
  findBtn: {
    backgroundColor: '#1E64AC',
    padding: hp(1.5),
    marginHorizontal: hp(6),
    borderRadius: hp(0.5),
    marginTop: hp(1),
  },
  findText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    alignSelf: 'center',
  },
});

export default EditDoctor;
