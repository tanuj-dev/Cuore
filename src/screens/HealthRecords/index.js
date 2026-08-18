/**
 * Health Records — the patient's own document library.
 *
 * Flow: Upload → Name → Save → View in Records → Manage.
 *
 * This screen used to push every upload through an OCR/AI summarizer and show the
 * generated summary. That is gone: a record is now simply a file the patient uploaded,
 * under a name the patient chose, organised by date and manageable (open, rename,
 * download, delete).
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
  Linking,
  RefreshControl,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  pick as pickDocument,
  types as docTypes,
  isErrorWithCode,
  errorCodes as docErrorCodes,
} from '@react-native-documents/picker';
import { useDispatch, useSelector } from 'react-redux';
import Pdf from 'react-native-pdf';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import {
  FileText,
  Image as ImageIcon,
  Search,
  Eye,
  Pencil,
  Download,
  Trash2,
  X,
  Check,
  FolderOpen,
} from 'lucide-react-native';

import { hp, wp, Images } from '../../utilities';
import ProfileHeader from '../../components/ProfileHeader';
import { uploadPhoto } from '../../redux/uploadPhoto/uploadPhotoThunk';
import { uploadImagingStudy } from '../../redux/uploadPhoto/uploadImagingStudyThunk';
import { getPresRecordsThunk } from '../../redux/uploadPhoto/getPresRecordsThunk';
import { editFilename } from '../../redux/uploadPhoto/editFilenameThunk';
import { deleteRecord } from '../../redux/uploadPhoto/deleteRecordThunk';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { getApiCall, putApiCall } from '../../utilities/Services';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = 10;
// Imaging has its own, far larger ceiling — it streams straight to S3 rather than through
// our server. Must match MAX_BYTES in backend/controllers/imagingUploadController.js; the
// server re-checks the real object size, so this is only to fail fast before a long upload.
const MAX_IMAGING_SIZE_MB = 2048;
const MAX_IMAGING_SIZE_BYTES = MAX_IMAGING_SIZE_MB * 1024 * 1024;
const MAX_NAME_LENGTH = 120;
const SEARCH_MIN_RECORDS = 5; // below this a search box is just noise

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/* -------------------------------- helpers -------------------------------- */

// Which upload path a picked file takes. Extension-based on purpose: pickers report DICOM
// inconsistently (Android commonly says application/octet-stream for a .dcm), and the server
// decides by extension too, so the two agree. Keep in step with ALLOWED_EXTENSIONS in
// backend/controllers/imagingUploadController.js.
const IMAGING_EXTENSIONS = ['dcm', 'dicom', 'zip'];
const isImagingFile = fileName => {
  const ext = String(fileName || '').split('.').pop().toLowerCase();
  return IMAGING_EXTENSIONS.includes(ext);
};

const isPdf = record =>
  /pdf/i.test(record?.fileType || '') ||
  /\.pdf($|\?)/i.test(record?.fileUrl || '') ||
  /\.pdf$/i.test(record?.originalFileName || '');

/** "IMG_20260808.jpg" → "IMG_20260808" — a starting point the user can edit. */
const defaultNameFor = filename => {
  const base = String(filename || '').split('/').pop();
  return base.replace(/\.[^.]+$/, '').slice(0, MAX_NAME_LENGTH) || 'Health record';
};

const formatDate = value => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

const formatTime = value => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const suffix = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
};

const monthGroupOf = value => {
  const d = new Date(value);
  if (!value || isNaN(d.getTime())) return 'Earlier';
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
};

const formatSize = bytes => {
  const n = Number(bytes) || 0;
  if (n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const safeFileName = (name, record) => {
  const ext =
    (record?.originalFileName || '').split('.').pop() ||
    (isPdf(record) ? 'pdf' : 'jpg');
  const base = String(name || 'health-record').replace(/[^a-zA-Z0-9_ -]/g, '').trim() || 'health-record';
  return `${base}.${ext}`;
};

/* ================================= screen ================================= */

const HealthRecords = ({ navigation }) => {
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();
  const userId = useSelector(state => state.auth?.userId);
  const role = useSelector(state => state.auth?.role);
  const isCaregiver = role === 'caregiver';

  // Upload flow
  const [selectedFiles, setSelectedFiles] = useState([]); // {uri,name,type,size,docName}
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });

  // Records
  const [records, setRecords] = useState([]);
  // Record-sharing consent. `required` comes from the server so the prompt follows the
  // account, not the device — reinstalling must not re-ask, and revoking must re-ask.
  const [consent, setConsent] = useState({ granted: false, required: false, loaded: false });
  const [showConsent, setShowConsent] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');

  // Row management
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState(null);
  const [downloadingRecordId, setDownloadingRecordId] = useState(null);

  // Viewer
  const [viewerRecord, setViewerRecord] = useState(null);
  const [isViewerLoading, setIsViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState('');

  const hasLoadedOnce = useRef(false);

  /* ----------------------------- permissions ----------------------------- */

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message:
              'Allow this app to access your camera to take photos of health records.',
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

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // Android 13+ (API 33+): manifest uses the system Photo Picker — READ_MEDIA_IMAGES
        // is intentionally not declared (tools:node="remove"). Do not request it here or
        // launchImageLibrary will never run.
        if (Platform.Version >= 33) return true;

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Gallery Permission',
            message:
              'Allow this app to access your photos to select health records.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Storage permission error:', err);
        return false;
      }
    }
    return true;
  };

  /* ------------------------------- pickers ------------------------------- */

  const addFiles = useCallback(
    newFiles => {
      setSelectedFiles(prev => {
        const room = MAX_FILES_PER_UPLOAD - prev.length;
        if (room <= 0) {
          alert(
            'Limit reached',
            `You can add up to ${MAX_FILES_PER_UPLOAD} files per upload.`,
          );
          return prev;
        }
        const accepted = newFiles.slice(0, room).map(f => ({
          ...f,
          docName: defaultNameFor(f.name),
        }));
        if (newFiles.length > room) {
          alert(
            'Limit reached',
            `You can add up to ${MAX_FILES_PER_UPLOAD} files per upload. Added the first ${room} of ${newFiles.length}.`,
          );
        }
        return [...prev, ...accepted];
      });
    },
    [alert],
  );

  const pickImageFromCamera = async () => {
    try {
      if (Platform.OS === 'android') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          setShowUploadModal(false);
          alert(
            'Permission Required',
            'Camera permission is needed to take photos. Please grant permission in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
          );
          return;
        }
      }

      setShowUploadModal(false);
      await new Promise(resolve => setTimeout(resolve, 300));

      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
        includeBase64: false,
        cameraType: 'back',
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        if (result.errorCode === 'camera_unavailable') {
          alert(
            'Camera Unavailable',
            'Camera is not available. Please use the Gallery option instead.',
            [
              { text: 'OK' },
              {
                text: 'Open Gallery',
                onPress: () => setTimeout(() => pickImageFromGallery(), 300),
              },
            ],
          );
        } else if (result.errorCode === 'permission') {
          alert(
            'Permission Denied',
            'Camera permission is required. Please enable it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
          );
        } else {
          alert('Error', result.errorMessage || 'Failed to open camera');
        }
        return;
      }

      if (result.assets?.length) {
        const photo = result.assets[0];
        addFiles([
          {
            uri: photo.uri,
            name: photo.fileName || `photo_${Date.now()}.jpg`,
            type: photo.type || 'image/jpeg',
            size: photo.fileSize || 0,
          },
        ]);
      } else {
        alert('Error', 'No photo was captured. Please try again.');
      }
    } catch (error) {
      console.error('Camera exception:', error);
      alert(
        'Camera Error',
        'Failed to open camera. Please try using the Gallery option instead.',
      );
    }
  };

  const pickImageFromGallery = async () => {
    setShowUploadModal(false);
    try {
      if (Platform.OS === 'android') {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          alert(
            'Permission Required',
            'Gallery permission is needed to select photos. Please grant permission in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
          );
          return;
        }
      }

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 0,
        includeBase64: false,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        alert('Error', result.errorMessage || 'Failed to open gallery');
        return;
      }

      if (result.assets?.length) {
        addFiles(
          result.assets.map((photo, index) => ({
            uri: photo.uri,
            name: photo.fileName || `image_${Date.now()}_${index}.jpg`,
            type: photo.type || 'image/jpeg',
            size: photo.fileSize || 0,
          })),
        );
      }
    } catch (error) {
      console.error('Gallery exception:', error);
      alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  const pickDocumentForUpload = async () => {
    setShowUploadModal(false);
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      const result = await pickDocument({
        // PDFs, plus imaging: DICOM (.dcm) and a zipped study, which is how an imaging centre
        // usually hands one over.
        //
        // `allFiles` rather than a DICOM type on purpose. DICOM has a registered MIME type, but
        // `type` is MIME on Android and a UTI on iOS, and there is no DICOM UTI in this picker's
        // table — passing a raw MIME string would break the iOS picker rather than widen it.
        // Meanwhile Android pickers commonly report a .dcm as application/octet-stream anyway.
        // So the picker is permissive and the SERVER decides, by extension: the ordinary upload
        // route accepts PDF/images, the imaging route accepts .dcm/.zip, and anything else is
        // refused with a clear message.
        type: [docTypes.allFiles],
        allowMultiSelection: true,
      });
      if (result?.length) {
        addFiles(
          result.map(doc => ({
            uri: doc.uri,
            name: doc.name || `document_${Date.now()}.pdf`,
            type: doc.type || 'application/pdf',
            size: doc.size || 0,
          })),
        );
      }
    } catch (err) {
      if (isErrorWithCode(err) && err.code === docErrorCodes.OPERATION_CANCELED) {
        return;
      }
      console.error('Document picker error:', err);
      alert('Error', err?.message || 'Failed to pick document. Please try again.');
    }
  };

  /* -------------------------------- upload ------------------------------- */

  const setDocName = (index, value) => {
    setSelectedFiles(prev =>
      prev.map((f, i) => (i === index ? { ...f, docName: value } : f)),
    );
  };

  const removeSelectedFile = index => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Read consent state once on mount. Kept on the server so it follows the account rather
  // than the device.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getApiCall('/api/health-records/consent', '');
        if (!cancelled && res?.status === 200 && res.data?.consent) {
          setConsent({ ...res.data.consent, loaded: true });
        }
      } catch (_) {
        // Non-fatal: the server enforces the gate regardless, so a failed read just means
        // the prompt may appear once more than strictly necessary.
        if (!cancelled) setConsent(c => ({ ...c, loaded: true }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const grantConsent = async () => {
    setSavingConsent(true);
    try {
      const res = await putApiCall('/api/health-records/consent', { granted: true });
      if (res?.status === 200 && res.data?.consent) {
        setConsent({ ...res.data.consent, loaded: true });
        setShowConsent(false);
        // Continue straight into the upload the patient already asked for.
        setTimeout(() => handleSubmit(), 0);
        return;
      }
      alert('Could not save', 'Please try again.');
    } catch (_) {
      alert('Could not save', 'Please try again.');
    } finally {
      setSavingConsent(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      alert('Nothing to upload', 'Select a file or photo first.');
      return;
    }
    if (!userId) {
      alert('Error', 'User ID not found. Please login again.');
      return;
    }

    const unnamed = selectedFiles.findIndex(f => !f.docName?.trim());
    if (unnamed !== -1) {
      alert('Name required', 'Give every document a name before saving.');
      return;
    }

    // The 10 MB cap belongs to the ORDINARY upload path, which posts a FormData through our own
    // server. Imaging is exempt: it streams straight to S3 and has its own, much larger limit
    // enforced server-side. Without this exemption a scan would be refused here and never reach
    // the path built for it.
    const oversized = selectedFiles.filter(
      f => !isImagingFile(f.name) && f.size > MAX_FILE_SIZE_BYTES,
    );
    if (oversized.length > 0) {
      alert(
        'File too large',
        `Some files exceed ${MAX_FILE_SIZE_MB}MB. Please choose smaller files.`,
      );
      return;
    }

    const oversizedImaging = selectedFiles.filter(
      f => isImagingFile(f.name) && f.size > MAX_IMAGING_SIZE_BYTES,
    );
    if (oversizedImaging.length > 0) {
      alert(
        'Scan too large',
        `Scans must be under ${MAX_IMAGING_SIZE_MB / 1024}GB. Please ask the imaging centre for a smaller export.`,
      );
      return;
    }

    // One-time consent. Asked before the FIRST upload only; once granted the prompt never
    // appears again (the server tracks it, not this screen). The backend enforces the same
    // rule, so this modal is the explanation — not the protection.
    if (consent.required) {
      setShowConsent(true);
      return;
    }

    setIsUploading(true);
    setUploadProgress({ done: 0, total: selectedFiles.length });

    const failed = [];
    // Sequential: gives honest per-file progress and stops one bad file from
    // taking the whole batch down with it.
    for (let i = 0; i < selectedFiles.length; i++) {
      const f = selectedFiles[i];
      try {
        if (isImagingFile(f.name)) {
          // Imaging goes a different way entirely: presigned URL, streamed straight to S3,
          // then finalized. It cannot use the thunk below, which posts a FormData to our own
          // server and is capped at 15 MB — a study is 100 MB-2 GB.
          await dispatch(
            uploadImagingStudy({
              file: {
                uri: f.uri,
                type: f.type || 'application/octet-stream',
                name: f.name,
                size: f.size || 0,
              },
              name: f.docName.trim(),
              // Per-file byte progress, so a multi-hundred-megabyte upload is not a frozen
              // spinner. Reported as a fraction of THIS file within the batch counter.
              onProgress: fraction =>
                setUploadProgress({ done: i + fraction, total: selectedFiles.length }),
            }),
          ).unwrap();
        } else {
          await dispatch(
            uploadPhoto({
              file: {
                uri: Platform.OS === 'ios' ? f.uri.replace('file://', '') : f.uri,
                type: f.type || 'image/jpeg',
                name: f.name || `health_record_${Date.now()}_${i}.jpg`,
              },
              name: f.docName.trim(),
            }),
          ).unwrap();
        }
      } catch (error) {
        failed.push({ name: f.docName || f.name, reason: String(error || '') });
      }
      setUploadProgress({ done: i + 1, total: selectedFiles.length });
    }

    setIsUploading(false);
    setUploadProgress({ done: 0, total: 0 });

    const saved = selectedFiles.length - failed.length;
    setSelectedFiles(failed.length ? selectedFiles.filter(f => failed.some(x => x.name === (f.docName || f.name))) : []);
    await getRecords();

    if (failed.length === 0) {
      alert('Saved', saved === 1 ? 'Your record has been saved.' : `${saved} records have been saved.`);
    } else {
      alert(
        'Some uploads failed',
        `${saved} saved, ${failed.length} failed.\n\n${failed[0].reason || 'Please try again.'}`,
      );
    }
  };

  /* ------------------------------- fetching ------------------------------ */

  const getRecords = useCallback(
    async (q = '') => {
      try {
        if (!hasLoadedOnce.current) setIsFetching(true);
        setLoadError('');
        const response = await dispatch(getPresRecordsThunk(q)).unwrap();
        const list = response?.data?.data || [];
        setRecords(
          list.map((item, index) => ({
            recordId: item?.recordId || String(index),
            name: item?.name || item?.fileName || 'Untitled record',
            originalFileName: item?.originalFileName || '',
            fileUrl: item?.fileUrl || '',
            fileType: item?.fileType || '',
            fileSize: item?.fileSize || 0,
            uploadedAt: item?.uploadedAt || item?.uploadDate || null,
            // The date the document is ABOUT (a prescription's issue date, or the date the
            // patient filed a scan under) — falls back to the upload time for older records.
            documentDate: item?.documentDate || item?.uploadedAt || item?.uploadDate || null,
            // Doctor-issued documents (prescriptions, case sheets) are mirrored into Records
            // read-only: the backend refuses rename/delete on them because the authoritative
            // document lives elsewhere and the S3 object is shared with the doctor's copy.
            isClinical: !!item?.isClinical,
            source: item?.source || 'upload',
          })),
        );
      } catch (error) {
        setLoadError(
          typeof error === 'string' ? error : 'Could not load your records.',
        );
      } finally {
        hasLoadedOnce.current = true;
        setIsFetching(false);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    getRecords();
  }, [getRecords]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await getRecords(search);
    setIsRefreshing(false);
  }, [getRecords, search]);

  /* ------------------------------ management ----------------------------- */

  const startRename = record => {
    setEditingRecordId(record.recordId);
    setEditNameValue(record.name);
  };

  const cancelRename = () => {
    setEditingRecordId(null);
    setEditNameValue('');
  };

  const saveRename = async () => {
    const name = editNameValue.trim();
    if (!editingRecordId || !name) {
      cancelRename();
      return;
    }
    try {
      setIsSavingName(true);
      await dispatch(editFilename({ recordId: editingRecordId, name })).unwrap();
      setRecords(prev =>
        prev.map(r => (r.recordId === editingRecordId ? { ...r, name } : r)),
      );
      cancelRename();
    } catch (error) {
      alert('Could not rename', typeof error === 'string' ? error : 'Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleDelete = record => {
    alert(
      'Delete record',
      `Are you sure you want to delete "${record.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingRecordId(record.recordId);
              await dispatch(deleteRecord(record.recordId)).unwrap();
              setRecords(prev => prev.filter(r => r.recordId !== record.recordId));
            } catch (error) {
              alert(
                'Could not delete',
                typeof error === 'string' ? error : 'Please try again.',
              );
            } finally {
              setDeletingRecordId(null);
            }
          },
        },
      ],
    );
  };

  const handleDownload = async record => {
    if (!record.fileUrl) {
      alert('Unavailable', 'This record has no file attached.');
      return;
    }
    const fileName = safeFileName(record.name, record);
    const mime = record.fileType || (isPdf(record) ? 'application/pdf' : 'image/jpeg');
    try {
      setDownloadingRecordId(record.recordId);
      if (Platform.OS === 'android') {
        const { dirs } = ReactNativeBlobUtil.fs;
        await ReactNativeBlobUtil.config({
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            title: fileName,
            description: 'Cuore health record',
            mime,
            mediaScannable: true,
            path: `${dirs.DownloadDir}/${fileName}`,
          },
        }).fetch('GET', record.fileUrl);
        alert('Downloaded', `"${record.name}" has been saved to Downloads.`);
      } else {
        // iOS has no shared Downloads folder — route through the share sheet ("Save to Files").
        const path = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fileName}`;
        const resp = await ReactNativeBlobUtil.config({ fileCache: true, path }).fetch(
          'GET',
          record.fileUrl,
        );
        await Share.open({
          url: resp.path(),
          type: mime,
          filename: fileName,
          failOnCancel: false,
        }).catch(e => {
          if (!/cancel/i.test(e?.message || '')) throw e;
        });
      }
    } catch (error) {
      alert('Download failed', error?.message || 'Please try again.');
    } finally {
      setDownloadingRecordId(null);
    }
  };

  const openViewer = record => {
    if (!record.fileUrl) {
      alert('Unavailable', 'This record has no file attached.');
      return;
    }
    setViewerError('');
    setIsViewerLoading(true);
    setViewerRecord(record);
  };

  /* -------------------------------- derived ------------------------------ */

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(r => r.name.toLowerCase().includes(q));
  }, [records, search]);

  // Newest first, split into month headings.
  const groupedRecords = useMemo(() => {
    const sorted = [...filteredRecords].sort((a, b) => {
      const ta = a.documentDate ? new Date(a.documentDate).getTime() : 0;
      const tb = b.documentDate ? new Date(b.documentDate).getTime() : 0;
      return tb - ta;
    });
    const groups = [];
    sorted.forEach(record => {
      const label = monthGroupOf(record.documentDate);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(record);
      else groups.push({ label, items: [record] });
    });
    return groups;
  }, [filteredRecords]);

  const showSearch = records.length >= SEARCH_MIN_RECORDS || !!search;

  /* --------------------------------- render ------------------------------ */

  const renderRecord = record => {
    const editing = editingRecordId === record.recordId && !isCaregiver;
    const TypeIcon = isPdf(record) ? FileText : ImageIcon;

    return (
      <View key={record.recordId} style={styles.recordItem}>
        <View style={styles.recordIcon}>
          <TypeIcon size={18} color="#11418A" />
        </View>

        <View style={styles.recordItemContent}>
          {editing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editNameInput}
                value={editNameValue}
                onChangeText={setEditNameValue}
                editable={!isSavingName}
                placeholder="Document name"
                placeholderTextColor="#94A3B8"
                maxLength={MAX_NAME_LENGTH}
                autoFocus
              />
              <TouchableOpacity
                onPress={saveRename}
                disabled={isSavingName}
                style={styles.iconBtn}
                accessibilityLabel="Save name"
              >
                {isSavingName ? (
                  <ActivityIndicator size="small" color="#11418A" />
                ) : (
                  <Check size={18} color="#059669" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={cancelRename}
                style={styles.iconBtn}
                accessibilityLabel="Cancel rename"
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.recordTitle} numberOfLines={2}>
                {record.name}
              </Text>
              <Text style={styles.recordMeta}>
                {[
                  formatDate(record.documentDate),
                  formatTime(record.documentDate),
                  formatSize(record.fileSize),
                ]
                  .filter(Boolean)
                  .join('  ·  ')}
              </Text>
            </>
          )}
        </View>

        {!editing && (
          <View style={styles.recordActions}>
            <TouchableOpacity
              onPress={() => openViewer(record)}
              style={styles.iconBtn}
              accessibilityLabel={`Open ${record.name}`}
            >
              <Eye size={18} color="#11418A" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDownload(record)}
              style={styles.iconBtn}
              disabled={downloadingRecordId === record.recordId}
              accessibilityLabel={`Download ${record.name}`}
            >
              {downloadingRecordId === record.recordId ? (
                <ActivityIndicator size="small" color="#11418A" />
              ) : (
                <Download size={18} color="#11418A" />
              )}
            </TouchableOpacity>
            {!isCaregiver && !record.isClinical && (
              <TouchableOpacity
                onPress={() => startRename(record)}
                style={styles.iconBtn}
                accessibilityLabel={`Rename ${record.name}`}
              >
                <Pencil size={17} color="#11418A" />
              </TouchableOpacity>
            )}
            {!isCaregiver && !record.isClinical && (
              <TouchableOpacity
                onPress={() => handleDelete(record)}
                style={styles.iconBtn}
                disabled={deletingRecordId !== null}
                accessibilityLabel={`Delete ${record.name}`}
              >
                {deletingRecordId === record.recordId ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Trash2 size={17} color="#DC2626" />
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      {AlertComponent}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.screen}>
          <ProfileHeader navigation={navigation} title="Health Records" />

          <View style={styles.container}>
            {/* ------------------------- Upload ------------------------- */}
            <Text style={styles.header}>Upload Records</Text>
            <View style={styles.uploadCard}>
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
                    : `PNG, JPG, PDF up to ${MAX_FILE_SIZE_MB}MB · scans (.dcm/.zip) up to ${MAX_IMAGING_SIZE_MB / 1024}GB · max ${MAX_FILES_PER_UPLOAD} files`}
                </Text>
              </TouchableOpacity>

              {/* Name each selected document before saving */}
              {selectedFiles.length > 0 && !isCaregiver && (
                <View style={styles.namingBlock}>
                  <Text style={styles.namingHint}>
                    Give each document a name you'll recognise later.
                  </Text>
                  {selectedFiles.map((file, index) => (
                    <View key={`${file.uri}-${index}`} style={styles.namingRow}>
                      <View style={styles.namingIcon}>
                        {/pdf/i.test(file.type) ? (
                          <FileText size={16} color="#11418A" />
                        ) : (
                          <ImageIcon size={16} color="#11418A" />
                        )}
                      </View>
                      <View style={styles.namingFields}>
                        <TextInput
                          style={styles.nameInput}
                          value={file.docName}
                          onChangeText={value => setDocName(index, value)}
                          placeholder="e.g. Blood Test Report"
                          placeholderTextColor="#94A3B8"
                          maxLength={MAX_NAME_LENGTH}
                          editable={!isUploading}
                        />
                        <Text style={styles.namingOriginal} numberOfLines={1}>
                          {file.name}
                          {formatSize(file.size) ? `  ·  ${formatSize(file.size)}` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeSelectedFile(index)}
                        style={styles.removeButton}
                        disabled={isUploading}
                        accessibilityLabel={`Remove ${file.name}`}
                      >
                        <X size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {!isCaregiver && (
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    (isUploading || selectedFiles.length === 0) && styles.submitBtnDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isUploading || selectedFiles.length === 0}
                >
                  {isUploading ? (
                    <View style={styles.uploadingRow}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.submitBtnText}>
                        Uploading {Math.min(uploadProgress.done + 1, uploadProgress.total)} of{' '}
                        {uploadProgress.total}…
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.submitBtnText}>Save to my records</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* ------------------------- Records ------------------------- */}
            <View style={styles.recordsHeaderRow}>
              <Text style={styles.viewRecordsTitle}>My Health Records</Text>
              {records.length > 0 && (
                <Text style={styles.recordsCount}>
                  {records.length} {records.length === 1 ? 'file' : 'files'}
                </Text>
              )}
            </View>

            {showSearch && (
              <View style={styles.searchBox}>
                <Search size={17} color="#64748B" />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search by document name"
                  placeholderTextColor="#94A3B8"
                  returnKeyType="search"
                />
                {!!search && (
                  <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Clear search">
                    <X size={16} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {isFetching ? (
              <ActivityIndicator size="large" color="#11418A" style={styles.fetchLoader} />
            ) : loadError ? (
              <View style={styles.emptyRecords}>
                <Text style={styles.emptyRecordsText}>{loadError}</Text>
                <TouchableOpacity onPress={() => getRecords(search)} style={styles.retryBtn}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : groupedRecords.length > 0 ? (
              groupedRecords.map(group => (
                <View key={group.label}>
                  <Text style={styles.monthHeading}>{group.label}</Text>
                  {group.items.map(renderRecord)}
                </View>
              ))
            ) : (
              <View style={styles.emptyRecords}>
                <FolderOpen size={30} color="#94A3B8" />
                <Text style={styles.emptyRecordsTitle}>
                  {search ? 'No matching records' : 'No records yet'}
                </Text>
                <Text style={styles.emptyRecordsText}>
                  {search
                    ? `Nothing matches "${search}".`
                    : 'Upload a report, prescription or scan to keep it safe here.'}
                </Text>
              </View>
            )}
          </View>

          {/* --------------------- Upload source modal --------------------- */}
          <Modal
            visible={showUploadModal}
            transparent
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

                <TouchableOpacity style={styles.modalButton} onPress={pickImageFromCamera}>
                  <Image source={Images.CAMERA} style={styles.modalIcon} />
                  <Text style={styles.modalButtonText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalButton} onPress={pickImageFromGallery}>
                  <Image source={Images.UPLOAD} style={styles.modalIcon} />
                  <Text style={styles.modalButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalButton} onPress={pickDocumentForUpload}>
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

          {/* ------------------------ Record viewer ------------------------ */}
          <Modal
            visible={!!viewerRecord}
            transparent
            animationType="fade"
            onRequestClose={() => setViewerRecord(null)}
          >
            <View style={styles.viewerOverlay}>
              <View style={styles.viewerHeader}>
                <Text style={styles.viewerTitle} numberOfLines={1}>
                  {viewerRecord?.name}
                </Text>
                <TouchableOpacity
                  onPress={() => setViewerRecord(null)}
                  style={styles.viewerClose}
                  accessibilityLabel="Close"
                >
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.viewerBody}>
                {isViewerLoading && !viewerError && (
                  <ActivityIndicator size="large" color="#FFFFFF" style={styles.viewerLoader} />
                )}

                {viewerError ? (
                  <View style={styles.viewerErrorBox}>
                    <Text style={styles.viewerErrorText}>{viewerError}</Text>
                  </View>
                ) : viewerRecord && isPdf(viewerRecord) ? (
                  <Pdf
                    source={{ uri: viewerRecord.fileUrl, cache: true }}
                    style={styles.viewerPdf}
                    trustAllCerts={false}
                    onLoadComplete={() => setIsViewerLoading(false)}
                    onError={() => {
                      setIsViewerLoading(false);
                      setViewerError('This document could not be opened.');
                    }}
                  />
                ) : viewerRecord ? (
                  <Image
                    source={{ uri: viewerRecord.fileUrl }}
                    style={styles.viewerImage}
                    resizeMode="contain"
                    onLoadEnd={() => setIsViewerLoading(false)}
                    onError={() => {
                      setIsViewerLoading(false);
                      setViewerError('This image could not be opened.');
                    }}
                  />
                ) : null}
              </View>

              {viewerRecord && (
                <TouchableOpacity
                  style={styles.viewerDownload}
                  onPress={() => handleDownload(viewerRecord)}
                  disabled={downloadingRecordId === viewerRecord.recordId}
                >
                  {downloadingRecordId === viewerRecord.recordId ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Download size={17} color="#FFFFFF" />
                  )}
                  <Text style={styles.viewerDownloadText}>Download</Text>
                </TouchableOpacity>
              )}
            </View>
          </Modal>
        </View>
      </ScrollView>

      {/* One-time record-sharing consent. Shown before the FIRST upload only — once granted
          the server remembers, so it never reappears (and reappears if consent is revoked). */}
      <Modal visible={showConsent} transparent animationType="fade" onRequestClose={() => setShowConsent(false)}>
        <View style={styles.consentBackdrop}>
          <View style={styles.consentCard}>
            <Text style={styles.consentTitle}>Share records with your doctor?</Text>
            <Text style={styles.consentBody}>
              The documents you upload will be visible to the doctor treating you, so they can
              see your reports during a consultation.
            </Text>
            <Text style={styles.consentBody}>
              You can turn this off at any time from your Profile. Turning it off hides your
              uploads from doctors — nothing is deleted, and they stay in your own records.
            </Text>
            <View style={styles.consentActions}>
              <TouchableOpacity onPress={() => setShowConsent(false)} style={styles.consentCancel}>
                <Text style={styles.consentCancelText}>Not now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={grantConsent}
                disabled={savingConsent}
                style={[styles.consentAgree, savingConsent && { opacity: 0.6 }]}
              >
                {savingConsent ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.consentAgreeText}>Agree &amp; upload</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC', paddingBottom: hp(4) },
  container: { paddingHorizontal: wp(4) },

  header: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: hp(2),
    marginBottom: hp(1.4),
  },

  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: wp(4),
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: hp(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxDisabled: { opacity: 0.5 },
  uploadIcon: { width: wp(9), height: wp(9), resizeMode: 'contain' },
  uploadIconDisabled: { opacity: 0.5 },
  uploadLabel: {
    marginTop: hp(1),
    fontSize: hp(1.9),
    fontWeight: '600',
    color: '#11418A',
  },
  fileText: {
    marginTop: hp(0.5),
    fontSize: hp(1.5),
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: wp(6),
  },
  textDisabled: { color: '#94A3B8' },

  namingBlock: { marginTop: hp(2) },
  namingHint: { fontSize: hp(1.5), color: '#64748B', marginBottom: hp(1) },
  namingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: wp(2.5),
    marginBottom: hp(1),
  },
  namingIcon: {
    width: wp(8),
    height: wp(8),
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  namingFields: { flex: 1, marginHorizontal: wp(2.5) },
  nameInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: wp(3),
    paddingVertical: Platform.OS === 'ios' ? hp(1.1) : hp(0.6),
    fontSize: hp(1.7),
    color: '#0F172A',
  },
  namingOriginal: { fontSize: hp(1.3), color: '#94A3B8', marginTop: hp(0.4) },
  removeButton: {
    width: wp(7),
    height: wp(7),
    borderRadius: wp(3.5),
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitBtn: {
    backgroundColor: '#11418A',
    borderRadius: 10,
    paddingVertical: hp(1.8),
    alignItems: 'center',
    marginTop: hp(2),
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontSize: hp(1.9), fontWeight: '600' },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: wp(2) },

  consentBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', paddingHorizontal: wp(6) },
  consentCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: wp(5) },
  consentTitle: { fontSize: hp(2), fontWeight: '700', color: '#0F172A', marginBottom: hp(1) },
  consentBody: { fontSize: hp(1.6), color: '#475569', lineHeight: hp(2.3), marginBottom: hp(1) },
  consentActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: hp(1) },
  consentCancel: { paddingVertical: hp(1.2), paddingHorizontal: wp(4) },
  consentCancelText: { color: '#64748B', fontSize: hp(1.7), fontWeight: '600' },
  consentAgree: { backgroundColor: '#11418A', borderRadius: 10, paddingVertical: hp(1.2), paddingHorizontal: wp(5), minWidth: wp(34), alignItems: 'center' },
  consentAgreeText: { color: '#FFFFFF', fontSize: hp(1.7), fontWeight: '700' },
  recordsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(3),
    marginBottom: hp(1),
  },
  viewRecordsTitle: { fontSize: hp(2.2), fontWeight: '700', color: '#0F172A' },
  recordsCount: { fontSize: hp(1.5), color: '#64748B' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: wp(3),
    marginBottom: hp(1.5),
  },
  searchInput: {
    flex: 1,
    fontSize: hp(1.7),
    color: '#0F172A',
    paddingVertical: Platform.OS === 'ios' ? hp(1.3) : hp(0.9),
  },

  monthHeading: {
    fontSize: hp(1.6),
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: hp(1.6),
    marginBottom: hp(0.8),
  },

  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: wp(3),
    marginBottom: hp(1),
  },
  recordIcon: {
    width: wp(10),
    height: wp(10),
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordItemContent: { flex: 1, marginLeft: wp(3) },
  recordTitle: { fontSize: hp(1.8), fontWeight: '600', color: '#0F172A' },
  recordMeta: { fontSize: hp(1.4), color: '#64748B', marginTop: hp(0.4) },
  recordActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: {
    paddingHorizontal: wp(1.6),
    paddingVertical: hp(0.8),
    alignItems: 'center',
    justifyContent: 'center',
  },

  editRow: { flexDirection: 'row', alignItems: 'center' },
  editNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: wp(2.5),
    paddingVertical: Platform.OS === 'ios' ? hp(1) : hp(0.5),
    fontSize: hp(1.7),
    color: '#0F172A',
  },

  fetchLoader: { marginTop: hp(4) },
  emptyRecords: {
    alignItems: 'center',
    paddingVertical: hp(5),
    paddingHorizontal: wp(6),
  },
  emptyRecordsTitle: {
    fontSize: hp(1.9),
    fontWeight: '600',
    color: '#334155',
    marginTop: hp(1.4),
  },
  emptyRecordsText: {
    fontSize: hp(1.6),
    color: '#64748B',
    textAlign: 'center',
    marginTop: hp(0.6),
  },
  retryBtn: { marginTop: hp(1.6) },
  retryText: { fontSize: hp(1.7), fontWeight: '600', color: '#11418A' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: wp(82),
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: wp(5),
  },
  modalTitle: {
    fontSize: hp(2),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: hp(2),
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(3),
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginBottom: hp(1.2),
  },
  modalIcon: { width: wp(5.5), height: wp(5.5), resizeMode: 'contain' },
  modalButtonText: {
    marginLeft: wp(3),
    fontSize: hp(1.8),
    color: '#0F172A',
    fontWeight: '500',
  },
  cancelButton: { backgroundColor: 'transparent', justifyContent: 'center' },
  cancelButtonText: { fontSize: hp(1.8), color: '#64748B', fontWeight: '600' },

  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: hp(6),
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.5),
  },
  viewerTitle: { flex: 1, color: '#FFFFFF', fontSize: hp(1.9), fontWeight: '600' },
  viewerClose: { padding: wp(2) },
  viewerBody: { flex: 1, justifyContent: 'center' },
  viewerLoader: { position: 'absolute', alignSelf: 'center' },
  viewerPdf: { flex: 1, backgroundColor: 'transparent' },
  viewerImage: { flex: 1, width: '100%' },
  viewerErrorBox: { alignItems: 'center', padding: wp(8) },
  viewerErrorText: { color: '#FCA5A5', fontSize: hp(1.8), textAlign: 'center' },
  viewerDownload: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    margin: wp(4),
    paddingVertical: hp(1.6),
    borderRadius: 10,
    backgroundColor: '#11418A',
  },
  viewerDownloadText: { color: '#FFFFFF', fontSize: hp(1.8), fontWeight: '600' },
});

export default HealthRecords;
