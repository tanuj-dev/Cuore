import React, { useState, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
import { hp, wp, Images } from '../../utilities'; // your responsive helpers
import ProfileHeader from '../../components/ProfileHeader';
import { useDispatch, useSelector } from 'react-redux';
import { deleteAccountThunk } from '../../redux/Auth/authThunk';
import { logout } from '../../redux/Auth/slice';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const DeleteAccount = ({ navigation }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const [deleteText, setDeleteText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const dispatch = useDispatch();
  const userId = useSelector(state => state.auth.userId);
  const { alert, AlertComponent } = useCustomAlert();

  const handleDeleteAccount = () => {
    console.log('🔴 Delete button pressed');
    console.log('🔴 Delete text entered:', deleteText);
    console.log('🔴 User ID:', userId);

    // Step 1: Verify user typed "DELETE"
    if (deleteText.trim().toUpperCase() !== 'DELETE') {
      alert(
        'Verification Required',
        'Please type "DELETE" exactly to confirm account deletion.',
        [{ text: 'OK' }],
      );
      return;
    }

    // Step 2: Show confirmation alert
    alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('🟢 User cancelled deletion'),
        },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: () => callDeleteAPI(),
        },
      ],
    );
  };

  const callDeleteAPI = async () => {
    console.log('🔴 Calling delete API...');
    setIsDeleting(true);

    try {
      const result = await dispatch(deleteAccountThunk(userId)).unwrap();

      console.log('✅ Delete API Success:', result);

      // Clear local storage
      await EncryptedStorage.clear();

      // Dispatch logout to clear Redux state
      dispatch(logout());

      // Show success message
      alert('Account Deleted', 'Your account has been successfully deleted.', [
        {
          text: 'OK',
          onPress: () => {
            console.log('🔵 Navigating to Login screen');
            // Navigate to Login screen and reset navigation stack
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]);
    } catch (error) {
      console.error('❌ Delete API Error:', error);

      setIsDeleting(false);

      alert(
        'Delete Failed',
        error?.message || 'Failed to delete account. Please try again later.',
        [{ text: 'OK' }],
      );
    }
  };

  return (
    <View style={styles.screen}>
      {AlertComponent}
      <ProfileHeader navigation={navigation} title="Delete Account" />

      <View style={styles.container}>
        <View style={styles.warningRow}>
          <Image source={Images.WARNING} style={styles.warningIcon} />
          <Text style={styles.heading}>Warning</Text>
        </View>
        <Text style={styles.bodyText}>
          Deleting your account will permanently remove all your data,
          including:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Personal information</Text>
          <Text style={styles.bulletItem}>• Health records</Text>
          <Text style={styles.bulletItem}>• Activity history</Text>
          <Text style={styles.bulletItem}>• Saved preferences</Text>
        </View>
      </View>
      <View style={styles.container}>
        <Text style={styles.confirmLabel}>Type "DELETE" to confirm</Text>
        <TextInput
          placeholder="Type DELETE"
          placeholderTextColor={c.inputPlaceholder}
          style={styles.input}
          value={deleteText}
          onChangeText={setDeleteText}
          editable={!isDeleting}
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={[styles.continueBtn, isDeleting && styles.continueBtnDisabled]}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.continueText}>Delete Account</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footerNote}>This action cannot be undone</Text>
      </View>
    </View>
  );
};

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
    minHeight: hp(28),
    borderWidth: 1,
    borderColor: c.border,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    height: hp(4),
    width: wp(6),
    resizeMode: 'contain',
    tintColor: '#EF4444',
  },
  heading: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    marginLeft: hp(2),
    marginBottom: hp(2),
    color: '#EF4444',
    letterSpacing: 0.2,
  },
  bodyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.subText,
    letterSpacing: 0.2,
  },
  bulletList: {
    marginTop: hp(1),
  },
  bulletItem: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.subText,
    marginVertical: hp(0.5),
    letterSpacing: 0.2,
  },
  confirmLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.subText,
    letterSpacing: 0.2,
  },
  input: {
    fontFamily: 'Poppins-Regular',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    borderWidth: 1,
    marginTop: hp(1.5),
    fontSize: 15,
    borderRadius: 10,
    borderColor: c.border,
    color: c.text,
  },
  continueBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: hp(1.8),
    borderRadius: 10,
    alignItems: 'center',
    marginTop: hp(4),
  },
  continueBtnDisabled: {
    backgroundColor: '#FCA5A5',
    opacity: 0.6,
  },
  continueText: {
    fontFamily: 'Poppins-Medium',
    color: c.card,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  footerNote: {
    fontFamily: 'Poppins-Regular',
    marginTop: hp(2),
    fontSize: 14,
    color: c.subText,
    alignSelf: 'center',
    letterSpacing: 0.2,
  },
});

export default DeleteAccount;
