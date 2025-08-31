import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {hp, wp, Images} from '../../utilities';

const EditProfile = ({navigation}) => {
  const [userName, setUserName] = useState('M. Johnson');
  const [userMobile, setUserMobile] = useState('981121234');
  const [confirmMobile, setConfirmMobile] = useState('981121234');
  const [profileImage, setProfileImage] = useState(null);
  const [editName, setEditName] = useState(false);
  const [editMobile, setEditMobile] = useState(false);
  const [editConfirm, setEditConfirm] = useState(false);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleImagePicker = async type => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      maxWidth: 500,
      maxHeight: 500,
    };

    try {
      if (type === 'camera') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          Alert.alert(
            'Permission required',
            'Camera permission is needed to take photos',
          );
          return;
        }
        launchCamera(options, response => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
          } else if (response.error) {
            console.log('ImagePicker Error: ', response.error);
          } else if (response.assets && response.assets.length > 0) {
            setProfileImage(response.assets[0].uri);
            // return(response.assets[0].uri);
          }
        });
      } else {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert(
            'Permission required',
            'Storage permission is needed to access photos',
          );
          return;
        }
        launchImageLibrary(options, response => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
          } else if (response.error) {
            console.log('ImagePicker Error: ', response.error);
          } else if (response.assets && response.assets.length > 0) {
            setProfileImage(response.assets[0].uri);
            // return(response.assets[0].uri);
          }
        });
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => handleImagePicker('camera'),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => handleImagePicker('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      {cancelable: true},
    );
  };

  const handleSave = () => {
    if (userMobile !== confirmMobile) {
      Alert.alert('Error', 'Mobile numbers do not match');
      return;
    }
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancel = () => {
    setUserName('M. Johnson');
    setUserMobile('981121234');
    setConfirmMobile('981121234');
    setProfileImage(null);
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? hp(8) : 0}
      style={{flex: 1}}>
      <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled">
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
         Edit Profile
        </Text>
      </View>
      </View>
          <View style={styles.container}>
            <View style={{flexDirection: 'row', marginBottom: hp(4)}}>
              <TouchableOpacity onPress={showImagePickerOptions}>
                {profileImage ? (
                  <Image
                    source={{uri: profileImage}}
                    style={{
                      width: wp(13),
                      height: wp(13),
                      borderRadius: wp(10),
                      resizeMode: 'cover',
                    }}
                  />
                ) : (
                  <Image
                    style={{
                      resizeMode: 'contain',
                      height: hp(5),
                      width: wp(12),
                    }}
                    source={Images.UNCLE}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={showImagePickerOptions}
                style={{
                  borderWidth: 1,
                  paddingHorizontal: hp(4),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: hp(5),
                  borderColor: '#E5E7EB',
                  borderRadius: hp(0.5),
                }}>
                <Text
                  style={{fontSize: 16, fontWeight: '400', color: '#374151'}}>
                  Upload Profile Picture
                </Text>
              </TouchableOpacity>
            </View>
            {renderInputField(
              'User Name',
              userName,
              editName,
              setUserName,
              () => setEditName(true),
            )}
            {renderInputField(
              'User Mobile',
              userMobile,
              editMobile,
              setUserMobile,
              () => setEditMobile(true),
            )}
            {renderInputField(
              'Confirm User Mobile',
              confirmMobile,
              editConfirm,
              setConfirmMobile,
              () => setEditConfirm(true),
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  navigation.goBack();

                  handleCancel();
                }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ... keep your existing styles ...

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
    fontFamily: 'Roboto-Regular',
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
    fontFamily: 'Roboto-Regular',
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

export default EditProfile;
