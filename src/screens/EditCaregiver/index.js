import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';
import ProfileHeader from '../../components/ProfileHeader';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, getProfile } from '../../redux/slices';
import ToastMessage from '../../components/Toast';

const EditCaregiver = ({ navigation }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

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

  return (
    <View style={styles.screen}>
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
              disabled={role === 'caregiver'}
              onPress={() => setIsEditing(true)}
            >
              <Image source={Images.EDIT} style={styles.editIcon} />
            </TouchableOpacity>
          )}
        </View>

        {/* <View style={styles.inputGroup}>
          <Text style={styles.label}>Caregiver Name</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={caregiverName}
            editable={isEditing}
            onChangeText={handleNameChange}
            placeholder="Enter caregiver name"
            placeholderTextColor={c.inputPlaceholder}
          />
        </View> */}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Caregiver Mobile</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={caregiverMobile}
            editable={isEditing}
            keyboardType="number-pad"
            onChangeText={handleMobileChange}
            placeholder="+91XXXXXXXXXX"
            placeholderTextColor={c.inputPlaceholder}
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

const createStyles = c => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.surface,
  },
  container: {
    padding: wp(5),
    margin: wp(4),
    backgroundColor: c.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    ...(Platform.OS === 'android' && { elevation: 1 }),
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
    tintColor: c.navIconTint,
  },
  inputGroup: {
    marginBottom: hp(2),
  },
  label: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.subText,
    marginBottom: hp(0.5),
    letterSpacing: 0.2,
  },
  input: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    paddingHorizontal: wp(3),
    height: hp(6),
    color: c.text,
  },
  disabledInput: {
    backgroundColor: c.mutedSurface,
    color: c.tabInactive,
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
    color: c.card,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  cancelBtn: {
    backgroundColor: c.card,
    width: wp(40),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: hp(1.5),
    borderRadius: 10,
  },
  cancelText: {
    fontFamily: 'Poppins-Regular',
    color: c.subText,
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
