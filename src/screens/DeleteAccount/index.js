import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { TriangleAlert, Trash2 } from 'lucide-react-native';
import { hp, wp } from '../../utilities';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
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
  useLightStatusBar();

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
      <HeroHeader
        title="Delete Account"
        subtitle="Permanently remove your Cuore account"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, styles.warnCard]}>
          <View style={styles.warningRow}>
            <View style={styles.warnTile}>
              <TriangleAlert size={20} color="#DC2626" />
            </View>
            <Text style={styles.heading}>Before you continue</Text>
          </View>
          <Text style={styles.bodyText}>
            Deleting your account will permanently remove all your data,
            including:
          </Text>
          {LOST_ITEMS.map(item => (
            <View key={item} style={styles.bulletRow}>
              <View style={styles.dot} />
              <Text style={styles.bulletItem}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.confirmLabel}>Type "DELETE" to confirm</Text>
          <TextInput
            placeholder="Type DELETE"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={deleteText}
            onChangeText={setDeleteText}
            editable={!isDeleting}
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={[styles.deleteBtn, isDeleting && styles.deleteBtnDisabled]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Trash2 size={18} color="#FFFFFF" />
                <Text style={styles.deleteText}>Delete Account</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.footerNote}>This action cannot be undone</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const LOST_ITEMS = [
  'Personal information',
  'Health records',
  'Activity history',
  'Saved preferences',
];

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  body: { padding: wp(4), gap: hp(2), paddingBottom: hp(6) },
  card: {
    padding: wp(5),
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  warnCard: { borderColor: '#FECACA' },
  warningRow: { flexDirection: 'row', alignItems: 'center', marginBottom: hp(1.5) },
  warnTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    marginLeft: wp(3),
    color: '#0F172A',
  },
  bodyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#64748B',
    marginBottom: hp(0.5),
  },
  bulletRow: { flexDirection: 'row', alignItems: 'center', marginTop: hp(0.8) },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
    marginRight: wp(2.5),
  },
  bulletItem: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#0F172A',
  },
  confirmLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#0F172A',
  },
  input: {
    fontFamily: 'Poppins-Regular',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderWidth: 1,
    marginTop: hp(1.2),
    fontSize: 15,
    borderRadius: 12,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
  },
  deleteBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#DC2626',
    paddingVertical: hp(1.8),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2.5),
  },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteText: {
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    fontSize: 15,
  },
  footerNote: {
    fontFamily: 'Poppins-Regular',
    marginTop: hp(1.5),
    fontSize: 13,
    color: '#64748B',
    alignSelf: 'center',
  },
});

export default DeleteAccount;
