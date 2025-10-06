import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Images, hp, images, wp } from '../../utilities';
import ProgressBarWithImage from '../../components/ProgressBar';
import Modal from 'react-native-modal';
import Reminder from '../../components/Reminder';
import { useDispatch } from 'react-redux';
import EncryptedStorage from 'react-native-encrypted-storage';
import { updateProfile } from '../../redux/slices';
import { useSelector } from 'react-redux';

const tasks = [
  {
    time: '6:00 AM',
    title: 'Wake Up',
    description: 'Start your day with Morning Harmony',
    icon: Images.WAKEUP_SUN,
    completed: true,
    color: '#FF8C8C',
  },
  {
    time: '8:00 AM',
    title: 'Medication',
    description: 'Metformin 500mg\nAmlopress AT',
    icon: Images.MEDICATION,
    completed: true,
    color: '#00CC99',
  },
  {
    time: '9:00 AM',
    title: 'Breakfast',
    description: 'Boost your energy',
    icon: Images.BREAKFAST,
    completed: true,
    color: '#FFA500',
  },
  {
    time: '4:30 PM',
    title: 'Refresh & Refuel',
    description: 'Evening snacks',
    icon: Images.YELLOW_CUP,
    completed: false,
    color: '#1E64AC',
  },
];

const routeMap = {
  Breakfast: 'Nutrition',
  'Refresh & Refuel': 'RefrestRefuel',
  'Wake Up': 'CalorieIgnite',
  Medication: 'MidMorningBoost',
};

const Today = ({ navigation }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Feb 26');
  const [checked, setChecked] = useState(false);
  const dispatch = useDispatch();

  const dates = ['Feb 25', 'Feb 26', 'Feb 87'];
  const [cards, setCards] = useState([
    {
      id: 1,
      text: 'Consult doctor for BP',
      bgColor: '#FEE2E2',
      textStyle: '#B91C1C',
      tintColor: undefined,
    },
    {
      id: 2,
      text: 'Reassess to keep your plan aligned',
      bgColor: '#FFE0B3',
      textStyle: '#A16207',
      tintColor: '#EAB308',
    },
    {
      id: 3,
      text: 'Check sugar levels today',
      bgColor: '#FFFFCC',
      textStyle: '#1E64AC',
      tintColor: '#0288D1',
    },
    {
      id: 4,
      text: 'Track water intake',
      bgColor: '#FFF9E6',
      textStyle: '#1E64AC',
      tintColor: '#FB8C00',
    },
  ]);
  const { loading, success, error, profile } = useSelector(
    state => state.profile,
  );

  const removeCard = id => {
    setCards(prev => prev.filter(card => card.id !== id));
  };

  // const updateUserProfile = async () => {
  //   console.log('Updating user profile...');
  //   try {
  //     // 1️⃣ Get userId from storage
  //     const authData = await EncryptedStorage.getItem('auth_tokens');
  //     // assuming authData is { userId: '...', access_token: '...' }
  //     const authUserID = JSON.parse(authData);

  //     // <-- parse the JSON string
  //     const userId = authUserID.userId;
  //     console.log('Retrieved userId:', userId);

  //     if (!userId) {
  //       console.warn('User ID not found in storage');
  //       return;
  //     }

  //     // 2️⃣ Prepare payload
  //     const profileData = {
  //       display_name: 'Final Profile Test',
  //       dob: '1995-10-25',
  //       gender: 'male',
  //       preferred_time_zone: 'Asia/Kolkata',
  //       consent_flags: { tos: true, share_with_doctor: true },
  //       caregiver_mobile: '+919900112233',
  //       doctor_code: 'DR1001',
  //       corporate_code: 'CUORE-CORP',
  //     };

  //     // 3️⃣ Construct endpoint

  //     // 4️⃣ Call API
  //     const response = await dispatch(updateProfile({ userId, profileData }));

  //     if (response?.status === 200) {
  //       console.log('Profile updated successfully:', response.data);
  //     } else {
  //       console.warn('Profile update failed:', response?.data);
  //     }
  //   } catch (error) {
  //     console.error('Error updating profile:', error);
  //   }
  // };

  useEffect(() => {
    const fetchStoredData = async () => {
      try {
        const tokensRaw = await EncryptedStorage.getItem('auth_tokens');
        const userRaw = await EncryptedStorage.getItem('userid');

        const tokens = tokensRaw ? JSON.parse(tokensRaw) : null;
        const userInfo = userRaw ? JSON.parse(userRaw) : null;

        console.log('🔐 Parsed Auth Tokens:', tokens);
        console.log('👤 Parsed User Info:', userInfo);

        // Optional: destructure if needed
        // const { access_token, refresh_token } = tokens || {};
        // const { user_id, request_id } = userInfo || {};
      } catch (error) {
        console.error('❌ Failed to parse encrypted storage:', error);
      }
    };

    fetchStoredData();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.floatingText}>
        {/* <StatusBar hidden={true} /> */}
        {/* <Text style={styles.floatingTextLabel}>Floating Reminder</Text> */}
        <TouchableOpacity onPress={() => setIsVisible(true)}>
          <Image source={Images.PLUS} style={styles.addIcon} />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="#1E64AC" />
      ) : (
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.username}>M. Johnson</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Health')}>
              <Image source={Images.DOCTOR_PROFILE} style={styles.userIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            {dates.map(date => (
              <TouchableOpacity key={date} onPress={() => setActiveTab(date)}>
                <Text
                  style={
                    activeTab === date ? styles.activeTab : styles.inactiveTab
                  }
                >
                  {date}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              backgroundColor: '#FEF2F2',
            }}
          >
            <Image
              style={{
                height: hp(2),
                resizeMode: 'contain',
                tintColor: '#EF4444',
              }}
              source={Images.NOTICE}
            ></Image>
            <Text style={styles.alert}>2 tasks missed</Text>
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <TouchableOpacity
              onPress={() => {
                const STEP = 7;
                navigation.navigate('OnBoarding', { STEP });
              }}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1E64AC',
                paddingVertical: hp(1),
                width: hp(12),
                borderRadius: hp(1),
              }}
            >
              <Text
                style={[
                  styles.progressTitle,
                  { color: '#FFFFFF', fontSize: 12.5 },
                ]}
              >
                Update Biomarkers
              </Text>
            </TouchableOpacity>

            {/* Add progress bar visuals */}
          </View>
          <ProgressBarWithImage navigation={navigation}></ProgressBarWithImage>
          <View style={{ paddingHorizontal: hp(3) }}>
            <Text style={styles.quote}>
              Every choice you make today sets you up for a healthier tomorrow.
            </Text>
          </View>

          <View style={styles.warnings}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {cards.map(item => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: hp(1),
                    padding: hp(2),
                    marginRight: hp(1),
                    backgroundColor: item.bgColor,
                    position: 'relative', // ✅ Needed for absolute child positioning
                  }}
                >
                  <Image
                    style={{
                      resizeMode: 'contain',
                      height: hp(2),
                      width: wp(4),
                      tintColor: item.tintColor,
                      marginRight: hp(0.5),
                    }}
                    source={Images.WARNING}
                  />

                  <Text style={{ color: item.textStyle, marginRight: hp(2) }}>
                    {item.text}
                  </Text>

                  <TouchableOpacity
                    onPress={() => removeCard(item.id)}
                    style={{
                      position: 'absolute',
                      right: hp(1),
                      top: hp(1),
                      // padding: hp(1),
                    }}
                  >
                    <Image
                      style={{
                        backgroundColor: '#F6F0F1',
                        height: hp(1.2),
                        width: hp(2),
                        resizeMode: 'contain',
                        borderRadius: hp(1),
                      }}
                      source={Images.CROSS}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
          <View style={{ backgroundColor: '#F9FAFB' }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Optimize Your Health with Smart Guidance
              </Text>
            </View>

            {tasks.map((task, index) => (
              <View style={styles.taskRow} key={index}>
                <View
                  style={{
                    width: hp(8),
                    borderRightWidth: 1,
                    // backgroundColor: 'red',
                    height: hp(8),
                    marginRight: 2,
                    borderColor: '#E5E7EB',
                  }}
                >
                  <Text style={styles.time}>{task.time}</Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: hp(3.5),
                      marginTop: hp(1),
                      // backgroundColor: 'red',
                    }}
                  >
                    <Image
                      style={{
                        height: hp(2),
                        resizeMode: 'contain',
                        marginLeft: -hp(5),
                      }}
                      source={Images.NOTIFICATION}
                    />

                    {task.title == 'Wake Up' && (
                      <Image
                        style={{
                          height: hp(2),
                          resizeMode: 'contain',
                          marginLeft: -hp(5),
                        }}
                        source={Images.EDIT}
                      />
                    )}
                  </View>
                </View>

                <View
                  style={{
                    marginTop: hp(1),
                    marginHorizontal: hp(1),
                    borderWidth: 0.5,
                    height: hp(2.5),
                    width: hp(2.5),
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: hp(2),
                    borderColor: '#101010',
                  }}
                >
                  <View
                    style={{
                      borderWidth: 1,
                      height: hp(1.5),
                      width: hp(1.5),
                      borderRadius: hp(2),
                      backgroundColor: '#000000',
                    }}
                  ></View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    const routeName = routeMap[task.title];
                    if (routeName) {
                      navigation.navigate(routeName);
                    }
                  }}
                  style={[styles.taskCard, { borderLeftColor: task.color }]}
                >
                  <View style={styles.taskHeader}>
                    <Image source={task.icon} style={styles.taskIcon} />
                    <Text style={styles.taskTitle}>{task.title}</Text>
                  </View>
                  <Text style={styles.taskDescription}>{task.description}</Text>
                  {task.completed && (
                    <Image source={Images.RIGHT} style={styles.checkIcon} />
                  )}
                  {!task.completed && (
                    <Image source={Images.WARNING} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              </View>
            ))}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: hp(2),
              }}
            >
              <TouchableOpacity
                onPress={() => setChecked(!checked)}
                style={{
                  height: hp(3),
                  width: wp(6),
                  borderWidth: 1,
                  borderRadius: hp(0.5),
                  marginRight: hp(1),
                  borderColor: '#9CA3AF',
                  backgroundColor: checked ? '#1E64AC' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {checked && (
                  <Text style={{ color: 'white', fontSize: 12 }}>✔</Text>
                )}
              </TouchableOpacity>

              <Text
                style={{
                  fontFamily: 'Roboto-Regular',
                  color: '#4B5563',
                  fontSize: 15,
                  fontWeight: '400',
                }}
              >
                Check Off All Tasks
              </Text>
            </View>
          </View>

          <View
            style={{
              alignItems: 'center',
              marginVertical: hp(3),
              backgroundColor: 'white',
              paddingVertical: hp(2),
              marginHorizontal: hp(1),
              elevation: 1,
            }}
          >
            <Image source={Images.FIRE} />
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                color: '#1E64AC',
                fontSize: 15,
                fontWeight: '400',
              }}
            >
              14-Day Streak
            </Text>
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                color: '#1E64AC',
                fontSize: 15,
                fontWeight: '400',
              }}
            >
              Maintain your progress,{' '}
            </Text>
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                color: '#1E64AC',
                fontSize: 15,
                fontWeight: '400',
              }}
            >
              log today’s tasks by 12:30 AM
            </Text>
          </View>
          <Reminder
            setIsVisible={setIsVisible}
            isVisible={isVisible}
          ></Reminder>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    marginTop: Platform.OS == 'ios' && hp(5),
    fontFamily: 'Roboto-Regular',
    padding: hp(1.5),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: { fontFamily: 'Roboto-Regular', fontSize: 17, fontWeight: '400' },
  userIcon: { width: hp(3), height: hp(3.5), resizeMode: 'contain' },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  activeTab: { fontWeight: '500', fontSize: 16, color: '#1E64AC' },
  inactiveTab: { fontSize: 16, color: '#9CA3AF' },
  alert: {
    fontFamily: 'Roboto-Regular',
    color: 'red',
    fontWeight: '400',
    marginLeft: -hp(2), // textAlign: 'center',
    marginVertical: 8,
  },
  progressContainer: {
    padding: hp(1),
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: hp(1.3),
  },
  progressTitle: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    color: '#18202B',
    alignSelf: 'center',
    textAlign: 'center',
  },
  quote: {
    // fontStyle: fontFamily: 'Roboto-Regular', 'italic',
    backgroundColor: '#F9ECF7',
    color: '#1E64AC',
    fontSize: 15,
    padding: hp(1.8),
    borderLeftWidth: 3,
    borderRadius: 8,
    marginVertical: hp(1.5),
    borderColor: '#7D767C',
  },
  warnings: {
    marginVertical: 10,
    marginHorizontal: hp(2),
    backgroundColor: '#FFFFFF',
    padding: hp(0.5),
  },
  consult: {
    fontFamily: 'Roboto-Regular',
    marginLeft: -hp(3),
    // backgroundColor: '#FEEAEA',
    padding: 8,
    fontSize: 15,
    // borderRadius: 6,
    color: '#B91C1C',
  },
  reassess: {
    fontFamily: 'Roboto-Regular',
    marginLeft: -hp(3),
    // backgroundColor: '#fff3cd',
    padding: 8,
    // borderRadius: 6,
    fontSize: 15,
    color: '#A16207',
    // marginTop: 6,
  },
  sectionHeader: {
    paddingHorizontal: hp(2),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '450',
    fontSize: 16,
    color: '#1E64AC',
  },
  addIcon: { width: hp(4), height: hp(4), resizeMode: 'contain' },
  taskRow: {
    // backgroundColor: 'red',
    // marginBottom: hp(2),
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: hp(2),
    paddingHorizontal: hp(2),
  },

  time: {
    fontFamily: 'Roboto-Regular',
    width: 60,
    fontWeight: '400',
    color: '#6B7280',
  },
  taskCard: {
    elevation: 1,
    flex: 1,
    borderLeftWidth: 2,
    paddingLeft: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
  },
  taskHeader: { flexDirection: 'row', alignItems: 'center' },
  taskIcon: {
    width: hp(3),
    height: hp(2),
    marginRight: 8,
    resizeMode: 'contain',
  },
  taskTitle: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    fontSize: 15,
    color: '#9CA3AF',
  },
  taskDescription: { marginTop: 4, color: '#9CA3AF', marginLeft: hp(4) },
  checkIcon: {
    resizeMode: 'contain',
    width: hp(2),
    height: hp(3),
    position: 'absolute',
    right: 10,
    bottom: hp(3),
  },
  floatingText: {
    position: 'absolute',
    top: hp(58), // adjust as needed
    left: wp(85),
    right: wp(5),
    zIndex: 999, // ensure it's above everything else
    // backgroundColor: 'red',
    padding: hp(1),
    borderRadius: 8,
    // shadowColor: '#000',
    // shadowOpacity: 0.1,
    // shadowOffset: {width: 0, height: 2},
    // shadowRadius: 4,
    // elevation: 5,
  },
  floatingTextLabel: {
    fontSize: 14,
    color: '#1E64AC',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Today;
