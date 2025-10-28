import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hp, wp, Images } from '../../utilities'; // Your responsive helpers
import ProfileHeader from '../../components/ProfileHeader';

const EditCaregiver = ({ navigation }) => {
  const [userName, setUserName] = useState('John Mace');
  const [userMobile, setUserMobile] = useState('981121234');
  const [confirmMobile, setConfirmMobile] = useState('981121234');

  const [editName, setEditName] = useState(false);
  const [editMobile, setEditMobile] = useState(false);
  const [editConfirm, setEditConfirm] = useState(false);

  const handleSave = ({ navigation }) => {
    if (userMobile !== confirmMobile) {
      Alert.alert('Error', 'Mobile numbers do not match');
      return;
    }
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancel = () => {
    setUserName('John Mace');
    setUserMobile('981121234');
    setConfirmMobile('981121234');
    setEditName(false);
    setEditMobile(false);
    setEditConfirm(false);
  };

  const renderInputField = (label, value, editable, setValue, toggleEdit) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          editable={editable}
          onChangeText={setValue}
          placeholder={label}
        />
        <TouchableOpacity onPress={toggleEdit}>
          <Image source={Images.EDIT} style={styles.arrowIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View>
      <ProfileHeader navigation={navigation} title="Edit Caregiver" />

      <View style={styles.container}>
        {renderInputField(
          'Caregiver Name',
          userName,
          editName,
          setUserName,
          () => setEditName(true),
        )}
        {renderInputField(
          'Caregiver Mobile',
          userMobile,
          editMobile,
          setUserMobile,
          () => setEditMobile(true),
        )}
        {renderInputField(
          'Confirm Caregiver Mobile',
          confirmMobile,
          editConfirm,
          setConfirmMobile,
          () => setEditConfirm(true),
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>Notify</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();

              handleCancel();
            }}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  inputGroup: {
    marginBottom: hp(2),
  },
  label: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
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
    height: hp(6),
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    justifyContent: 'space-between',
  },
  input: {
    fontFamily: 'Roboto-Regular',
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
    paddingHorizontal: wp(6),
    width: wp(40),
    borderRadius: 8,
  },
  saveText: {
    color: 'white',
    fontFamily: 'Roboto-Regular',
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
    paddingHorizontal: wp(6),
    borderRadius: 8,
  },
  cancelText: {
    fontFamily: 'Roboto-Regular',
    color: '#000000',
    fontSize: 14,
    fontWeight: '400',
  },
  arrowIcon: {
    width: wp(4),
    height: wp(4),
    resizeMode: 'contain',
    // tintColor: 'black',
  },
});

export default EditCaregiver;
