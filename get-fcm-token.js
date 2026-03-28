/**
 * get-fcm-token.js
 * Run this to generate an FCM HTTP V1 Access Token for testing
 *
 * Usage:
 *   1. Download your Firebase Service Account JSON from:
 *      Firebase Console → Project Settings → Service Accounts → Generate new private key
 *
 *   2. Put the downloaded JSON file path below (SERVICE_ACCOUNT_KEY_PATH)
 *
 *   3. Run:  node get-fcm-token.js
 *
 *   4. Copy the printed token and paste it into testfcm.in → Access Token field
 */

const { GoogleAuth } = require('google-auth-library');
const path = require('path');

// ✏️  UPDATE THIS PATH to your downloaded service account JSON file
const SERVICE_ACCOUNT_KEY_PATH = path.join(
  __dirname,
  'cuore-pn-firebase-adminsdk-fbsvc-6884ca0a64.json',
);

async function getAccessToken() {
  try {
    const auth = new GoogleAuth({
      keyFile: SERVICE_ACCOUNT_KEY_PATH,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    const token = await auth.getAccessToken();

    console.log('\n✅ FCM HTTP V1 Access Token:\n');
    console.log(token);
    console.log('\n📋 Copy the token above and paste it into testfcm.in → Access Token field');
    console.log('⚠️  This token expires in 1 hour — generate a new one if needed\n');
  } catch (err) {
    if (err.message.includes('Cannot find module')) {
      console.error('\n❌ google-auth-library not installed.');
      console.error('Run:  npm install google-auth-library\n');
    } else if (err.message.includes('ENOENT')) {
      console.error('\n❌ Service account JSON file not found at:', SERVICE_ACCOUNT_KEY_PATH);
      console.error('👉 Update SERVICE_ACCOUNT_KEY_PATH in this script with the correct path\n');
    } else {
      console.error('\n❌ Error:', err.message, '\n');
    }
  }
}

getAccessToken();
