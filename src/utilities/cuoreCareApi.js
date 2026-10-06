import EncryptedStorage from 'react-native-encrypted-storage';
import ApiLogger from './ApiLogger';
import { CUORECARE_BASE_URL } from './cuoreCareConfig';

/**
 * Minimal fetch client for the CuoreCare API surface (`/api/cuorecare/*`).
 *
 * It is deliberately isolated from utilities/Services.js so the whole feature can point at
 * a different base URL (staging today, prod after merge — see cuoreCareConfig.js) by
 * changing exactly one constant. The bearer token is read from the same EncryptedStorage
 * slot the rest of the app uses (`auth_tokens` → accessToken).
 *
 * Every call resolves to `{ status, data }` and NEVER throws — callers branch on `status`,
 * mirroring the convention in Services.js. Network failures surface as `status: 0`.
 */
async function authHeaders(hasBody) {
  const headers = { Accept: 'application/json' };
  if (hasBody) headers['Content-Type'] = 'application/json';
  try {
    const raw = await EncryptedStorage.getItem('auth_tokens');
    if (raw) {
      const token = JSON.parse(raw)?.accessToken;
      // Only attach a real token — "Bearer undefined" trips the backend's jwt.verify.
      if (token && typeof token === 'string') {
        headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {
    console.warn('[cuoreCareApi] token read failed:', e?.message);
  }
  return headers;
}

async function request(method, path, body) {
  const url = CUORECARE_BASE_URL.replace(/\/$/, '') + path;
  const startedAt = Date.now();
  try {
    const headers = await authHeaders(body != null);
    const res = await fetch(url, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    ApiLogger.log({
      method,
      url,
      body,
      status: res.status,
      response: data,
      duration: Date.now() - startedAt,
    });
    return { status: res.status, data };
  } catch (error) {
    ApiLogger.log({
      method,
      url,
      body,
      status: 'ERR',
      response: error?.message,
      duration: Date.now() - startedAt,
    });
    return { status: 0, data: { message: error?.message || 'Network error' } };
  }
}

/** Append a query object as a URL-encoded string (skips null/empty values). */
export function withQuery(path, params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      usp.append(k, String(v));
    }
  });
  const qs = usp.toString();
  return qs ? `${path}?${qs}` : path;
}

export const ccGet = path => request('GET', path);
export const ccPost = (path, body) => request('POST', path, body);
export const ccPatch = (path, body) => request('PATCH', path, body);

export default { ccGet, ccPost, ccPatch, withQuery };
