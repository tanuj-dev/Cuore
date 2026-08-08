import { sendOtp, loginCaregiverThunk } from './Auth/authThunk';

import { verifyOtp } from './Auth/verifyOtpThunk';
import {
  updateProfile,
  getProfile,
  getDoctors,
  searchDoctors,
} from './Profile/profileThunk';
import { createAccountThunk } from './Auth/authThunk';
import { getOnboardingThunk } from './OnBoardng/onBoardingThunk';
import { createReassessment } from './OnBoardng/onBoardingThunk';
import { getHomeData, getHealthRecord } from './Home/homeThunk';
import { setReminder } from './Home/setReminderThunk';
// import { updateReminderTime } from './Home/updateTime';
import { getCuoreScoreThunk } from './OnBoardng/onBoardingThunk';
import { editWakeupThunk } from './Home/wakeupEdit';
import { editReminderThunk, deleteReminderThunk } from './Home/editReminder';
import {
  getNourish,
  getBuilderItems,
  getRecipe,
  adjustPortion,
  getKnowledge,
  getMind,
  getTobacco,
  updateTobaccoProfile,
  logTobaccoUsage,
} from './Explore/exploreThunk';
import { getFitness, updateFitnessTime } from './Fitness/fitnessThunk';
import { getPredict } from './Predict/predictThunk';
import { checkReminderThunk } from './Home/checkReminderThunk';
import { searchBuilderThunk } from './Nutrition/thunk';
import { getNotification } from './Home/notificationThunk';
import { shareData } from './Share/shareThunk';
import { editFilename } from './uploadPhoto/editFilenameThunk';
import { deleteRecord } from './uploadPhoto/deleteRecordThunk';
import {
  connectHealthThunk,
  syncHealthThunk,
  getHealthStatusThunk,
  disconnectHealthThunk,
} from './Health/healthThunks';

export {
  sendOtp,
  verifyOtp,
  updateProfile,
  createAccountThunk,
  getOnboardingThunk,
  createReassessment,
  getHomeData,
  setReminder,
  // updateReminderTime,
  getCuoreScoreThunk,
  editWakeupThunk,
  editReminderThunk,
  getNourish,
  getBuilderItems,
  getRecipe,
  adjustPortion,
  getFitness,
  getKnowledge,
  updateFitnessTime,
  getMind,
  getTobacco,
  updateTobaccoProfile,
  logTobaccoUsage,
  getPredict,
  deleteReminderThunk,
  getHealthRecord,
  getProfile,
  checkReminderThunk,
  searchBuilderThunk,
  loginCaregiverThunk,
  getDoctors,
  searchDoctors,
  getNotification,
  shareData,
  editFilename,
  deleteRecord,
  connectHealthThunk,
  syncHealthThunk,
  getHealthStatusThunk,
  disconnectHealthThunk,
};
