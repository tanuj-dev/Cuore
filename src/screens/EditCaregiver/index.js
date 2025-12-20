import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';
import ProfileHeader from '../../components/ProfileHeader';
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

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ProfileHeader navigation={navigation} title="Edit Caregiver" />
      {toast.message ? (
        <ToastMessage
          top={60}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ message: '', type: 'success' })}
        />
      ) : null}
      <View style={styles.container}>
        <View style={styles.headerRow}>
          {!isEditing && (
            <TouchableOpacity
              disabled={role == 'caregiver'}
              onPress={() => setIsEditing(true)}
            >
              <Image source={Images.EDIT} style={styles.editIcon} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Caregiver Name</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={caregiverName}
            editable={isEditing}
            onChangeText={handleNameChange}
            placeholder="Enter caregiver name"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Caregiver Mobile</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={caregiverMobile}
            editable={isEditing}
            keyboardType="number-pad"
            onChangeText={handleMobileChange}
            placeholder="+91XXXXXXXXXX"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {isEditing && (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default memo(EditCaregiver);

const styles = StyleSheet.create({
  container: {
    padding: wp(5),
    margin: wp(4),
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: hp(2),
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
  },
  input: {
    fontSize: 16,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: wp(3),
    height: hp(6),
    color: '#111827',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
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
    width: wp(40),
    borderRadius: 8,
  },
  saveText: {
    color: '#fff',
    fontSize: 14,
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
    color: '#000',
    fontSize: 14,
  },
});
