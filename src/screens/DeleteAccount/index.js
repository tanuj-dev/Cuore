import React, { useState } from 'react';
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
    <View>
      {AlertComponent}
      <ProfileHeader navigation={navigation} title="Delete Account" />

      <View style={styles.container}>
        <View style={{ flexDirection: 'row' }}>
          <Image
            source={Images.WARNING}
            style={{
              height: hp(4),
              width: wp(6),
              resizeMode: 'contain',
              tintColor: '#EF4444',
            }}
          />
          <Text
            style={[styles.heading, { marginLeft: hp(2), color: '#EF4444' }]}
          >
            Warning
          </Text>
        </View>
        <Text
          style={{
            fontFamily: 'Roboto-Regular',
            fontSize: 14,
            fontWeight: '400',
            color: '#4B5563',
          }}
        >
          Deleting your account will permanently remove all your data,
          including:
        </Text>
        <View style={{ marginTop: hp(1) }}>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 14,
              fontWeight: '400',
              color: '#4B5563',
              marginVertical: hp(1.8),
            }}
          >{`•  ${'Personal information'}`}</Text>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 14,
              fontWeight: '400',
              color: '#4B5563',
            }}
          >{`•   ${'Health records'}`}</Text>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 14,
              fontWeight: '400',
              color: '#4B5563',
              marginVertical: hp(1.8),
            }}
          >{`•   ${'Activity history'}`}</Text>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 14,
              fontWeight: '400',
              color: '#4B5563',
            }}
          >{`•   ${'Saved preferences'}`}</Text>
        </View>
      </View>
      <View style={styles.container}>
        <Text style={{ fontSize: 14, fontWeight: '400', color: '#4B5563' }}>
          Type "DELETE" to confirm
        </Text>
        <TextInput
          placeholder="Type DELETE"
          placeholderTextColor={'#6B7280'}
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
        <Text
          style={{
            fontFamily: 'Roboto-Regular',
            marginTop: hp(2),
            fontSize: 14,
            fontWeight: '400',
            color: '#4B5563',
            alignSelf: 'center',
          }}
        >
          This action cannot be undone
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: wp(5),
    margin: wp(4),
    backgroundColor: '#fff',
    borderRadius: 12,
    height: hp(34),
  },
  heading: {
    fontFamily: 'Roboto-Regular',
    fontSize: 18,
    fontWeight: '400',
    marginBottom: hp(2),
    color: '#000000',
  },
  roleCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: wp(4),
    marginBottom: hp(2),
    backgroundColor: '#fff',
  },

  continueBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: hp(1.8),
    borderRadius: 8,
    alignItems: 'center',
    marginTop: hp(4),
  },
  continueBtnDisabled: {
    backgroundColor: '#FCA5A5',
    opacity: 0.6,
  },
  continueText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '400',
  },
  input: {
    paddingVertical: hp(1.5),
    paddingLeft: hp(1),
    fontFamily: 'Roboto-Regular',
    borderWidth: 1,
    marginTop: hp(1.5),
    fontSize: 15,
    borderRadius: hp(1),
    borderColor: '#6B7280',
  },
});

export default DeleteAccount;
