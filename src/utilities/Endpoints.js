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
};

export default Endpoints;
