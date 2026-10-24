// Last-known CuoreCare tab gate, so the bottom bar can pick Notes vs CuoreCare on the very
// first render instead of flashing Notes until /api/cuorecare/access answers.
//
// Only the two flags the tab gate reads are cached. The cache is tagged with the userId from
// auth_tokens and ignored for anyone else, so a different login on the same device never
// inherits the previous user's tab. The server stays the authority: the live fetch always
// runs and overwrites whatever was hydrated from here.

import EncryptedStorage from 'react-native-encrypted-storage';

const KEY = 'cuorecare_access_cache';

async function currentUserId() {
  try {
    const raw = await EncryptedStorage.getItem('auth_tokens');
    return raw ? JSON.parse(raw)?.userId ?? null : null;
  } catch (e) {
    return null;
  }
}

// Resolves to { cuoreCare, emr } for the signed-in user, or null on a miss.
export async function loadCachedAccess() {
  try {
    const [raw, userId] = await Promise.all([EncryptedStorage.getItem(KEY), currentUserId()]);
    if (!raw || !userId) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.userId !== userId) return null;
    return { cuoreCare: !!parsed.cuoreCare, emr: !!parsed.emr };
  } catch (e) {
    return null;
  }
}

export async function saveCachedAccess(access) {
  try {
    const userId = await currentUserId();
    if (!userId) return;
    await EncryptedStorage.setItem(
      KEY,
      JSON.stringify({ userId, cuoreCare: !!access?.cuoreCare, emr: !!access?.emr }),
    );
  } catch (e) {
    console.warn('[cuoreCareAccessCache] save failed:', e?.message);
  }
}
