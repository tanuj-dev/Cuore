import React, { useEffect, useState } from 'react';
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
  Linking,
  ActivityIndicator,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hp, wp, Images } from '../../utilities';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, getProfile } from './../../redux/slices';
import ToastMessage from '../../components/Toast';


const EditProfile = ({ navigation }) => {
  const [userName, setUserName] = useState('M. Johnson');
  const [userMobile, setUserMobile] = useState('981121234');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [profileImage, setProfileImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // ✅ single edit mode toggle
  const [isLoading, setIsLoading] = useState(false); // ✅ loading state for save

  const dispatch = useDispatch();
  const userID = useSelector(state => state.auth.userId);
  const userProfile = useSelector(state => state.profile.data?.data?.user);

  useEffect(() => {
    setUserName(userProfile?.display_name || 'M. Johnson');
    setUserMobile(
      userProfile?.phone?.startsWith('+91')
        ? userProfile.phone.slice(3)
        : userProfile.phone,
    );
    // Set existing profile photo if available (check both field names)
    const photoUrl = userProfile?.photo_url || userProfile?.photoUrl;
    if (photoUrl) {
      console.log('Setting profile image from Redux:', photoUrl);
      console.log('Full userProfile object:', JSON.stringify(userProfile, null, 2));
      setProfileImage(photoUrl);
    } else {
      console.log('No photo URL found in userProfile');
      console.log('userProfile keys:', userProfile ? Object.keys(userProfile) : 'userProfile is null');
    }
  }, [userProfile]);

  // 🔐 Camera & storage permissions
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
        const androidVersion = Platform.Version;
        let permission;
        
        // Android 13+ uses READ_MEDIA_IMAGES
        if (androidVersion >= 33) {
          permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
        } else {
          // Android 12 and below use READ_EXTERNAL_STORAGE
          permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        }
        
        // Check if permission is already granted
        const checkResult = await PermissionsAndroid.check(permission);
        if (checkResult) {
          return true;
        }
        
        // Request permission
        const granted = await PermissionsAndroid.request(
          permission,
          {
            title: 'Gallery Permission',
            message: 'This app needs access to your gallery to select profile photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Storage permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
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
          if (response.assets && response.assets.length > 0) {
            setProfileImage(response.assets[0].uri);
          }
        });
      } else {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Gallery permission is needed to select photos. Please enable it in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Settings', 
                onPress: () => {
                  // On Android, you can open app settings
                  if (Platform.OS === 'android') {
                    Linking.openSettings();
                  }
                }
              },
            ],
          );
          return;
        }
        launchImageLibrary(options, response => {
          if (response.assets && response.assets.length > 0) {
            setProfileImage(response.assets[0].uri);
          }
        });
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const showImagePickerOptions = () => {
    if (!isEditing) return; // only allow editing mode to change photo
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => handleImagePicker('camera') },
        {
          text: 'Choose from Gallery',
          onPress: () => handleImagePicker('gallery'),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
    );
  };

  // ✅ Single button handles both edit & save
  const handleEditOrSave = async () => {
    // Validation before saving
    if (!userName.trim() || !userMobile.trim()) {
      setToastMessage('Please fill in all required fields.');
      setToastType('error');
      return;
    }
    if (userName.length > 15) {
      setToastMessage('User name cannot exceed 15 characters.');
      setToastType('error');
      return;
    }
    if (userMobile.length !== 10) {
      setToastMessage('Mobile number must be exactly 10 digits.');
      setToastType('error');
      return;
    }

    setIsLoading(true); // Start loading

    const userId = userID;
    let payload;

    // Check if profileImage is a local file (needs upload) or a URL (already uploaded)
    const isLocalFile = profileImage && (
      profileImage.startsWith('file://') || 
      profileImage.startsWith('/') ||
      !profileImage.startsWith('http')
    );

    // If profileImage exists and is a local file, create FormData (for image upload)
    if (profileImage && isLocalFile) {
      const formData = new FormData();
      
      // Add text fields as form data
      formData.append('display_name', userName.trim());
      formData.append('phone', `+91${userMobile.trim()}`);
      
      // Add image file - backend expects field name 'profileImage'
      const imageFile = {
        uri: Platform.OS === 'ios' 
          ? profileImage.replace('file://', '') 
          : profileImage,
        type: 'image/jpeg',
        name: `profile_${Date.now()}.jpg`,
      };
      formData.append('profileImage', imageFile);
      
      payload = formData;
      console.log('📤 Uploading profile with image via FormData');
      console.log('📤 FormData fields:', ['display_name', 'phone', 'profileImage']);
    } else {
      // No new image or image is already a URL - send as regular JSON object
      payload = {
        display_name: userName.trim(),
        phone: `+91${userMobile.trim()}`,
      };
      console.log('📤 Updating profile without new image via JSON');
    }

    try {
      const resultAction = await dispatch(
        updateProfile({ userId, profileData: payload }),
      );

      if (updateProfile.fulfilled.match(resultAction)) {
        setToastMessage('Profile updated successfully!');
        setToastType('success');
        setIsEditing(false); // exit edit mode
        setProfileImage(null); // Clear local image state
        dispatch(getProfile(userId)); // refresh profile data
      } else {
        const errorMessage =
          resultAction.payload?.message || 'Failed to update profile';
        setToastMessage(errorMessage);
        setToastType('error');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setToastMessage('Something went wrong. Please try again.');
      setToastType('error');
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handleCancel = () => {
    setUserName(userProfile?.display_name || '');
    setUserMobile(userProfile?.phone || '');
    setProfileImage(null);
    setIsEditing(false);
  };
  const handleNameChange = text => {
    if (text.length <= 15) {
      setUserName(text);
    } else {
      setToastMessage('User name cannot exceed 15 characters.');
      setToastType('error');
    }
  };

  const handleMobileChange = text => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 10) {
      setUserMobile(digits);
    } else {
      setToastMessage('Mobile number cannot exceed 10 digits.');
      setToastType('error');
    }
  };

  const renderInputField = (label, value, setValue, numeric) => {
    const isMobile = numeric === 'numeric';
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>

        {isMobile ? (
          <View
            style={[
              styles.input,
              {
                backgroundColor: isEditing ? '#FFF' : '#F3F4F6',
                flexDirection: 'row',
                alignItems: 'center',
              },
            ]}
          >
            <Text style={styles.prefixText}>+91</Text>
            <TextInput
              style={{ flex: 1, color: '#6B7280', fontSize: 16 }}
              value={value}
              editable={isEditing}
              onChangeText={handleMobileChange}
              placeholder="Enter mobile number"
              keyboardType="numeric"
            />
          </View>
        ) : (
          <TextInput
            style={[
              styles.input,
              { backgroundColor: isEditing ? '#FFF' : '#F3F4F6' },
            ]}
            value={value}
            editable={isEditing}
            onChangeText={handleNameChange}
            placeholder={label}
          />
        )}

        {isMobile && value.length === 11 && (
          <Text style={styles.helperText}>Max 10 digits allowed</Text>
        )}
        {!isMobile && value.length === 16 && (
          <Text style={styles.helperText}>Max 15 characters allowed</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? hp(8) : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, backgroundColor: '#F9FAFB' }}
          keyboardShouldPersistTaps="handled"
        >
          {toastMessage && (
            <ToastMessage
              top={60}
              message={toastMessage}
              type={toastType}
              onHide={() => setToastMessage('')}
            />
          )}
          <View>
            {/* Header */}
            <View style={{ backgroundColor: '#FFFFFF', elevation: 1 }}>
              <View
                style={{
                  alignItems: 'center',
                  padding: hp(2),
                  flexDirection: 'row',
                }}
              >
                <TouchableOpacity
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  onPress={() => navigation.goBack()}
                >
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
                  }}
                >
                  Edit Profile
                </Text>
              </View>
            </View>

            {/* Profile Content */}
            <View style={styles.container}>
              <View
                style={{
                  flexDirection: 'row',
                  marginBottom: hp(4),
                  alignItems: 'center',
                }}
              >
                <TouchableOpacity onPress={showImagePickerOptions}>
                  {profileImage || userProfile?.photo_url || userProfile?.photoUrl ? (
                    <Image
                      key={profileImage || userProfile?.photo_url || userProfile?.photoUrl}
                      source={{ 
                        uri: (profileImage || userProfile?.photo_url || userProfile?.photoUrl)?.trim()
                      }}
                      style={{
                        width: wp(13),
                        height: wp(13),
                        borderRadius: wp(10),
                        resizeMode: 'cover',
                      }}
                      onError={(error) => {
                        console.log('Image load error:', error.nativeEvent?.error || error);
                        const imageUri = profileImage || userProfile?.photo_url || userProfile?.photoUrl;
                        console.log('Failed to load image URI:', imageUri);
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully');
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
                {!isEditing && (
                  <TouchableOpacity
                    style={{ marginLeft: hp(30) }}
                    onPress={() => setIsEditing(true)}
                  >
                    <Image source={Images.EDIT} style={styles.editIcon} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={showImagePickerOptions}>
                  <Text
                    style={{
                      marginLeft: hp(2),
                      fontSize: 14,
                      color: '#374151',
                    }}
                  >
                    {isEditing ? 'Tap to change picture' : ''}
                  </Text>
                </TouchableOpacity>
              </View>

              {renderInputField('User Name', userName, setUserName, 'alpha')}
              {renderInputField(
                'User Mobile',
                userMobile,
                setUserMobile,
                'numeric',
              )}

              <View style={styles.buttonRow}>
                {isEditing && (
                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      { 
                        backgroundColor: isEditing ? '#1E64AC' : '#1E64AC',
                        opacity: isLoading ? 0.7 : 1,
                      },
                    ]}
                    onPress={handleEditOrSave}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.saveText}>{'Save Changes'}</Text>
                    )}
                  </TouchableOpacity>
                )}

                {isEditing && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleCancel}
                    disabled={isLoading}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: wp(5),
    margin: wp(4),
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  prefixText: {
    color: '#6B7280',
    fontSize: 16,
    marginRight: wp(1),
    fontWeight: '500',
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
  input: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: '#6B7280',
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
  },
  helperText: {
    fontSize: 12,
    color: 'gray',
    marginTop: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(3),
  },
  saveBtn: {
    alignItems: 'center',
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
  editIcon: {
    width: wp(5),
    height: wp(5),
    resizeMode: 'contain',
  },
});

export default EditProfile;
