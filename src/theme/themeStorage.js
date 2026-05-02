import EncryptedStorage from 'react-native-encrypted-storage';

const THEME_KEY = 'cuore_theme_mode';

export async function loadStoredThemeMode() {
  try {
    const v = await EncryptedStorage.getItem(THEME_KEY);
    if (v === 'dark' || v === 'light') {
      return v;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function persistThemeMode(mode) {
  try {
    if (mode === 'dark' || mode === 'light') {
      await EncryptedStorage.setItem(THEME_KEY, mode);
    }
  } catch {
    // ignore
  }
}
