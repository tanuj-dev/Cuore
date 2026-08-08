const Endpoints = {
  GETOTP: '/api/v1/auth/otp/request',
  VERIFYOTP: '/api/v1/auth/otp/verify',
  BASICINFO: '/api/v1/onboarding/basic-info',
  HEALTHHISTORY: '/api/v1/onboarding/health-history',
  LIFESTYLE: '/api/v1/onboarding/lifestyle',
  EATINGEXCERCISE: '/api/v1/onboarding/exercise-eating',
  SLEEPSTRESS: '/api/v1/onboarding/sleep-stress',
  BIOMARKERS: '/api/v1/onboarding/biomarkers',
  CREATEACCOUNT: '/api/v1/auth/create-account',
  NEWUSEROTP: '/api/v1/auth/verify-new-user-otp',
  SUBMITONBOARDING: '/api/v1/onboarding/submit-all',
  REASSESSMENT: '/api/v1/onboarding/reassess',
  GETONBOARDING: '/api/v1/onboarding/data',
  EDIT_REMINDER: '/api/v1/users/userid/reminders/remindersid',
  GET_RECIPE: '/api/recipes',
  GET_BUILDER_ITEMS: '/api/builder/items',
  ADJUST_PORTION: '/api/builder/adjust-portions',
  GET_FITNESS: '/api/fitness/fitness-plan',
  UPDATE_FITNESS_TIME: '/api/fitness/update-ex-time',
  LOGINCAREGIVER: '/api/v1/auth/caregiver/otp/request',
  SHARE_DATA: '/api/v1/share/report',
  DELETEACCOUNT: '/api/v1/users',
  // Health records — plain, named document storage (no OCR/AI summarization).
  // POST   FormData: files (file), names (custom document name, one per file)
  // GET    ?q=<search on the custom document name>
  // PUT    /:recordId  body: { name }
  // DELETE /:recordId
  HEALTH_RECORDS: '/api/health-records',
  UPLOAD_PHOTO: '/api/health-records',
  GET_PRESCRIPTION: '/api/health-records',
  EDIT_FILENAME: '/api/health-records',
  DELETE_RECORD: '/api/health-records',
  REFRESH_TOKEN: '/api/v1/auth/refresh-token',
  LOGOUT: '/api/v1/auth/logout',
  DISMISS_ALERT: '/api/v1/timeline', // PUT /api/v1/timeline/:userId/dismiss-alert/:alertId
  VERIFY_SUBSCRIPTION: '/api/subscription/verify',
  RESTORE_PURCHASES: '/api/subscription/restore',
  NOTES: '/api/v1/notes',
  CHECK_APP_VERSION: '/api/v1/app/version',
  REQUEST_SUPERVISION: '/api/v1/users/request/supervision',
  RESPOND_CHECKIN: '/api/v1/users/respond-checkin',
  HEARTBEAT: '/api/v1/users/heartbeat',
};

export default Endpoints;
