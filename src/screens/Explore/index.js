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
  // Memoize current day key
  const currentDayKey = useMemo(() => {
    return DAY_KEYS[new Date().getDay()];
  }, []);

  // Handle module press with useCallback for performance
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

  // Handle health button press
  const handleHealthPress = useCallback(() => {
    navigation.navigate('Health');
  }, [navigation]);

  // Render module item
  const renderItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        onPress={() => handleModulePress(item)}
        style={styles.card}
        activeOpacity={0.7}
      >
        <Image source={item.image} style={styles.image} resizeMode="contain" />
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </TouchableOpacity>
    ),
    [handleModulePress],
  );

  // Key extractor
  const keyExtractor = useCallback(
    (item, index) => item.id?.toString() ?? index.toString(),
    [],
  );

  // Render list header
  const renderListHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          <Image source={Images.APP_LOGO} style={styles.logo} />
          <Image source={Images.UNCLE} style={styles.logoRight} />
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
              resizeMode="contain"
            />
            <Text style={styles.heading}>Cuore Health</Text>
          </TouchableOpacity>

          <Text style={styles.subheading}>Your Health Journey</Text>
        </View>
      </View>
    ),
    [handleHealthPress],
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
    width: wp(20),
    height: hp(4),
    resizeMode: 'contain',
    marginLeft: hp(25),
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
      android: {
        elevation: 4,
      },
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
    resizeMode: 'contain',
  },
  heading: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    fontWeight: '400',
    color: '#4B5563',
    marginLeft: wp(1),
  },
  subheading: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '400',
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
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
    }),
  },
  image: {
    width: wp(38),
    height: hp(12),
    resizeMode: 'contain',
    marginBottom: hp(1.2),
  },
  title: {
    fontFamily: 'Roboto-Regular',
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 11,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: hp(0.5),
  },
});

export default Explore;
