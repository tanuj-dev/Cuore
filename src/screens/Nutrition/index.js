import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Share2,
  Coffee,
  UtensilsCrossed,
  Search as SearchIcon,
  ChevronRight,
  Leaf,
  Drumstick,
  Egg,
  TriangleAlert,
} from 'lucide-react-native';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import { hp, wp } from '../../utilities';
import { useDispatch, useSelector } from 'react-redux';
import { getNourish, getRecipe } from '../../redux/slices';
import ApiErrorFallback from '../../components/ApiError';
import Toast from '../../components/Toast';
import SkeletonBox from '../../components/SkeletonBox';

// Diet tag → lucide pill. 'C' (caution) has no label in the old artwork, so it stays icon-only.
const DIET_TAGS = {
  V: { label: 'Veg', Icon: Leaf, fg: '#15803D', bg: '#DCFCE7' },
  N: { label: 'Non-veg', Icon: Drumstick, fg: '#B91C1C', bg: '#FEE2E2' },
  E: { label: 'Egg', Icon: Egg, fg: '#B45309', bg: '#FEF3C7' },
  C: { label: null, Icon: TriangleAlert, fg: '#B91C1C', bg: '#FEE2E2' },
};

const NutritionSkeleton = ({ onBack }) => (
  <View style={{ flex: 1, backgroundColor: '#F4F7FB' }}>
    <HeroHeader title="Cuore Nourish" subtitle="Simple, everyday meals for your plan." onBack={onBack}>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <View style={{ flex: 1, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)' }} />
        <View style={{ flex: 1, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)' }} />
      </View>
      <View style={{ height: 46, borderRadius: 12, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.16)' }} />
    </HeroHeader>
    {/* Meal cards */}
    <ScrollView scrollEnabled={false} contentContainerStyle={{ padding: wp(5), gap: hp(2) }}>
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={{ backgroundColor: '#FFF', borderRadius: 16, padding: wp(4), borderWidth: 1, borderColor: '#E2E8F0' }}>
          <SkeletonBox width="65%" height={16} style={{ marginBottom: hp(1) }} />
          <SkeletonBox width="90%" height={12} borderRadius={4} style={{ marginBottom: hp(0.6) }} />
          <SkeletonBox width="75%" height={12} borderRadius={4} style={{ marginBottom: hp(0.6) }} />
          <SkeletonBox width="55%" height={12} borderRadius={4} style={{ marginBottom: hp(1.5) }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: hp(1) }}>
            <SkeletonBox width={wp(13)} height={hp(2.5)} borderRadius={4} />
            <SkeletonBox width={60} height={14} borderRadius={4} />
          </View>
        </View>
      ))}
    </ScrollView>
  </View>
);

const Nutrition = ({ navigation, route }) => {
  const mealTime = route?.params?.mealTime || 'Breakfast';
  const [activeTab, setActiveTab] = useState(mealTime);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState('success');

  const [searchText, setSearchText] = useState('');
  const [filteredMeals, setFilteredMeals] = useState([]);

  const dispatch = useDispatch();
  const nourishData = useSelector(state => state.nourish.data);
  const nourishLoading = useSelector(state => state.nourish.loading);
  const [receipeData, setRecipeData] = useState(null);
  useLightStatusBar();

  useEffect(() => {
    if (activeTab === 'Breakfast') {
      dispatch(getNourish('Breakfast'));
    } else if (activeTab === 'LunchDinner') {
      dispatch(getNourish('Lunch/Dinner'));
    }
  }, [activeTab]);

  useEffect(() => {
    if (nourishData?.meal_plan) {
      setFilteredMeals(nourishData.meal_plan);
    }
  }, [nourishData]);

  // 🧠 Search logic
  const handleSearch = text => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredMeals(nourishData?.meal_plan || []);
    } else {
      const filtered = nourishData?.meal_plan?.filter(
        item =>
          item?.name?.toLowerCase().includes(text.toLowerCase()) ||
          item?.title?.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredMeals(filtered);
    }
  };

  const viewShotRef = useRef(null);

  const handleShareScreenshot = async () => {
    try {
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();

        const shareOptions = {
          title: 'Nutrition Plan',
          message: 'Check out my nutrition plan!',
          url: uri,
          type: 'image/jpeg',
        };

        await Share.open(shareOptions);
        setToast('Screenshot shared successfully!');
        setToastType('success');
      }
    } catch (error) {
      console.error('Error sharing screenshot:', error);
      // User cancelled sharing - don't show error
      if (error.message !== 'User did not share') {
        setToast('Failed to share screenshot');
        setToastType('error');
      }
    }
  };

  const handlePress = async (item, navigation) => {
    try {
      if (item.type === 'custom_plate') {
        navigation.navigate('MealBuilder', {
          mealItem: activeTab == 'Breakfast' ? 'Breakfast' : 'LunchDinner',
        });
      } else {
        setLoading(true);
        const response = await dispatch(
          getRecipe(item?.recipeLink?._id),
        ).unwrap();
        if (response.ingredients?.length > 0) {
          setToast('Recipe fetched successfully!');
          setToastType('success');
          setLoading(false);
          setRecipeData(response);
          navigation.navigate('Recipe', { recipeData: response });
        } else {
          setLoading(false);
          setToastType('error');
          setToast('Try searching using the recipe search bar');
        }
      }
    } catch (error) {
      console.error('Failed to fetch recipe:', error);
      setLoading(false);
    }
  };

  const renderMealCard = (item, index) => {
    const dietTag = (item?.dietTag || item?.type || '').toUpperCase();
    const tag = DIET_TAGS[dietTag.charAt(0)] || DIET_TAGS.C;
    const TagIcon = tag.Icon;

    return (
      <TouchableOpacity
        onPress={() => handlePress(item, navigation)}
        key={index}
        style={styles.card}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardText}>
            <Text style={styles.mealTitle}>{item?.name || item?.title}</Text>
            {item?.components?.map((line, idx) => (
              <Text key={idx} style={styles.detail}>
                {'\u2022'} {line}
              </Text>
            ))}
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </View>
        <View style={styles.cardFooter}>
          <View style={[styles.tagPill, { backgroundColor: tag.bg }]}>
            <TagIcon size={13} color={tag.fg} />
            {tag.label ? (
              <Text style={[styles.tagText, { color: tag.fg }]}>{tag.label}</Text>
            ) : null}
          </View>
          <Text style={styles.kcal}>
            {item?.calories || item?.custom_plate} kcal
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (nourishLoading && !nourishData) {
    return <NutritionSkeleton onBack={() => navigation.goBack()} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F7FB' }}>
      {toast && (
        <View style={styles.toastContainer}>
          <Toast
            message={toast}
            type={toastType}
            onHide={() => setToast(null)}
            top={hp(4)}
          />
        </View>
      )}
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'jpg', quality: 0.9 }}
        style={{ flex: 1, backgroundColor: '#F4F7FB' }}
      >
        <HeroHeader
          title="Cuore Nourish"
          subtitle="Simple, everyday meals for your plan."
          onBack={() => navigation.goBack()}
          right={
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={handleShareScreenshot}
              style={styles.shareButton}
              accessibilityRole="button"
              accessibilityLabel="Share"
            >
              <Share2 size={18} color="#FFFFFF" />
            </TouchableOpacity>
          }
        >
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => setActiveTab('Breakfast')}
              style={[styles.tabButton, activeTab === 'Breakfast' && styles.tabButtonActive]}
              activeOpacity={0.8}
            >
              <Coffee
                size={16}
                color={activeTab === 'Breakfast' ? '#1E64AC' : '#FFFFFF'}
              />
              <Text
                style={[styles.tabText, activeTab === 'Breakfast' && styles.tabTextActive]}
              >
                Breakfast
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('LunchDinner')}
              style={[styles.tabButton, activeTab === 'LunchDinner' && styles.tabButtonActive]}
              activeOpacity={0.8}
            >
              <UtensilsCrossed
                size={16}
                color={activeTab === 'LunchDinner' ? '#1E64AC' : '#FFFFFF'}
              />
              <Text
                style={[styles.tabText, activeTab === 'LunchDinner' && styles.tabTextActive]}
              >
                Lunch/Dinner
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Search')}
            style={styles.searchContainer}
            activeOpacity={0.8}
          >
            <SearchIcon size={18} color="#94A3B8" />
            <Text style={styles.searchPlaceholder}>Search recipe...</Text>
          </TouchableOpacity>
        </HeroHeader>

        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="never"
        >
          {loading ? (
            <ActivityIndicator
              style={{ marginTop: hp(2) }}
              size="small"
              color="#1E64AC"
            />
          ) : (
            <Text style={styles.headerTitle}>
              Daily variety leads to better results. Try a new option each
              day.
            </Text>
          )}

          <View style={styles.cardList}>
            {filteredMeals?.length > 0 ? (
              filteredMeals.map((item, index) => renderMealCard(item, index))
            ) : (
              <Text style={styles.noResultText}>No meals found.</Text>
            )}
          </View>
        </ScrollView>
      </ViewShot>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  tabButtonActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  tabText: { fontFamily: 'Poppins-Medium', fontSize: 14, color: '#FFFFFF' },
  tabTextActive: { color: '#1E64AC', fontFamily: 'Poppins-SemiBold' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  searchPlaceholder: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#94A3B8',
  },
  headerTitle: {
    fontFamily: 'Poppins-Regular',
    paddingHorizontal: wp(8),
    fontSize: 13.5,
    color: '#475569',
    textAlign: 'center',
    marginTop: hp(2),
    lineHeight: 20,
  },
  cardList: { padding: wp(4), paddingBottom: hp(4) },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: wp(4),
    marginBottom: hp(1.5),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardText: { flex: 1, minWidth: 0, paddingRight: 10 },
  mealTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#0F172A',
    marginBottom: hp(0.5),
  },
  detail: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: hp(1.5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: { fontFamily: 'Poppins-Medium', fontSize: 12 },
  kcal: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#334155',
  },
  toastContainer: {
    position: 'absolute',
    top: hp(10),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  noResultText: {
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
    marginTop: hp(2),
  },
});

export default Nutrition;
