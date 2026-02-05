import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { hp, wp, Images } from '../../utilities';
import ProfileHeader from '../../components/ProfileHeader';
import { uploadPhoto } from '../../redux/uploadPhoto/uploadPhotoThunk';
import { getPresRecordsThunk } from '../../redux/uploadPhoto/getPresRecordsThunk';
import { editFilename } from '../../redux/uploadPhoto/editFilenameThunk';
import { deleteRecord } from '../../redux/uploadPhoto/deleteRecordThunk';

const HealthRecords = ({ navigation }) => {
  const dispatch = useDispatch();
  const userId = useSelector(state => state.auth?.userId);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isPrescription, setIsPrescription] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Prescriptions');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showViewImageModal, setShowViewImageModal] = useState(false);
  const [currentViewImageUrl, setCurrentViewImageUrl] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(false);

  const [records, setRecords] = useState([]);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [editFileNameValue, setEditFileNameValue] = useState('');
  const [isEditingFilename, setIsEditingFilename] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState(null);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // First check if permission is already granted
        const checkResult = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );

        if (checkResult) {
          console.log('Camera permission already granted');
          return true;
        }

        console.log('Requesting camera permission...');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message:
              'This app needs access to your camera to take photos of health records.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        console.log('Permission result:', granted);

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Camera permission granted');
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          console.log('Camera permission denied permanently');
          Alert.alert(
            'Permission Required',
            'Camera permission was denied permanently. Please enable it in your device settings.',
            [
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
          return false;
        } else {
          console.log('Camera permission denied');
          return false;
        }
      } catch (err) {
        console.warn('Camera permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  };

  const pickImageFromCamera = async () => {
    try {
      // iOS Simulator check
      if (Platform.OS === 'ios' && !Platform.constants?.isTesting) {
        // Check if we're likely in simulator
        const isSimulator = !Platform.constants?.uiMode ||
          Platform.constants?.uiMode === 'simulator' ||
          // Additional checks for simulator detection
          !Platform.constants?.systemName?.includes('iPhone');

        if (isSimulator) {
          Alert.alert(
            'Simulator Limitation',
            'Camera is not available in iOS Simulator. Please use a physical device or the Gallery option.',
            [
              {
                text: 'Use Gallery',
                onPress: () => {
                  setShowUploadModal(false);
                  pickImageFromGallery();
                }
              },
              { text: 'Cancel', onPress: () => setShowUploadModal(false) }
            ]
          );
          return;
        }
      }

      // Request camera permission first
      const hasPermission = await requestCameraPermission();

      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to take photos. Please enable it in your device settings.',
          [
            { text: 'OK', onPress: () => setShowUploadModal(false) }
          ]
        );
        return;
      }

      const options = {
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: true,
        includeBase64: false,
        maxWidth: 1920,
        maxHeight: 1920,
      };

      console.log('Launching camera with options:', options);

      // Additional iOS-specific checks
      if (Platform.OS === 'ios') {
        // Small delay to ensure permissions are fully processed
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const result = await launchCamera(options);

      console.log('Camera result:', JSON.stringify(result, null, 2));

      if (result.didCancel) {
        console.log('User cancelled camera');
        setShowUploadModal(false);
        return;
      }

      if (result.errorCode) {
        console.log('Camera Error Code:', result.errorCode);
        console.log('Camera Error Message:', result.errorMessage);

        let errorMessage = result.errorMessage || 'Failed to open camera';
        let showRetryOption = false;

        // Handle specific error codes
        switch (result.errorCode) {
          case 'camera_unavailable':
            if (Platform.OS === 'ios') {
              errorMessage = 'Camera is not available. This can happen if:\n\n' +
                '• You\'re using the iOS Simulator (camera doesn\'t work in simulator)\n' +
                '• Another app is currently using the camera\n' +
                '• iOS temporarily restricted camera access\n\n' +
                'Please try:\n' +
                '1. Close other camera apps\n' +
                '2. Restart this app\n' +
                '3. Use the Gallery option instead';
              showRetryOption = true;
            } else {
              errorMessage = 'Camera is not available. Please check if another app is using the camera.';
              showRetryOption = true;
            }
            break;
          case 'permission':
            errorMessage = 'Camera permission was denied. Please enable it in settings.';
            break;
          case 'others':
            errorMessage = 'An unexpected error occurred. Please try again.';
            break;
        }

        const alertButtons = [
          { text: 'OK', onPress: () => setShowUploadModal(false) }
        ];

        if (showRetryOption) {
          alertButtons.unshift(
            {
              text: 'Use Gallery',
              onPress: () => {
                setShowUploadModal(false);
                pickImageFromGallery();
              }
            }
          );
        }

        Alert.alert('Camera Error', errorMessage, alertButtons);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        console.log('Photo captured:', photo);

        const newFile = {
          uri: photo.uri,
          name: photo.fileName || `health_record_${Date.now()}.jpg`,
          type: photo.type || 'image/jpeg',
          size: photo.fileSize || 0,
        };

        console.log('New file object:', newFile);
        setSelectedFiles(prev => [...prev, newFile]);
        Alert.alert('Success', 'Photo captured successfully!');
      } else {
        console.log('No assets returned from camera');
        Alert.alert('Error', 'No photo was captured. Please try again.');
      }

      setShowUploadModal(false);
    } catch (err) {
      console.log('Camera exception:', err);
      console.log('Error name:', err.name);
      console.log('Error message:', err.message);
      console.log('Error stack:', err.stack);

      let errorMessage = 'Failed to open camera';

      // Handle specific error types
      if (err.message && err.message.includes('permission')) {
        errorMessage = 'Camera permission denied. Please check your device settings.';
      } else if (err.message && err.message.includes('unavailable')) {
        errorMessage = 'Camera is currently unavailable. Please try again later.';
      }

      Alert.alert('Camera Error', errorMessage, [
        { text: 'OK', onPress: () => setShowUploadModal(false) }
      ]);
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const androidVersion = Platform.Version;

        // Android 13+ uses READ_MEDIA_IMAGES
        if (androidVersion >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: 'Gallery Permission',
              message:
                'This app needs access to your gallery to select health record images.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // Android 12 and below use READ_EXTERNAL_STORAGE
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'Gallery Permission',
              message:
                'This app needs access to your gallery to select health record images.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn('Storage permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  };

  const pickImageFromGallery = async () => {
    // Request storage permission first
    const hasPermission = await requestStoragePermission();

    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Gallery permission is required to select images. Please enable it in your device settings.',
      );
      setShowUploadModal(false);
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 0, // 0 means unlimited, or set a number like 5 for max 5 images
      includeBase64: false,
    };

    try {
      const result = await launchImageLibrary(options);

      if (result.didCancel) {
        console.log('User cancelled image picker');
      } else if (result.errorCode) {
        console.log('Image Picker Error:', result.errorMessage);
        Alert.alert('Error', result.errorMessage || 'Failed to open gallery');
      } else if (result.assets && result.assets.length > 0) {
        const newFiles = result.assets.map((photo, index) => ({
          uri: photo.uri,
          name: photo.fileName || `image_${Date.now()}_${index}.jpg`,
          type: photo.type,
          size: photo.fileSize,
        }));
        setSelectedFiles(prev => [...prev, ...newFiles]);
      }
      setShowUploadModal(false);
    } catch (err) {
      console.log('Gallery error:', err);
      Alert.alert('Error', 'Failed to open gallery');
      setShowUploadModal(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('Incomplete', 'Please upload at least one file');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please login again.');
      return;
    }

    try {
      setIsUploading(true);

      // Create FormData with userId and multiple files
      const formData = new FormData();

      // Add userId
      formData.append('userId', userId);

      // Add all selected files (backend expects 'files' field name)
      selectedFiles.forEach((file, index) => {
        const fileData = {
          uri:
            Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
          type: file.type || 'image/jpeg',
          name: file.name || `health_record_${Date.now()}_${index}.jpg`,
        };
        formData.append('files', fileData);
      });

      console.log('📤 Uploading with userId:', userId);
      console.log('📤 Number of files:', selectedFiles.length);
      console.log('📤 Files:', selectedFiles);
      console.log(
        '📤 FormData _parts:',
        JSON.stringify(formData._parts, null, 2),
      );

      // Upload photo to API
      const response = await dispatch(uploadPhoto(formData)).unwrap();

      console.log('📥 Response received:', response);
      console.log('📥 Response status:', response?.status);
      console.log('📥 Response data:', response?.data);

      if (response?.success || response?.data?.success) {
        Alert.alert(
          'Success',
          'Health record uploaded and analyzed successfully!',
        );

        // Reset form
        setSelectedFiles([]);
        setIsPrescription(false);

        // Refresh records list so UI updates with new upload
        getRecords();

        // Navigate to Health screen
        navigation.navigate('Health');
      } else {
        const errorMsg =
          response?.data?.message ||
          response?.data?.error ||
          response?.message ||
          'Failed to upload health record. Please try again.';
        console.error('Upload failed with message:', errorMsg);
        Alert.alert('Upload Failed', errorMsg);
      }
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      const errorMsg =
        error?.data?.message ||
        error?.data?.error ||
        error?.message ||
        'Failed to upload health record. Please try again.';
      Alert.alert('Upload Failed', errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = id => {
    Alert.alert(
      'Delete record',
      'Are you sure you want to delete this record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingRecordId(id);
              await dispatch(deleteRecord(id)).unwrap();
              setRecords(prev => prev.filter(item => item.recordId !== id));
            } catch (error) {
              const msg =
                error?.message ||
                error?.data?.message ||
                'Failed to delete record.';
              Alert.alert('Error', msg);
            } finally {
              setDeletingRecordId(null);
            }
          },
        },
      ],
    );
  };

  const startEditFileName = item => {
    setEditingRecordId(item.recordId);
    setEditFileNameValue(item.fileName);
  };

  const cancelEditFileName = () => {
    setEditingRecordId(null);
    setEditFileNameValue('');
  };

  const handleSaveEditFileName = async () => {
    if (!editingRecordId || !editFileNameValue?.trim()) {
      cancelEditFileName();
      return;
    }
    try {
      setIsEditingFilename(true);
      await dispatch(
        editFilename({ recordId: editingRecordId, fileName: editFileNameValue.trim() }),
      ).unwrap();
      setRecords(prev =>
        prev.map(r =>
          r.recordId === editingRecordId
            ? { ...r, fileName: editFileNameValue.trim() }
            : r,
        ),
      );
      cancelEditFileName();
    } catch (error) {
      const msg =
        error?.message || error?.data?.message || 'Failed to update name.';
      Alert.alert('Error', msg);
    } finally {
      setIsEditingFilename(false);
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'No Date';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const months = [
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
      ];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateString;
    }
  };

  const getRecords = async () => {
    try {
      setIsFetching(true);
      const response = await dispatch(getPresRecordsThunk()).unwrap();
      console.log('Prescriptions response:', response);
      if (response?.success && response?.data) {
        // Map API data to our records format
        const apiRecords = response.data.data.map((item, index) => ({
          fileName: item?.fileName || 'Unnamed Record',
          fileUrl: item?.fileUrl || '',
          recordId: item?.recordId || index.toString(),
          type:
            item?.summarySnippet === 'prescription' ||
              item?.type === 'Prescription'
              ? 'Prescriptions'
              : 'Diagnostics',
          uploadDate: formatDate(item?.uploadDate || ''),
        }));
        setRecords(apiRecords);
        console.log('Mapped records:', apiRecords);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setIsFetching(false);
    }
  };
  useEffect(() => {
    getRecords();
  }, []);

  console.log('userId', userId);

  return (
    <ScrollView>
      <View style={{ flex: 1 }}>
        <ProfileHeader navigation={navigation} title="Health Records" />
        <View style={styles.container}>
          <Text style={styles.header}>Upload Records</Text>
          <View
            style={{ padding: hp(1), backgroundColor: '#FFFFFF', elevation: 2 }}
          >
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => setShowUploadModal(true)}
            >
              <Image
                source={Images.UPLOAD}
                style={{
                  tintColor: 'green',
                  height: hp(4),
                  width: wp(7),
                  resizeMode: 'contain',
                }}
              />
              <Text style={{ fontSize: 14, fontWeight: '400', color: 'green' }}>
                Upload Record
              </Text>
              <Text style={styles.fileText}>
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} file(s) selected`
                  : 'PNG, JPG ONLY up to 10MB'}
              </Text>

              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: '400',
                  color: 'green',
                  marginTop: hp(1),
                  textAlign: 'center',
                }}
              >
                Make sure the uploaded health record belongs to you
              </Text>
            </TouchableOpacity>

            {/* Display Selected Files */}
            {selectedFiles.length > 0 && (
              <View style={styles.selectedFilesContainer}>
                {selectedFiles.map((file, index) => (
                  <View key={index} style={styles.fileItem}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedFiles(prev =>
                          prev.filter((_, i) => i !== index),
                        );
                      }}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: hp(1),
              }}
            >
              <TouchableOpacity
                onPress={() => setIsPrescription(!isPrescription)}
              >
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: '#9CA3AF',
                    backgroundColor: isPrescription ? 'white' : '#1E64AC',
                    height: hp(3),
                    width: wp(6),
                    borderRadius: hp(0.9),
                  }}
                ></View>
              </TouchableOpacity>
              <View style={styles.checkboxRow}>
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    color: '#4B5563',
                    fontWeight: '400',
                  }}
                >
                  Mark as Prescription or Doctor’s Note
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                isUploading && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  Submit
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <Text
            style={{
              marginTop: hp(2),
              color: '#000',
              fontfamily: 'Roboto-Regular',
              fontSize: 18,
              fontStyle: 'normal',
              fontWeight: '400',
              marginBottom: hp(1),
            }}
          >
            View Records
          </Text>
          {/* <View style={styles.tabs}>
            {['Prescriptions', 'Diagnostics'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, selectedTab === tab && styles.activeTab]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text
                  style={
                    selectedTab === tab ? styles.activeText : styles.tabText
                  }
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View> */}

          {/* Record List */}
          {isFetching ? (
            <ActivityIndicator
              size="large"
              color="#1E64AC"
              style={{ marginTop: 20 }}
            />
          ) : records.length > 0 ? (
            <FlatList
              data={records}
              keyExtractor={(item, index) =>
                (item.recordId || index).toString()
              }
              scrollEnabled={false} // Disable scrolling as it's inside ScrollView
              renderItem={({ item }) => (
                <View style={styles.recordItem}>
                  <View style={{ flex: 1 }}>
                    {editingRecordId === item.recordId ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                          style={[styles.recordTitle, { flex: 1, borderWidth: 1, borderColor: '#1E64AC', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }]}
                          value={editFileNameValue}
                          onChangeText={setEditFileNameValue}
                          editable={!isEditingFilename}
                          placeholder="File name"
                        />
                        <TouchableOpacity
                          onPress={handleSaveEditFileName}
                          disabled={isEditingFilename}
                          style={{ padding: 4, marginLeft: 8 }}
                        >
                          {isEditingFilename ? (
                            <ActivityIndicator size="small" color="#1E64AC" />
                          ) : (
                            <Text style={{ color: '#1E64AC', fontWeight: '600' }}>Save</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={cancelEditFileName} style={{ padding: 4, marginLeft: 4 }}>
                          <Text style={{ color: '#6B7280' }}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.recordTitle}>{item.fileName}</Text>
                    )}
                    <Text style={styles.recordDate}>{item.uploadDate}</Text>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                      onPress={() => startEditFileName(item)}
                      disabled={editingRecordId !== null && editingRecordId !== item.recordId}
                    >
                      <Image
                        style={{
                          width: wp(4),
                          height: hp(3),
                          resizeMode: 'contain',
                        }}
                        source={Images.EDIT}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (item.fileUrl) {
                          setCurrentViewImageUrl(item.fileUrl);
                          setShowViewImageModal(true);
                        } else {
                          Alert.alert('Error', 'Image URL not found');
                        }
                      }}
                    >
                      <Image
                        style={{
                          width: wp(13),
                          height: hp(3),
                          resizeMode: 'contain',
                          marginLeft: hp(3),
                        }}
                        source={Images.EYE}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.recordId)}
                      disabled={deletingRecordId !== null}
                    >
                      {deletingRecordId === item.recordId ? (
                        <ActivityIndicator
                          size="small"
                          color="#1E64AC"
                          style={{ width: wp(4), height: hp(3) }}
                        />
                      ) : (
                        <Image
                          style={{
                            width: wp(4),
                            height: hp(3),
                            resizeMode: 'contain',
                          }}
                          source={Images.DELETE}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          ) : (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Text style={{ color: '#6B7280' }}>
                No records found for {selectedTab}
              </Text>
            </View>
          )}
        </View>

        {/* Upload Options Modal */}
        <Modal
          visible={showUploadModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowUploadModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowUploadModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Upload Method</Text>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={pickImageFromCamera}
              >
                <Image source={Images.CAMERA} style={styles.modalIcon} />
                <Text style={styles.modalButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={pickImageFromGallery}
              >
                <Image source={Images.EYE} style={styles.modalIcon} />
                <Text style={styles.modalButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>

              {/* <TouchableOpacity
                style={styles.modalButton}
                onPress={pickDocument}
              >
                <Image source={Images.UPLOAD} style={styles.modalIcon} />
                <Text style={styles.modalButtonText}>Browse Files</Text>
              </TouchableOpacity> */}

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowUploadModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* View Image Modal */}
        <Modal
          visible={showViewImageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowViewImageModal(false)}
        >
          <View style={styles.viewImageOverlay}>
            <View style={styles.viewImageContainer}>
              <TouchableOpacity
                style={styles.closeViewImage}
                onPress={() => {
                  setShowViewImageModal(false);
                  setIsImageLoading(false);
                }}
              >
                <Text style={styles.closeViewImageText}>✕</Text>
              </TouchableOpacity>
              {isImageLoading && (
                <ActivityIndicator
                  size="large"
                  color="#FFFFFF"
                  style={styles.imageLoader}
                />
              )}
              <Image
                source={{ uri: currentViewImageUrl }}
                style={styles.fullImage}
                resizeMode="contain"
                onLoadStart={() => setIsImageLoading(true)}
                onLoadEnd={() => setIsImageLoading(false)}
              />
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

export default HealthRecords;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    flex: 1,
  },
  header: {
    fontFamily: 'Roboto-Regular',
    fontSize: 18,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 12,
  },
  input: {
    fontFamily: 'Roboto-Regular',
    borderWidth: 1,
    fontSize: 16,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  fileText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: 'green',
    marginTop: 5,
    fontWeight: '400',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#1E64AC',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  submitBtnDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  tabs: {
    marginTop: hp(2),
    flexDirection: 'row',
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: 6,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTab: { fontFamily: 'Roboto-Regular', backgroundColor: '#1E64AC' },
  tabText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontWeight: '400',
  },
  activeText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(2),
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    marginBottom: 8,
  },
  recordTitle: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    fontSize: 14,
    color: '#000000',
  },
  recordDate: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#6B7280',
    fontWeight: 400,
  },
  upperInputText: {
    fontFamily: 'Roboto-Regular',
    marginBottom: hp(1),
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: wp(85),
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalIcon: {
    width: wp(6),
    height: hp(3),
    resizeMode: 'contain',
    marginRight: 12,
  },
  modalButtonText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    fontWeight: '400',
    color: '#374151',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  selectedFilesContainer: {
    marginTop: hp(1),
    marginBottom: hp(1),
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  fileName: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#374151',
    flex: 1,
    marginRight: 10,
  },
  removeButton: {
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewImageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewImageContainer: {
    width: wp(100),
    height: hp(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeViewImage: {
    position: 'absolute',
    top: hp(6),
    right: wp(5),
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeViewImageText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  fullImage: {
    width: wp(95),
    height: hp(80),
  },
  imageLoader: {
    position: 'absolute',
    zIndex: 5,
  },
});
