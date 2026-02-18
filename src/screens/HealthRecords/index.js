import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
import {
  pick as pickDocument,
  types as docTypes,
  isErrorWithCode,
  errorCodes as docErrorCodes,
} from '@react-native-documents/picker';
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
  const role = useSelector(state => state.auth?.role);
  const isCaregiver = role === 'caregiver';

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isPrescription, setIsPrescription] = useState(false);
  const [selectedTab] = useState('Prescriptions'); // Used when tabs are enabled; empty state shows "No records yet" when tabs hidden
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

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const MAX_FILES_PER_UPLOAD = 10;

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'Allow this app to access your camera to take photos of health records.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Camera permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically via Info.plist
  };

  const pickImageFromCamera = async () => {
    console.log('📷 Opening camera...');
    
    try {
      // Request permission for Android
      if (Platform.OS === 'android') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          setShowUploadModal(false);
          Alert.alert(
            'Permission Required',
            'Camera permission is needed to take photos. Please grant permission in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }
      }

      // Close modal AFTER permission is granted but BEFORE launching camera
      setShowUploadModal(false);
      
      // Small delay to ensure modal is fully closed before camera opens
      await new Promise(resolve => setTimeout(resolve, 300));

      const options = {
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
        includeBase64: false,
        cameraType: 'back',
      };

      console.log('📷 Launching camera...');
      const result = await launchCamera(options);

      console.log('📷 Camera result:', JSON.stringify(result, null, 2));

      if (result.didCancel) {
        console.log('📷 User cancelled camera');
        return;
      }

      if (result.errorCode) {
        console.error('📷 Camera error:', result.errorCode, result.errorMessage);
        
        if (result.errorCode === 'camera_unavailable') {
          Alert.alert(
            'Camera Unavailable',
            'Camera is not available. Please use the Gallery option instead.',
            [
              { text: 'OK' },
              { 
                text: 'Open Gallery', 
                onPress: () => {
                  setTimeout(() => pickImageFromGallery(), 300);
                }
              }
            ]
          );
        } else if (result.errorCode === 'permission') {
          Alert.alert(
            'Permission Denied',
            'Camera permission is required. Please enable it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
        } else {
          Alert.alert('Error', result.errorMessage || 'Failed to open camera');
        }
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        const newFile = {
          uri: photo.uri,
          name: photo.fileName || `photo_${Date.now()}.jpg`,
          type: photo.type || 'image/jpeg',
          size: photo.fileSize || 0,
        };
        setSelectedFiles(prev => {
          if (prev.length >= MAX_FILES_PER_UPLOAD) {
            Alert.alert('Limit reached', `You can add up to ${MAX_FILES_PER_UPLOAD} files per upload.`);
            return prev;
          }
          return [...prev, newFile];
        });
        Alert.alert('Success', 'Photo captured successfully!');
      } else {
        console.log('📷 No assets in result');
        Alert.alert('Error', 'No photo was captured. Please try again.');
      }
    } catch (error) {
      console.error('📷 Camera exception:', error);
      console.error('📷 Error details:', error.message, error.stack);
      Alert.alert(
        'Camera Error',
        'Failed to open camera. Please try using the Gallery option instead.',
        [
          { text: 'OK' },
          { 
            text: 'Open Gallery', 
            onPress: () => {
              setTimeout(() => pickImageFromGallery(), 300);
            }
          }
        ]
      );
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const androidVersion = Platform.Version;
        
        // Android 13+ (API 33+) uses READ_MEDIA_IMAGES
        if (androidVersion >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: 'Gallery Permission',
              message: 'Allow this app to access your photos to select health records.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // Android 12 and below use READ_EXTERNAL_STORAGE
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'Gallery Permission',
              message: 'Allow this app to access your photos to select health records.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.error('Storage permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically via Info.plist
  };

  const pickImageFromGallery = async () => {
    console.log('🖼️ Opening gallery...');
    setShowUploadModal(false); // Close modal first
    
    try {
      // Request permission for Android
      if (Platform.OS === 'android') {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Gallery permission is needed to select photos. Please grant permission in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }
      }

      const options = {
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 0, // 0 = unlimited selection
        includeBase64: false,
      };

      console.log('🖼️ Launching gallery...');
      const result = await launchImageLibrary(options);

      console.log('🖼️ Gallery result:', result);

      if (result.didCancel) {
        console.log('🖼️ User cancelled gallery');
        return;
      }

      if (result.errorCode) {
        console.error('🖼️ Gallery error:', result.errorCode, result.errorMessage);
        Alert.alert('Error', result.errorMessage || 'Failed to open gallery');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const newFiles = result.assets.map((photo, index) => ({
          uri: photo.uri,
          name: photo.fileName || `image_${Date.now()}_${index}.jpg`,
          type: photo.type || 'image/jpeg',
          size: photo.fileSize || 0,
        }));
        setSelectedFiles(prev => {
          const total = prev.length + newFiles.length;
          if (total > MAX_FILES_PER_UPLOAD) {
            const allowed = MAX_FILES_PER_UPLOAD - prev.length;
            Alert.alert(
              'Limit reached',
              `You can add up to ${MAX_FILES_PER_UPLOAD} files per upload. Adding first ${allowed} of ${newFiles.length} selected.`,
            );
            return [...prev, ...newFiles.slice(0, allowed)];
          }
          return [...prev, ...newFiles];
        });
        Alert.alert('Success', `${newFiles.length} image(s) selected successfully!`);
      }
    } catch (error) {
      console.error('🖼️ Gallery exception:', error);
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  const pickDocumentForUpload = async () => {
    setShowUploadModal(false);
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      const result = await pickDocument({
        type: [docTypes.pdf],
        allowMultiSelection: true,
      });
      if (result && result.length > 0) {
        const newFiles = result.map(doc => ({
          uri: doc.uri,
          name: doc.name || `document_${Date.now()}.pdf`,
          type: doc.type || 'application/pdf',
          size: doc.size || 0,
        }));
        setSelectedFiles(prev => {
          const total = prev.length + newFiles.length;
          if (total > MAX_FILES_PER_UPLOAD) {
            const allowed = MAX_FILES_PER_UPLOAD - prev.length;
            Alert.alert(
              'Limit reached',
              `You can add up to ${MAX_FILES_PER_UPLOAD} files per upload. Adding first ${allowed} of ${newFiles.length} selected.`,
            );
            return [...prev, ...newFiles.slice(0, allowed)];
          }
          return [...prev, ...newFiles];
        });
        Alert.alert('Success', `${newFiles.length} PDF(s) selected successfully!`);
      }
    } catch (err) {
      if (isErrorWithCode(err) && err.code === docErrorCodes.OPERATION_CANCELED) {
        return;
      }
      console.error('Document picker error:', err);
      Alert.alert('Error', err?.message || 'Failed to pick document. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('Incomplete', 'Please upload at least one file');
      return;
    }

    if (selectedFiles.length > MAX_FILES_PER_UPLOAD) {
      Alert.alert(
        'Too many files',
        `You can upload up to ${MAX_FILES_PER_UPLOAD} files at a time.`,
      );
      return;
    }

    const oversizedFiles = selectedFiles.filter(
      file => file.size > MAX_FILE_SIZE_BYTES,
    );
    if (oversizedFiles.length > 0) {
      Alert.alert(
        'File too large',
        `Some files exceed ${MAX_FILE_SIZE_MB}MB. Please choose smaller files.`,
      );
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please login again.');
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('isPrescription', isPrescription ? 'true' : 'false');

      selectedFiles.forEach((file, index) => {
        const isPdf = file.type === 'application/pdf';
        const defaultName = isPdf
          ? `health_record_${Date.now()}_${index}.pdf`
          : `health_record_${Date.now()}_${index}.jpg`;
        const fileData = {
          uri:
            Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
          type: file.type || 'image/jpeg',
          name: file.name || defaultName,
        };
        formData.append('files', fileData);
      });

      const response = await dispatch(uploadPhoto(formData)).unwrap();

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
        Alert.alert('Upload Failed', errorMsg);
      }
    } catch (error) {
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

  const getRecords = useCallback(async () => {
    try {
      setIsFetching(true);
      const response = await dispatch(getPresRecordsThunk()).unwrap();
      if (response?.success && response?.data) {
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
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setIsFetching(false);
    }
  }, [dispatch]);

  useEffect(() => {
    getRecords();
  }, [getRecords]);

  return (
    <ScrollView>
      <View style={styles.screen}>
        <ProfileHeader navigation={navigation} title="Health Records" />
        <View style={styles.container}>
          <Text style={styles.header}>Upload Records</Text>
          <View
            style={styles.uploadCard}
          >
            <TouchableOpacity
              style={[styles.uploadBox, isCaregiver && styles.uploadBoxDisabled]}
              onPress={() => !isCaregiver && setShowUploadModal(true)}
              disabled={isCaregiver}
              activeOpacity={isCaregiver ? 1 : 0.7}
            >
              <Image
                source={Images.UPLOAD}
                style={[styles.uploadIcon, isCaregiver && styles.uploadIconDisabled]}
              />
              <Text style={[styles.uploadLabel, isCaregiver && styles.textDisabled]}>
                Upload Record
              </Text>
              <Text style={[styles.fileText, isCaregiver && styles.textDisabled]}>
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} file(s) selected`
                  : `PNG, JPG, PDF up to ${MAX_FILE_SIZE_MB}MB, max ${MAX_FILES_PER_UPLOAD} files`}
              </Text>
              <Text style={[styles.uploadDisclaimer, isCaregiver && styles.textDisabled]}>
                {isCaregiver
                  ? 'Only the account holder can upload or manage records'
                  : 'Make sure the uploaded health record belongs to you'}
              </Text>
            </TouchableOpacity>

            {/* Display Selected Files */}
            {selectedFiles.length > 0 && !isCaregiver && (
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

            <View style={styles.checkboxRowWrapper}>
              <TouchableOpacity
                onPress={() => !isCaregiver && setIsPrescription(!isPrescription)}
                disabled={isCaregiver}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    isPrescription && styles.checkboxBoxUnchecked,
                  ]}
                />
              </TouchableOpacity>
              <View style={styles.checkboxRow}>
                <Text style={styles.checkboxLabel}>
                  Mark as Prescription or Doctor’s Note
                </Text>
              </View>
            </View>

            {!isCaregiver && (
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
                <Text style={styles.submitBtnText}>
                  Submit
                </Text>
              )}
            </TouchableOpacity>
            )}

          </View>

          {/* Tabs */}
          <Text style={styles.viewRecordsTitle}>
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
              color="#11418A"
              style={styles.fetchLoader}
            />
          ) : records.length > 0 ? (
            records.map((item, index) => (
              <View
                key={item.recordId || index}
                style={styles.recordItem}
              >
                <View style={styles.recordItemContent}>
                  {editingRecordId === item.recordId && !isCaregiver ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={styles.editFileNameInput}
                        value={editFileNameValue}
                        onChangeText={setEditFileNameValue}
                        editable={!isEditingFilename}
                        placeholder="File name"
                        placeholderTextColor="#94A3B8"
                      />
                      <TouchableOpacity
                        onPress={handleSaveEditFileName}
                        disabled={isEditingFilename}
                        style={styles.saveEditBtn}
                      >
                        {isEditingFilename ? (
                          <ActivityIndicator size="small" color="#11418A" />
                        ) : (
                          <Text style={styles.saveEditText}>Save</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity onPress={cancelEditFileName} style={styles.cancelEditBtn}>
                        <Text style={styles.cancelEditText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.recordTitle}>{item.fileName}</Text>
                  )}
                  <Text style={styles.recordDate}>{item.uploadDate}</Text>
                </View>
                <View style={styles.recordActions}>
                  {!isCaregiver && (
                    <TouchableOpacity
                      onPress={() => startEditFileName(item)}
                      disabled={editingRecordId !== null && editingRecordId !== item.recordId}
                    >
                      <Image style={styles.recordActionIcon} source={Images.EDIT} />
                    </TouchableOpacity>
                  )}
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
                      style={[styles.recordActionIcon, styles.eyeIcon]}
                      source={Images.EYE}
                    />
                  </TouchableOpacity>
                  {!isCaregiver && (
                    <TouchableOpacity
                      onPress={() => handleDelete(item.recordId)}
                      disabled={deletingRecordId !== null}
                    >
                      {deletingRecordId === item.recordId ? (
                        <ActivityIndicator
                          size="small"
                          color="#11418A"
                          style={styles.recordActionIcon}
                        />
                      ) : (
                        <Image style={styles.recordActionIcon} source={Images.DELETE} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyRecords}>
              <Text style={styles.emptyRecordsText}>
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
                <Image source={Images.UPLOAD} style={styles.modalIcon} />
                <Text style={styles.modalButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={pickDocumentForUpload}
              >
                <Image source={Images.UPLOAD} style={styles.modalIcon} />
                <Text style={styles.modalButtonText}>Choose PDF</Text>
              </TouchableOpacity>

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
  screen: {
    flex: 1,
  },
  container: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  fetchLoader: {
    marginTop: 20,
  },
  header: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#1E293B',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  input: {
    fontFamily: 'Poppins-Regular',
    borderWidth: 1.5,
    fontSize: 15,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  uploadCard: {
    padding: hp(1),
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'android' && { elevation: 0.5 }),
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  uploadIcon: {
    tintColor: '#047857',
    height: hp(4),
    width: wp(7),
    resizeMode: 'contain',
  },
  uploadLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#047857',
    letterSpacing: 0.2,
  },
  uploadDisclaimer: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12.5,
    color: '#047857',
    marginTop: hp(1),
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  fileText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#047857',
    marginTop: 5,
    letterSpacing: 0.2,
  },
  checkboxRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp(1),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadBoxDisabled: {
    opacity: 0.6,
    backgroundColor: '#F1F5F9',
  },
  uploadIconDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: '#94A3B8',
  },
  checkboxBox: {
    borderWidth: 1,
    borderColor: '#9CA3AF',
    backgroundColor: '#11418A',
    height: hp(3),
    width: wp(6),
    borderRadius: hp(0.9),
  },
  checkboxBoxUnchecked: {
    backgroundColor: '#FFFFFF',
  },
  checkboxLabel: {
    fontFamily: 'Poppins-Regular',
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
    letterSpacing: 0.2,
  },
  submitBtn: {
    backgroundColor: '#11418A',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 16,
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.7,
  },
  submitBtnText: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  viewRecordsTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#000',
    marginTop: hp(2),
    marginBottom: hp(1),
    letterSpacing: 0.2,
  },
  tabs: {
    marginTop: hp(2),
    flexDirection: 'row',
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: 10,
    backgroundColor: '#94A3B8',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTab: { fontFamily: 'Poppins-Regular', backgroundColor: '#11418A' },
  tabText: {
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  activeText: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(2),
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recordItemContent: {
    flex: 1,
    minWidth: 0,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordActionIcon: {
    width: wp(4),
    height: hp(3),
    resizeMode: 'contain',
  },
  eyeIcon: {
    width: wp(13),
    marginLeft: hp(3),
  },
  recordTitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  recordDate: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#64748B',
    letterSpacing: 0.2,
  },
  editFileNameInput: {
    fontFamily: 'Poppins-Regular',
    flex: 1,
    borderWidth: 1,
    borderColor: '#11418A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    color: '#1E293B',
  },
  saveEditBtn: {
    padding: 4,
    marginLeft: 8,
  },
  saveEditText: {
    fontFamily: 'Poppins-Medium',
    color: '#11418A',
    letterSpacing: 0.2,
  },
  cancelEditBtn: {
    padding: 4,
    marginLeft: 4,
  },
  cancelEditText: {
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  emptyRecords: {
    alignItems: 'center',
    marginTop: 20,
  },
  emptyRecordsText: {
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  upperInputText: {
    fontFamily: 'Poppins-Regular',
    marginBottom: hp(1),
    fontSize: 14,
    color: '#475569',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: wp(85),
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalIcon: {
    width: wp(6),
    height: hp(3),
    resizeMode: 'contain',
    marginRight: 12,
  },
  modalButtonText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#475569',
    letterSpacing: 0.2,
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  selectedFilesContainer: {
    marginTop: hp(1),
    marginBottom: hp(1),
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fileName: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#475569',
    flex: 1,
    marginRight: 10,
    letterSpacing: 0.2,
  },
  removeButton: {
    backgroundColor: '#EF4444',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2,
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
    fontFamily: 'Poppins-Medium',
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
