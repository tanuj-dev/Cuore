import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import HeroDiscs from '../../components/ui/HeroDiscs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
import React, { useMemo, useCallback, useState } from 'react';
import { hp, wp, Images } from '../../utilities';
import { useSelector } from 'react-redux';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import {
  isMealRoute,
  mealCardsEnabled,
  MEAL_CARDS_OFF_TITLE,
  MEAL_CARDS_OFF_BODY,
} from '../../utilities/mealCards';

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
    title: 'Cuore Habits',
    subtitle: 'Habit free living',
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
  'Cuore Habits': 'Tobacco',
  'Cuore Mind': 'Mind',
  'Cuore Fitness': 'Fitness',
  'Cuore Insight': 'CuoreKnowledge',
  'Cuore Plate': 'MealBuilder',
  'Cuore Nourish': 'Nutrition',
};

const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// CuoreMD hero blue (theme brandDark → brand), as on Today.
const HERO = ['#1E3A8A', '#1E64AC'];

const Explore = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  useLightStatusBar();
  const { alert, AlertComponent } = useCustomAlert();
  const mealsOn = useSelector(state => mealCardsEnabled(state.home?.data));
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

      // Clinic turned meal cards off: the card stays, but does not open the dishes.
      if (isMealRoute(route) && !mealsOn) {
        alert(MEAL_CARDS_OFF_TITLE, MEAL_CARDS_OFF_BODY);
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
    [navigation, currentDayKey, alert, mealsOn],
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
        <View style={styles.cardBody}>
          <View style={styles.cardText}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </View>
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

  const doctorProfile = useSelector(state => state.home.data?.doctor);

  // ✅ SAFE IMAGE SOURCE
  const profileImageSource = useMemo(
    () => (profileImage ? { uri: profileImage } : Images.UNCLE),
    [profileImage],
  );

  const profileUser = useSelector(state => state?.profile?.data?.data?.user);
  // Same sources and checks as the Today header: only an absolute http(s) URL is tried, and a
  // photo that fails to load falls back to the default doctor image instead of a blank circle.
  const doctorPhoto = useMemo(() => {
    const raw =
      profileUser?.doctor?.photoUrl ||
      profileUser?.doctor?.photo_url ||
      profileUser?.doctor_profile?.photoUrl ||
      profileUser?.doctor_profile?.photo_url ||
      doctorProfile?.profileImage ||
      doctorProfile?.photoUrl;
    const url = typeof raw === 'string' ? raw.trim() : '';
    return /^https?:\/\//i.test(url) ? url : null;
  }, [profileUser, doctorProfile]);
  const [doctorPhotoFailed, setDoctorPhotoFailed] = useState(false);

  const renderListHeader = useCallback(
    () => (
      <View style={[styles.hero, { paddingTop: insets.top + hp(2) }]}>
        {/* Absolute-fill gradient behind a padded View: on the New Architecture LinearGradient
            paints only its content box, so padding it directly clips the paint. */}
        <LinearGradient
          colors={HERO}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
          <HeroDiscs />
        <View style={styles.heroTop}>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Explore</Text>
            <Text style={styles.heroSub}>
              Food, fitness and mind programs made for you.
            </Text>
          </View>
          <Image
            source={profileImageSource}
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>

        <TouchableOpacity
          onPress={handleHealthPress}
          style={styles.healthButton}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="My Health"
        >
          <Image
            source={
              doctorPhoto && !doctorPhotoFailed
                ? { uri: doctorPhoto }
                : Images.DOCTOR_PROFILE
            }
            style={styles.doctorIcon}
            resizeMode="cover"
            onError={() => setDoctorPhotoFailed(true)}
          />
          <View style={styles.healthText}>
            <Text style={styles.heading}>My Health</Text>
            <Text style={styles.subheading}>Your health journey</Text>
          </View>
          <ChevronRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    ),
    // The doctor's photo is read here too — without it the header kept a stale/missing photo
    // after the profile loaded.
    [handleHealthPress, profileImageSource, doctorPhoto, doctorPhotoFailed, insets.top],
  );

  return (
    <>
      {AlertComponent}
      <View style={styles.safeArea}>
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
          // The hero paints under the status bar itself.
          contentInsetAdjustmentBehavior="never"
          ListHeaderComponentStyle={styles.headerWrap}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FB' },
  list: { flex: 1, backgroundColor: '#F4F7FB' },
  // The hero spans the full width; the grid's side padding is cancelled for it.
  headerWrap: { marginHorizontal: -wp(4), marginBottom: hp(2.5) },
  hero: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(3),
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  heroText: { flex: 1, minWidth: 0, paddingRight: wp(3) },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  healthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(2.5),
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 16,
    paddingVertical: hp(1.4),
    paddingHorizontal: wp(4),
  },
  doctorIcon: {
    height: 40,
    width: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  healthText: { flex: 1, marginLeft: wp(3) },
  heading: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  subheading: {
    fontSize: 12.5,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  grid: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(4),
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  card: {
    width: wp(44),
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: wp(2.5),
  },
  image: {
    width: '100%',
    height: hp(12),
    borderRadius: 12,
    resizeMode: 'cover',
    backgroundColor: '#F4F7FB',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1.2),
    paddingHorizontal: wp(1),
  },
  cardText: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 14.5,
    fontFamily: 'Poppins-SemiBold',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginTop: 1,
  },
});

export default Explore;
