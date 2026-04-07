/**
 * get-fcm-token.js
 * Generate a short-lived OAuth access token for FCM HTTP v1 (e.g. testfcm.in, curl, Postman).
 *
 * Usage:
 *   1. Firebase Console → Project Settings → Service accounts → Generate new private key
 *   2. Set SERVICE_ACCOUNT_KEY_PATH below (or use env GOOGLE_APPLICATION_CREDENTIALS)
 *   3. From repo root:  npm install   then   node get-fcm-token.js
 *
 * Requires network (reaches Google OAuth token endpoint).
 */

const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

// Prefer explicit path here, or set GOOGLE_APPLICATION_CREDENTIALS to the JSON file path.
const SERVICE_ACCOUNT_KEY_PATH = path.join(
  __dirname,
  'cuore-pn-firebase-adminsdk-fbsvc-6884ca0a64.json',
);

const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

function resolveKeyPath() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const p = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (fs.existsSync(p)) return p;
  }
  if (fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
    return SERVICE_ACCOUNT_KEY_PATH;
  }
  return null;
}

async function getAccessToken() {
  const keyPath = resolveKeyPath();
  if (!keyPath) {
    console.error('\n❌ Service account JSON not found.');
    console.error('   Tried:', SERVICE_ACCOUNT_KEY_PATH);
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.error('   Tried GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    }
    console.error('\n   Download the key from Firebase → Project settings → Service accounts,');
    console.error('   place it in the repo (do not commit), and update SERVICE_ACCOUNT_KEY_PATH.\n');
    process.exit(1);
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  } catch (e) {
    console.error('\n❌ Could not read or parse service account JSON:', keyPath);
    console.error('   ', e.message, '\n');
    process.exit(1);
  }

  if (!raw.client_email || !raw.private_key) {
    console.error('\n❌ File does not look like a service account key (missing client_email / private_key).\n');
    process.exit(1);
  }

  try {
    const auth = new GoogleAuth({
      credentials: raw,
      scopes: [FCM_SCOPE],
    });

    const client = await auth.getClient();
    const res = await client.getAccessToken();
    const token = typeof res === 'string' ? res : res?.token;

    if (!token || typeof token !== 'string') {
      console.error('\n❌ OAuth succeeded but no access token string was returned.');
      console.error('   Response:', res, '\n');
      process.exit(1);
    }

    console.log('\n✅ FCM HTTP v1 access token (Bearer):\n');
    console.log(token);
    console.log('\n📋 Paste into testfcm.in → Access Token (or use as Authorization: Bearer …)');
    console.log('⚠️  Expires in about 1 hour.\n');
  } catch (err) {
    console.error('\n❌ Failed to obtain access token.\n');

    if (err.message && err.message.includes('Cannot find module')) {
      console.error('   google-auth-library is missing. Run:  npm install\n');
      process.exit(1);
    }

    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      console.error('   Network error — check VPN/firewall/proxy. Google OAuth must be reachable.\n');
      console.error('   ', err.message, '\n');
      process.exit(1);
    }

    console.error('   ', err.message);
    if (err.response?.data) {
      console.error('   Details:', JSON.stringify(err.response.data, null, 2));
    }
    console.error('');
    if (err.stack) console.error(err.stack.split('\n').slice(0, 8).join('\n'), '\n');
    process.exit(1);
  }
}

getAccessToken();
