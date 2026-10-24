import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking, Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  pick as pickDocument,
  types as docTypes,
  isErrorWithCode,
  errorCodes as docErrorCodes,
} from '@react-native-documents/picker';
import { FlaskConical, ChevronRight, Upload } from 'lucide-react-native';

import { CC } from './ccTheme';
import { Card, EmptyState, PrimaryButton } from './components';
import { fmtDayLabel } from './ccFormat';
import { uploadPhoto } from '../../redux/uploadPhoto/uploadPhotoThunk';
import { getApiCall, putApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

const F = CC.fonts;

/**
 * CuoreCare → Records → Diagnostics.
 *
 * Lab / test reports the patient uploads for their doctor. They are ordinary health records
 * (same upload endpoint, same private S3 storage, same per-profile ownership) tagged
 * `category: "diagnostics"`, which is what CuoreMD's patient page groups into its own
 * "Diagnostics" card. They also still appear in the patient's full Health Records list.
 *
 * Visibility to the doctor follows the existing record-sharing consent: the server refuses any
 * upload until it is granted, so it is asked for here before the first one, in the same words
 * the Health Records screen uses.
 *
 * Owns its own list rather than using the shared health-records slice, so filtering to
 * diagnostics here can never replace the full list the Health Records screen shows.
 */
export default function DiagnosticsTab({ activeProfileId, alert, refreshKey }) {
  const dispatch = useDispatch();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = ['category=diagnostics'];
    if (activeProfileId) params.push(`patientId=${encodeURIComponent(activeProfileId)}`);
    const res = await getApiCall(EndPoints.HEALTH_RECORDS, `?${params.join('&')}`);
    setRecords(res?.status === 200 && Array.isArray(res.data?.data) ? res.data.data : []);
    setLoading(false);
  }, [activeProfileId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const upload = async file => {
    setUploading(true);
    try {
      await dispatch(
        uploadPhoto({
          file: {
            uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
            type: file.type,
            name: file.name,
          },
          // The patient's file name, minus its extension, is the report's name.
          name: String(file.name || 'Diagnostic report').replace(/\.[^.]+$/, ''),
          patientId: activeProfileId || undefined,
          category: 'diagnostics',
        }),
      ).unwrap();
      await load();
      alert('Report uploaded', 'Your doctor can now see this report.');
    } catch (e) {
      alert('Could not upload', String(e || 'Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const pickFromGallery = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 });
    if (result.didCancel) return;
    if (result.errorCode) {
      alert('Error', result.errorMessage || 'Could not open your photos.');
      return;
    }
    const photo = result.assets?.[0];
    if (photo) {
      upload({
        uri: photo.uri,
        type: photo.type || 'image/jpeg',
        name: photo.fileName || `report_${Date.now()}.jpg`,
      });
    }
  };

  const pickPdf = async () => {
    try {
      const [doc] = await pickDocument({ type: [docTypes.pdf] });
      if (doc) {
        upload({
          uri: doc.uri,
          type: doc.type || 'application/pdf',
          name: doc.name || `report_${Date.now()}.pdf`,
        });
      }
    } catch (err) {
      if (isErrorWithCode(err) && err.code === docErrorCodes.OPERATION_CANCELED) return;
      alert('Error', err?.message || 'Could not open the file. Please try again.');
    }
  };

  const chooseSource = () =>
    alert('Upload a report', 'Add a photo of the report or its PDF.', [
      // Same delay as Health Records: presenting a native picker while the dialog is still
      // dismissing silently fails on iOS.
      { text: 'Photo', onPress: () => setTimeout(pickFromGallery, 300) },
      { text: 'PDF', onPress: () => setTimeout(pickPdf, 300) },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const grantConsentThenChoose = async () => {
    const res = await putApiCall('/api/health-records/consent', { granted: true });
    if (res?.status === 200) chooseSource();
    else alert('Could not save', 'Please try again.');
  };

  const onUploadPress = async () => {
    const res = await getApiCall('/api/health-records/consent', '');
    if (res?.status === 200 && res.data?.consent?.required) {
      alert(
        'Share records with your doctor?',
        'The documents you upload will be visible to the doctor treating you, so they can see your reports during a consultation. You can turn this off at any time from your Profile.',
        [
          { text: 'Agree & upload', onPress: grantConsentThenChoose },
          { text: 'Not now', style: 'cancel' },
        ],
      );
      return;
    }
    chooseSource();
  };

  return (
    <View>
      <PrimaryButton
        label="Upload report"
        icon={<Upload size={18} color={CC.white} />}
        loading={uploading}
        disabled={uploading}
        onPress={onUploadPress}
        style={styles.uploadBtn}
      />

      {loading && records.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={CC.primary} />
        </View>
      ) : records.length === 0 ? (
        <EmptyState
          icon={<FlaskConical size={40} color={CC.muted} />}
          title="No diagnostic reports yet"
          message="Upload lab or test reports here and your doctor will see them in your records."
        />
      ) : (
        records.map(r => (
          <Card
            key={r.recordId}
            style={styles.row}
            onPress={() => (r.fileUrl ? Linking.openURL(r.fileUrl) : null)}
          >
            <View style={styles.icon}>
              <FlaskConical size={20} color={CC.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {r.name}
              </Text>
              <Text style={styles.sub}>Uploaded {fmtDayLabel(r.uploadedAt || r.documentDate)}</Text>
            </View>
            <ChevronRight size={20} color={CC.muted} />
          </Card>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  uploadBtn: { marginBottom: 16 },
  center: { paddingVertical: 48, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: CC.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: { fontFamily: F.PoppinsSemiBold, fontSize: 14.5, color: CC.text },
  sub: { fontFamily: F.PoppinsRegular, fontSize: 12.5, color: CC.subText, marginTop: 2 },
});
