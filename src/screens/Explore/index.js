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
    subtitle: 'What to Eat, Made Simple',
    image: Images.MEAL1,
  },
  {
    id: '2',
    title: 'Cuore MealBuilder',
    subtitle: 'Customize What Fuels You',
    image: Images.MEAL2,
  },
  {
    id: '3',
    title: 'Cuore Fitness',
    subtitle: 'Workouts Designed for You',
    image: Images.MEAL3,
  },
  {
    id: '4',
    title: 'Cuore Mind',
    subtitle: 'Calm, Clarity & Rest',
    image: Images.MEAL4,
  },
  {
    id: '5',
    title: 'Cuore Tobacco',
    subtitle: 'Reclaim your life',
    image: Images.MEAL5,
  },
  {
    id: '6',
    title: 'Cuore Knowledge',
    subtitle: 'Curated Health Insights',
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

  const keyExtractor = useCallback(
    item => item.id.toString(),
    [],
  );

  // ✅ PROFILE IMAGE FROM REDUX
  const profileImage = useSelector(
    state =>
      state?.profile?.data?.data?.user?.photo_url ||
      state?.profile?.data?.data?.user?.photoUrl
  );

  // ✅ SAFE IMAGE SOURCE
  const profileImageSource = profileImage
    ? { uri: profileImage }
    : Images.UNCLE;

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
            <Image
              source={Images.DOCTOR_PROFILE}
              style={styles.doctorIcon}
            />
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
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: hp(2),
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: hp(1.5),
  },
  logo: {
    width: wp(20),
    height: hp(4),
    resizeMode: 'contain',
  },
  logoRight: {
    width: 40,
    height: 40,
    borderRadius: 20, // 👈 profile look
  },
  healthSection: {
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingBottom: hp(1),
  },
  healthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: hp(1),
    paddingHorizontal: hp(1.5),
    borderRadius: hp(3),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  doctorIcon: {
    height: hp(2.5),
    width: wp(6),
  },
  heading: {
    fontSize: 16,
    color: '#4B5563',
    marginLeft: wp(1),
  },
  subheading: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: hp(1),
    textAlign: 'center',
  },
  grid: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(4),
    paddingTop: hp(1),
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  card: {
    width: wp(42),
    backgroundColor: '#FFFFFF',
    borderRadius: wp(3),
    padding: wp(4),
    alignItems: 'center',
  },
  image: {
    width: wp(38),
    height: hp(12),
    marginBottom: hp(1.2),
  },
  title: {
    fontSize: 15,
    color: '#000000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: hp(0.5),
  },
});

export default Explore;
