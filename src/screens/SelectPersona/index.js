import React, { useState, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
import { hp, wp, Images } from '../../utilities'; // your responsive helpers
import ProfileHeader from '../../components/ProfileHeader';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const SelectPersona = ({ navigation }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const { alert, AlertComponent } = useCustomAlert();
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
    alert('Select a Role', 'Please select a role to continue.');
    return;
  }

  // Role selected — navigate or submit
    // You can now navigate or send this data to backend
  };

  return (
    <>
      {AlertComponent}
      <View style={styles.screen}>
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
              <View style={styles.radioOuter}>
                <View
                  style={[
                    styles.radioInner,
                    selectedRole === role.id && styles.radioInnerSelected,
                  ]}
                />
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
    </>
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
    minHeight: hp(80),
    borderWidth: 1,
    borderColor: c.border,
  },
  heading: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    marginBottom: hp(2),
    color: c.text,
    letterSpacing: 0.2,
  },
  roleCard: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: wp(4),
    marginBottom: hp(2),
    backgroundColor: c.card,
  },
  selectedCard: {
    borderColor: '#11418A',
    backgroundColor: c.mutedSurface,
  },
  radioWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    height: hp(2.5),
    width: wp(5),
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    height: hp(1.5),
    width: wp(3),
    borderRadius: hp(4),
    backgroundColor: 'transparent',
  },
  radioInnerSelected: {
    backgroundColor: '#11418A',
  },
  roleText: {
    fontFamily: 'Poppins-Regular',
    marginLeft: wp(3),
    flex: 1,
  },
  roleTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: c.text,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  roleDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.subText,
    letterSpacing: 0.2,
  },
  continueBtn: {
    backgroundColor: '#11418A',
    paddingVertical: hp(1.8),
    borderRadius: 10,
    alignItems: 'center',
    marginTop: hp(6),
  },
  continueText: {
    fontFamily: 'Poppins-Medium',
    color: c.card,
    fontSize: 14,
    letterSpacing: 0.2,
  },
});

export default SelectPersona;
