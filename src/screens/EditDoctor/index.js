import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hp, wp, Images } from '../../utilities'; // Your responsive helpers
import ProfileHeader from '../../components/ProfileHeader';

const EditDoctor = ({ navigation }) => {
  const [doctorName, setDoctorName] = useState('Dr. Sarah James');
  const [doctorMobile, setDoctorMobile] = useState('981121234');
  const [confirmMobile, setConfirmMobile] = useState('981121234');

  const [editName, setEditName] = useState(false);
  const [editMobile, setEditMobile] = useState(false);
  const [editConfirm, setEditConfirm] = useState(false);

  const handleSave = ({}) => {
    if (doctorMobile !== confirmMobile) {
      Alert.alert('Error', 'Mobile numbers do not match');
      return;
    }
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancel = () => {
    setDoctorName('John Mace');
    setDoctorMobile('981121234');
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
          placeholder={'value'}
        />
        <TouchableOpacity onPress={toggleEdit}>
          <Image source={Images.EDIT} style={styles.arrowIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={{ backgroundColor: 'white' }}>
      <View style={{ backgroundColor: '#F3F4F6', flex: 1 }}>
        <ProfileHeader navigation={navigation} title="Add/Edit Doctor" />
        <View style={styles.container}>
          {renderInputField(
            'Doctor Name',
            doctorName,
            editName,
            setDoctorName,
            () => setEditName(true),
          )}
          {renderInputField(
            'Doctor Mobile',
            doctorMobile,
            editMobile,
            setDoctorMobile,
            () => setEditMobile(true),
          )}
          {renderInputField(
            'Doctor Code',
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
              style={styles.cancelBtn}
              onPress={() => {
                navigation.goBack();

                handleCancel();
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <Text
            style={{
              alignSelf: 'center',
              color: '#000000',
              fontSize: 15,
              fontWeight: '400',
              fontStyle: 'italic',
              marginTop: hp(24),
            }}
          >
            I do not have a Cuore-partnered doctor
          </Text>
          <TouchableOpacity
            onPressIn={() => navigation.navigate('Doctor')}
            style={{
              backgroundColor: '#1E64AC',
              padding: hp(1.5),
              marginHorizontal: hp(6),
              borderRadius: hp(0.5),
              marginTop: hp(1),
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: '400',
                alignSelf: 'center',
              }}
            >
              Find Cuore-Partnered Doctors
            </Text>
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
    height: hp(6),
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    justifyContent: 'space-between',
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
    paddingHorizontal: wp(6),
    width: wp(40),
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
    paddingHorizontal: wp(6),
    borderRadius: 8,
  },
  cancelText: {
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

export default EditDoctor;
