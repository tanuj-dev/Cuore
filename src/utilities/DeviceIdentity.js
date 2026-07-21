import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import EncryptedStorage from 'react-native-encrypted-storage';

/**
 * DeviceIdentity
 * ------------------------------------------------------------------
 * Collects a small, privacy-respecting set of device signals that we send to
 * the backend at signup so it can tell whether many accounts are being
 * onboarded from the SAME physical phone (e.g. a field agent who keeps the app
 * installed on one device and just types in OTPs collected from real users).
 *
 * Two identifiers, strongest first:
 *   - vendor_id : DeviceInfo.getUniqueId()
 *                 iOS  -> identifierForVendor (IDFV)
 *                 Android -> ANDROID_ID (SSAID)
 *                 Stable while the app stays installed; this alone catches the
 *                 "same phone, many numbers" case.
 *   - install_id: a UUID we generate once and persist in EncryptedStorage
 *                 (Keychain-backed on iOS) so it survives a normal reinstall.
 *
 * Everything here is best-effort and must NEVER throw into the signup flow.
 */

const INSTALL_ID_KEY = 'device_install_id';

// Small dependency-free UUID-ish generator (good enough for an install id).
function generateInstallId() {
  const rand = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${rand()}${rand()}-${rand()}-${rand()}-${rand()}-${rand()}${rand()}${rand()}`;
}

async function getOrCreateInstallId() {
  try {
    const existing = await EncryptedStorage.getItem(INSTALL_ID_KEY);
    if (existing) return existing;
    const fresh = generateInstallId();
    await EncryptedStorage.setItem(INSTALL_ID_KEY, fresh);
    return fresh;
  } catch (e) {
    // Storage failed (rare) — fall back to a non-persisted id so we still send
    // something; it just won't survive a reinstall.
    return generateInstallId();
  }
}

/**
 * Returns the device_info object to attach to the create-account payload.
 * Always resolves (never rejects); returns null only in a total failure.
 */
export async function getDeviceInfo() {
  try {
    const [vendorId, installId, isEmulator] = await Promise.all([
      DeviceInfo.getUniqueId().catch(() => null),
      getOrCreateInstallId(),
      DeviceInfo.isEmulator().catch(() => false),
    ]);

    return {
      platform: Platform.OS, // 'ios' | 'android'
      vendor_id: vendorId,
      install_id: installId,
      model: safe(() => DeviceInfo.getModel()),
      brand: safe(() => DeviceInfo.getBrand()),
      os_version: safe(() => DeviceInfo.getSystemVersion()),
      app_version: safe(() => DeviceInfo.getVersion()),
      is_emulator: !!isEmulator,
    };
  } catch (e) {
    console.warn('[DeviceIdentity] getDeviceInfo failed:', e?.message || e);
    return null;
  }
}

function safe(fn) {
  try {
    return fn() || '';
  } catch {
    return '';
  }
}

export default { getDeviceInfo };
