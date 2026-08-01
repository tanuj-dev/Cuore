// CuoreCare real-time socket (patient app) — a single, app-wide socket.io connection to the
// CuoreCare backend, authenticated with the same JWT the REST client uses.
//
// Lifecycle is driven from App.js (connect on login, disconnect on logout). Screens read the
// live socket via getSocket() and attach their own listeners in a focus/mount effect. The
// module holds exactly one socket; connectSocket() is idempotent-ish (replaces any prior one).
//
// This is intentionally independent of ZEGO/ZIM (different transport, different lib) so it
// never contends with the video SDK or the single-instance ZIM chat client.
import { io } from 'socket.io-client';
import EncryptedStorage from 'react-native-encrypted-storage';
import { CUORECARE_BASE_URL } from '../utilities/cuoreCareConfig';

let socket = null;

// Same token source as utilities/cuoreCareApi.js: EncryptedStorage 'auth_tokens'.accessToken.
async function readToken() {
  try {
    const raw = await EncryptedStorage.getItem('auth_tokens');
    return raw ? JSON.parse(raw)?.accessToken || null : null;
  } catch (e) {
    return null;
  }
}

function teardown() {
  if (socket) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch (e) {
      /* ignore */
    }
    socket = null;
  }
}

export async function connectSocket() {
  const token = await readToken();
  if (!token) return null;
  teardown();
  socket = io(CUORECARE_BASE_URL, {
    auth: { token },
    transports: ['websocket'], // RN: websocket-only is the reliable transport
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 15000,
  });
  socket.on('connect_error', err => {
    // Non-fatal: log for diagnostics. Auth failures simply leave the app socket-less until
    // the next login; the REST flows and screen-focus refetches keep working regardless.
    console.warn('[cuorecare][socket] connect_error:', err?.message);
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function isSocketConnected() {
  return !!(socket && socket.connected);
}

export function disconnectSocket() {
  teardown();
}

export function subscribeAppointment(appointmentId) {
  if (socket && appointmentId) socket.emit('appointment:subscribe', { appointmentId });
}

export function unsubscribeAppointment(appointmentId) {
  if (socket && appointmentId) socket.emit('appointment:unsubscribe', { appointmentId });
}
