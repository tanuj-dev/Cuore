import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import { Download, Share2, FileWarning, RefreshCw } from 'lucide-react-native';

import { CC } from './ccTheme';
import { CCHeader } from './components';
import { fmtDayLabel } from './ccFormat';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { fetchPrescriptionUrl, fetchCertificateUrl } from '../../redux/CuoreCare/thunks';
import { useCCBack } from './ccBack';

const F = CC.fonts;

// Certificate type → the wording the patient sees.
const CERT_LABEL = {
  fitness: 'Medical Fitness Certificate',
  sick_leave: 'Medical Leave Certificate',
  medical: 'Medical Certificate',
  fit_to_travel: 'Fit to Travel Certificate',
  custom: 'Medical Certificate',
};

/**
 * Signed-URL PDF viewer for CuoreCare documents. Serves BOTH prescriptions and medical
 * certificates — they share the same private-S3 + short-lived-signed-URL delivery, so the
 * screen is one component registered under two routes. Pass either `prescriptionId` or
 * `certificateId` in route params.
 */
export default function PrescriptionView({ navigation, route }) {
  const { prescriptionId, certificateId } = route.params || {};
  // Back that works even when this screen was deep-linked in as the stack's only route.
  const onBack = useCCBack(navigation);
  const isCertificate = !!certificateId && !prescriptionId;
  const docId = isCertificate ? certificateId : prescriptionId;
  const docLabel = isCertificate ? 'Certificate' : 'Prescription';
  const { alert, AlertComponent } = useCustomAlert();

  const [state, setState] = useState({ loading: true, url: null, error: null, meta: null });
  const [busy, setBusy] = useState(false);

  const fetchUrl = useCallback(
    id => (isCertificate ? fetchCertificateUrl(id) : fetchPrescriptionUrl(id)),
    [isCertificate],
  );

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    const res = await fetchUrl(docId);
    if (res.ok) {
      setState({ loading: false, url: res.data.url, error: null, meta: res.data });
    } else {
      setState({
        loading: false,
        url: null,
        error: res.error?.message || `Could not open ${isCertificate ? 'certificate' : 'prescription'}`,
        meta: null,
      });
    }
  }, [docId, fetchUrl, isCertificate]);

  useEffect(() => {
    load();
  }, [load]);

  // Signed URLs are short-lived (300s), so re-fetch a fresh one for each download/share.
  const withFreshUrl = useCallback(
    async fn => {
      setBusy(true);
      try {
        const res = await fetchUrl(docId);
        if (!res.ok) {
          alert('Unavailable', res.error?.message || `Could not fetch the ${docLabel.toLowerCase()}.`);
          return;
        }
        await fn(res.data);
      } catch (e) {
        alert('Something went wrong', e?.message || 'Please try again.');
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [docId, fetchUrl, alert],
  );

  const fileName = `CuoreCare_${docLabel}_${String(docId).replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`;

  const downloadToTemp = async url => {
    const path = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fileName}`;
    const resp = await ReactNativeBlobUtil.config({ fileCache: true, path, appendExt: 'pdf' }).fetch('GET', url);
    return resp.path();
  };

  const handleShare = () =>
    withFreshUrl(async data => {
      const localPath = await downloadToTemp(data.url);
      const fileUri = Platform.OS === 'android' ? `file://${localPath}` : localPath;
      try {
        await Share.open({
          url: fileUri,
          type: 'application/pdf',
          filename: fileName,
          failOnCancel: false,
        });
      } catch (e) {
        if (!/cancel/i.test(e?.message || '')) throw e;
      }
    });

  const handleDownload = () =>
    withFreshUrl(async data => {
      if (Platform.OS === 'android') {
        const { dirs } = ReactNativeBlobUtil.fs;
        await ReactNativeBlobUtil.config({
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            title: fileName,
            description: `CuoreCare ${docLabel.toLowerCase()}`,
            mime: 'application/pdf',
            mediaScannable: true,
            path: `${dirs.DownloadDir}/${fileName}`,
          },
        }).fetch('GET', data.url);
        alert('Downloaded', `Your ${docLabel.toLowerCase()} has been saved to Downloads.`);
      } else {
        // iOS has no shared Downloads folder — route through the share sheet ("Save to Files").
        const localPath = await downloadToTemp(data.url);
        await Share.open({ url: localPath, type: 'application/pdf', filename: fileName, failOnCancel: false }).catch(e => {
          if (!/cancel/i.test(e?.message || '')) throw e;
        });
      }
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {AlertComponent}
      <CCHeader
        title={isCertificate ? CERT_LABEL[state.meta?.type] || 'Certificate' : 'Prescription'}
        subtitle={state.meta?.issuedAt ? `Issued ${fmtDayLabel(state.meta.issuedAt)}` : undefined}
        onBack={onBack}
      />

      <View style={styles.body}>
        {state.loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={CC.primary} />
            <Text style={styles.loadingText}>Loading {docLabel.toLowerCase()}…</Text>
          </View>
        ) : state.error ? (
          <View style={styles.center}>
            <View style={styles.errIcon}>
              <FileWarning size={30} color={CC.danger} />
            </View>
            <Text style={styles.errTitle}>Couldn’t open {docLabel.toLowerCase()}</Text>
            <Text style={styles.errMsg}>{state.error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load}>
              <RefreshCw size={16} color={CC.white} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Pdf
            source={{ uri: state.url, cache: true }}
            style={styles.pdf}
            trustAllCerts={false}
            onError={e => setState(s => ({ ...s, error: 'Could not render the PDF file.' }))}
          />
        )}
      </View>

      {!state.loading && !state.error && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionGhost]}
            onPress={handleShare}
            disabled={busy}
          >
            <Share2 size={18} color={CC.primary} />
            <Text style={styles.actionGhostText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionPrimary]}
            onPress={handleDownload}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={CC.white} size="small" />
            ) : (
              <>
                <Download size={18} color={CC.white} />
                <Text style={styles.actionPrimaryText}>Download</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CC.surface },
  body: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { fontFamily: F.PoppinsRegular, fontSize: 13, color: CC.subText, marginTop: 12 },
  pdf: { flex: 1, width, backgroundColor: '#525659' },
  errIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: CC.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errTitle: { fontFamily: F.PoppinsSemiBold, fontSize: 16, color: CC.text },
  errMsg: { fontFamily: F.PoppinsRegular, fontSize: 13, color: CC.subText, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CC.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginTop: 20,
    gap: 8,
  },
  retryText: { fontFamily: F.PoppinsSemiBold, fontSize: 14, color: CC.white },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: CC.white,
    borderTopWidth: 1,
    borderTopColor: CC.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  actionGhost: { backgroundColor: CC.white, borderWidth: 1.5, borderColor: CC.primary },
  actionGhostText: { fontFamily: F.PoppinsSemiBold, fontSize: 14.5, color: CC.primary },
  actionPrimary: { backgroundColor: CC.primary },
  actionPrimaryText: { fontFamily: F.PoppinsSemiBold, fontSize: 14.5, color: CC.white },
});
