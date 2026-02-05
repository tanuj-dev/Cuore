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
  UPLOAD_PHOTO: '/api/analyze-records', // AI summary endpoint - FormData: userId (text), files (file)
  EDIT_AI_SUMMARY: '/api/update-analysis',
  GET_PRESCRIPTION: '/api/get-prescriptions',
  EDIT_FILENAME: '/api/edit-filename', // PUT /api/edit-filename/:recordId - body: { fileName }
  DELETE_RECORD: '/api/delete-record', // DELETE /api/delete-record/:recordId
  REFRESH_TOKEN: '/api/v1/auth/refresh-token',
  DISMISS_ALERT: '/api/v1/timeline', // PUT /api/v1/timeline/:userId/dismiss-alert/:alertId
};

export default Endpoints;
