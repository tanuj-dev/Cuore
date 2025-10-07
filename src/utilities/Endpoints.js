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
};

export default Endpoints;
