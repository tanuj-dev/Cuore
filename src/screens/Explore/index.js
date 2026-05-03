import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useMemo, useCallback } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import { hp, wp, Images } from '../../utilities';
import { useSelector } from 'react-redux';
import { useCustomAlert } from '../../hooks/useCustomAlert';

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
  'Cuore Insight': 'CuoreKnowledge',
  'Cuore Plate': 'MealBuilder',
  'Cuore Nourish': 'Nutrition',
};

const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Explore = ({ navigation }) => {
  const { colors: c, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(c, isDark), [c, isDark]);

  const { alert, AlertComponent } = useCustomAlert();
  const currentDayKey = useMemo(() => {
    return DAY_KEYS[new Date().getDay()];
  }, []);

  const handleModulePress = useCallback(
    item => {
      const route = ROUTE_MAP[item.title];

      if (!route) {
        alert('Route not found', 'This module is not available yet.');
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
    [navigation, currentDayKey, alert],
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
        <View style={styles.imageWrap}>
          <Image
            source={item.image}
            style={styles.imageInner}
            resizeMode="contain"
          />
          <View style={styles.imageToneOverlay} pointerEvents="none" />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </TouchableOpacity>
    ),
    [handleModulePress, styles],
  );

  const keyExtractor = useCallback(item => item.id.toString(), []);

  // ✅ PROFILE IMAGE FROM REDUX
  const profileImage = useSelector(
    state =>
      state?.profile?.data?.data?.user?.photo_url ||
      state?.profile?.data?.data?.user?.photoUrl,
  );

  const doctorProfile = useSelector(state => state.home.data?.doctor);

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
            <Image
              source={
                doctorProfile?.profileImage || doctorProfile?.photoUrl
                  ? {
                      uri:
                        doctorProfile?.profileImage || doctorProfile?.photoUrl,
                    }
                  : Images.DOCTOR_PROFILE
              }
              style={styles.doctorIcon}
              resizeMode="cover"
            />
            <Text style={styles.heading}>Cuore Health</Text>
          </TouchableOpacity>

          <Text style={styles.subheading}>Your Health Journey</Text>
        </View>
      </View>
    ),
    [handleHealthPress, profileImageSource, styles, doctorProfile],
  );

  return (
    <>
      {AlertComponent}
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList
          data={MODULES}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          ListHeaderComponent={renderListHeader}
          ListHeaderComponentStyle={styles.listHeaderWrap}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      </SafeAreaView>
    </>
  );
};

const createStyles = (c, isDark) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.background,
  },
  list: {
    flex: 1,
    backgroundColor: c.surface,
  },
  /** Android + numColumns: header wrapper can mis-measure width; pin full width for centered chips */
  listHeaderWrap: {
    width: '100%',
    alignSelf: 'center',
  },
  headerContainer: {
    backgroundColor: c.card,
    paddingBottom: hp(2.5),
    marginBottom: hp(2.5),
    marginHorizontal: wp(2),
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
  },
  healthSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
  },
  healthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    flexShrink: 1,
    maxWidth: '100%',
    backgroundColor: c.headerChipRoseBg,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(2.5),
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: c.headerChipRoseBorder,
    gap: wp(1.5),
    ...Platform.select({
      ios: {
        shadowColor: c.danger,
        shadowOpacity: isDark ? 0.08 : 0.15,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
      },
      android: { elevation: 0 },
      default: {},
    }),
  },
  doctorIcon: {
    height: hp(3.5),
    width: hp(3.5),
    borderRadius: hp(1.75),
    overflow: 'hidden',
  },
  heading: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: c.headerChipRoseText,
    letterSpacing: -0.2,
    flexShrink: 1,
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },
  subheading: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: c.subText,
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
    backgroundColor: c.card,
    borderRadius: 16,
    padding: wp(3.5),
    alignItems: 'center',
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.2 : 0.08,
        shadowRadius: 8,
      },
    }),
  },
  imageWrap: {
    width: wp(36),
    height: hp(11),
    marginBottom: hp(1.5),
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: c.mutedSurface,
  },
  imageInner: {
    width: '100%',
    height: '100%',
  },
  imageToneOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    backgroundColor: c.exploreGridImageOverlay,
  },
  title: {
    fontSize: 15.5,
    fontFamily: 'Poppins-Medium',
    color: c.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: c.subText,
    textAlign: 'center',
    marginTop: hp(0.3),
    letterSpacing: 0.1,
    lineHeight: 16,
  },
});

export default Explore;
