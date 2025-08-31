import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Linking,
  TextInput,
} from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
import {hp, wp, Images} from '../../utilities'; // your responsive helpers

const DeleteAccount = ({navigation}) => {
  return (
    <View>
      <View style={{
          backgroundColor: '#FFFFFF',
          elevation: 1,
      }}>
 <View
        style={{
       
        
          alignItems: 'center',
          padding: hp(2),
          flexDirection: 'row',
           marginTop:Platform.OS =='ios'&& hp(5),
        }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={Images.BACK_BUTTON}
            style={{
              height: hp(3),
              width: wp(4),
              resizeMode: 'contain',
              tintColor: '#000000',
            }}
          />
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: 'Roboto-Regular',
            fontSize: 20,
            fontWeight: '400',
            color: '#000000',
            marginLeft: hp(2),
          }}>
        Delete Account
        </Text>
      </View>
      </View>

      <View style={styles.container}>
        <View style={{flexDirection: 'row'}}>
          <Image
            source={Images.WARNING}
            style={{
              height: hp(4),
              width: wp(6),
              resizeMode: 'contain',
              tintColor: '#EF4444',
            }}
          />
          <Text style={[styles.heading, {marginLeft: hp(2), color: '#EF4444'}]}>
            Warning
          </Text>
        </View>
        <Text
          style={{
            fontFamily: 'Roboto-Regular',
            fontSize: 14,
            fontWeight: '400',
            color: '#4B5563',
          }}>
          Deleting your account will permanently remove all your data,
          including:
        </Text>
        <View style={{marginTop: hp(1)}}>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 14,
              fontWeight: '400',
              color: '#4B5563',
              marginVertical: hp(1.8),
            }}>{`•  ${'Personal information'}`}</Text>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 14,
              fontWeight: '400',
              color: '#4B5563',
            }}>{`•   ${'Health records'}`}</Text>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 14,
              fontWeight: '400',
              color: '#4B5563',
              marginVertical: hp(1.8),
            }}>{`•   ${'Activity history'}`}</Text>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 14,
              fontWeight: '400',
              color: '#4B5563',
            }}>{`•   ${'Saved preferences'}`}</Text>
        </View>
      </View>
      <View style={styles.container}>
        <Text style={{fontSize: 14, fontWeight: '400', color: '#4B5563'}}>
          Type "DELETE" to confirm
        </Text>
        <TextInput
          placeholder="Type DELETE"
          placeholderTextColor={'#6B7280'}
          style={styles.input}></TextInput>

        <TouchableOpacity style={styles.continueBtn}>
          <Text style={styles.continueText}>Delete Account</Text>
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: 'Roboto-Regular',
            marginTop: hp(2),
            fontSize: 14,
            fontWeight: '400',
            color: '#4B5563',
            alignSelf: 'center',
          }}>
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
  continueText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '400',
  },
  input: {paddingVertical:hp(1.5),
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
