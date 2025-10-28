import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
import { hp, wp, Images } from '../../utilities'; // your responsive helpers
import ProfileHeader from '../../components/ProfileHeader';

const SelectPersona = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = [
    {
      id: 'user',
      title: 'User',
      description: 'Access your health plan and track your progress',
    },
    {
      id: 'caregiver',
      title: 'Caregiver',
      description: "Stay connected with your loved one's health journey",
    },
  ];

  const handleContinue = () => {
    if (!selectedRole) {
      Alert.alert('Please select a role to continue');
      return;
    }

    Alert.alert('Selected Role', selectedRole);
    // You can now navigate or send this data to backend
  };

  return (
    <View>
      <ProfileHeader navigation={navigation} title="Select Persona" />

      <View style={styles.container}>
        <Text style={styles.heading}>Choose Your Role</Text>

        {roles.map(role => (
          <TouchableOpacity
            key={role.id}
            style={[
              styles.roleCard,
              selectedRole === role.id && styles.selectedCard,
            ]}
            onPress={() => setSelectedRole(role.id)}
          >
            <View style={styles.radioWrapper}>
              <View
                style={{
                  height: hp(2.5),
                  width: wp(5),
                  borderWidth: 1,
                  borderRadius: hp(2),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    height: hp(1.5),
                    width: wp(3),
                    borderRadius: hp(4),
                    backgroundColor: selectedRole === role.id ? '#1E64AC' : '',
                  }}
                ></View>
              </View>
              <View style={styles.roleText}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDesc}>{role.description}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
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
    height: hp(80),
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
  selectedCard: {
    borderColor: '#1c5fd4',
    backgroundColor: '#f0f6ff',
  },
  radioWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: { fontFamily: 'Roboto-Regular', marginLeft: wp(3), flex: 1 },
  roleTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 4,
  },
  roleDesc: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  continueBtn: {
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1.8),
    borderRadius: 8,
    alignItems: 'center',
    marginTop: hp(6),
  },
  continueText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
  },
});

export default SelectPersona;
