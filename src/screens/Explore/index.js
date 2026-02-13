import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useMemo, useCallback } from 'react';
import { hp, wp, Images } from '../../utilities';
import { useSelector } from 'react-redux';

// Constants
const MODULES = [
  {
    id: '1',
    title: 'Cuore Nourish',
    subtitle: 'Simple Eating',
    image: Images.MEAL1,
  },
  {
    id: '2',
    title: 'Cuore Plate',
    subtitle: 'Custom meal plans',
    image: Images.MEAL2,
  },
  {
    id: '3',
    title: 'Cuore Fitness',
    subtitle: 'Personal Workouts',
    image: Images.MEAL3,
  },
  {
    id: '4',
    title: 'Cuore Mind',
    subtitle: 'Calm & clear mind',
    image: Images.MEAL4,
  },
  {
    id: '5',
    title: 'Cuore Tobacco',
    subtitle: 'Smoke free living',
    image: Images.MEAL5,
  },
  {
    id: '6',
    title: 'Cuore Insight',
    subtitle: 'Simplified Knowledge',
    image: Images.MEAL6,
  },
];

const ROUTE_MAP = {
  'Cuore Tobacco': 'Tobacco',
  'Cuore Mind': 'Mind',
  'Cuore Fitness': 'Fitness',
  'Cuore Knowledge': 'CuoreKnowledge',
  'Cuore MealBuilder': 'MealBuilder',
  'Cuore Nourish': 'Nutrition',
};

const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Explore = ({ navigation }) => {
  const currentDayKey = useMemo(() => {
    return DAY_KEYS[new Date().getDay()];
  }, []);

  const handleModulePress = useCallback(
    item => {
      const route = ROUTE_MAP[item.title];

      if (!route) {
        Alert.alert('Route not found');
        return;
      }

      if (route.toLowerCase() === 'fitness') {
        navigation.navigate(route, { initialTab: currentDayKey });
        return;
      }

      if (route === 'MealBuilder') {
        navigation.navigate(route, { mealItem: 'Breakfast' });
        return;
      }

      navigation.navigate(route);
    },
    [navigation, currentDayKey],
  );

  const handleHealthPress = useCallback(() => {
    navigation.navigate('Health');
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        onPress={() => handleModulePress(item)}
        style={styles.card}
        activeOpacity={0.7}
      >
        <Image source={item.image} style={styles.image} />
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </TouchableOpacity>
    ),
    [handleModulePress],
  );

  const keyExtractor = useCallback(item => item.id.toString(), []);

  // ✅ PROFILE IMAGE FROM REDUX
  const profileImage = useSelector(
    state =>
      state?.profile?.data?.data?.user?.photo_url ||
      state?.profile?.data?.data?.user?.photoUrl,
  );

  // ✅ SAFE IMAGE SOURCE
  const profileImageSource = useMemo(
    () => (profileImage ? { uri: profileImage } : Images.UNCLE),
    [profileImage],
  );

  const renderListHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          <Image source={Images.APP_LOGO} style={styles.logo} />

          {/* ✅ FIXED PROFILE IMAGE */}
          <Image
            source={profileImageSource}
            style={styles.logoRight}
            resizeMode="cover"
          />
        </View>

        <View style={styles.healthSection}>
          <TouchableOpacity
            onPress={handleHealthPress}
            style={styles.healthButton}
            activeOpacity={0.7}
          >
            <Image source={Images.DOCTOR_PROFILE} style={styles.doctorIcon} />
            <Text style={styles.heading}>Cuore Health</Text>
          </TouchableOpacity>

          <Text style={styles.subheading}>Your Health Journey</Text>
        </View>
      </View>
    ),
    [handleHealthPress, profileImageSource],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        data={MODULES}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        ListHeaderComponent={renderListHeader}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  list: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: hp(2.5),
    // borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: hp(2.5),
    borderRadius: hp(2),
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: hp(2),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
  },
  logo: {
    width: wp(20),
    height: hp(4),
    resizeMode: 'contain',
  },
  logoRight: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#11418A',
  },
  healthSection: {
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
  },
  healthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#11418A',
    paddingVertical: hp(1.5),
    paddingHorizontal: hp(3),
    borderRadius: 16,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: {
        shadowColor: '#11418A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  doctorIcon: {
    height: hp(2.5),
    width: wp(6),
    tintColor: '#FFFFFF',
  },
  heading: {
    fontSize: 17,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    marginLeft: wp(2),
    letterSpacing: -0.2,
  },
  subheading: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#64748B',
    marginTop: hp(1.2),
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  grid: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(4),
    paddingTop: hp(2.5),
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: hp(2.5),
  },
  card: {
    width: wp(42),
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: wp(3.5),
    alignItems: 'center',
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
    }),
  },
  image: {
    width: wp(36),
    height: hp(11),
    marginBottom: hp(1.5),
    borderRadius: 12,
  },
  title: {
    fontSize: 15.5,
    fontFamily: 'Poppins-Medium',
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
    marginTop: hp(0.3),
    letterSpacing: 0.1,
    lineHeight: 16,
  },
});

export default Explore;
