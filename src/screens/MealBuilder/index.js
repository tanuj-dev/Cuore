import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  FlatList,
  Animated,
  Easing,
  Platform,
  RefreshControl,
} from 'react-native';
import {
  Coffee,
  UtensilsCrossed,
  Search as SearchIcon,
  ChevronRight,
  ShoppingCart,
} from 'lucide-react-native';
import { hp, wp } from '../../utilities';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
import { useDispatch, useSelector } from 'react-redux';
import { getBuilderItems } from '../../redux/slices';
import ApiErrorFallback from '../../components/ApiError';
import SkeletonBox from '../../components/SkeletonBox';

const GLASS = 'rgba(255,255,255,0.16)';

const MealBuilderSkeleton = ({ onBack }) => (
  <View style={{ flex: 1, backgroundColor: '#F4F7FB' }}>
    <HeroHeader title="Cuore Plate" subtitle="Build a meal that fits your target." onBack={onBack}>
      <View style={{ height: 76, borderRadius: 16, marginTop: 16, backgroundColor: GLASS }} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <View style={{ flex: 1, height: 40, borderRadius: 20, backgroundColor: GLASS }} />
        <View style={{ flex: 1, height: 40, borderRadius: 20, backgroundColor: GLASS }} />
      </View>
    </HeroHeader>
    <ScrollView scrollEnabled={false} contentContainerStyle={{ padding: wp(4), gap: hp(1.5) }}>
      <SkeletonBox width="100%" height={46} borderRadius={12} />
      <SkeletonBox width="100%" height={40} borderRadius={20} />
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={{ backgroundColor: '#FFF', borderWidth: 1, borderRadius: 16, borderColor: '#E2E8F0', padding: hp(2) }}>
          <SkeletonBox width={120} height={16} />
        </View>
      ))}
    </ScrollView>
  </View>
);

const tagColors = {
  Include: '#16A34A',
  Limit: '#D97706',
  Avoid: '#DC2626',
};

const MealBuilder = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('Breakfast');
  const [activeCuisine, setActiveCuisine] = useState('Indian');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const { mealItem = 'Breakfast' } = route?.params;
  useLightStatusBar();
  const dispatch = useDispatch();
  const animationMap = useRef({})?.current;

  useEffect(() => {
    if (mealItem) {
      setActiveTab(mealItem);
    }
  }, [mealItem]);

  // Redux data
  const itemsByCombo = useSelector(state => state.builder.itemsByCombo);

  useEffect(() => {
    const COMBOS = [
      { mealTime: 'Breakfast', cuisine: 'Indian' },
      { mealTime: 'Breakfast', cuisine: 'Global' },
      { mealTime: 'Lunch', cuisine: 'Indian' },
      { mealTime: 'Lunch', cuisine: 'Global' },
    ];
    COMBOS.forEach(combo => {
      const key = `${combo.mealTime}_${combo.cuisine}`;
      if (!itemsByCombo?.[key]) {
        dispatch(getBuilderItems(combo));
      }
    });
  }, [dispatch, itemsByCombo]);

  const {
    BreakfastIndian,
    BreakfastGlobal,
    DinnerIndian,
    DinnerGlobal,
    CaloriesBreakfastIndian,
    CaloriesBreakfastGlobal,
    CaloriesDinnerIndian,
    CaloriesDinnerGlobal,
  } = useSelector(state => {
    const items = state.builder.itemsByCombo || {};
    return {
      BreakfastIndian: items['Breakfast_Indian']?.grouped_items || {},
      CaloriesBreakfastIndian:
        items['Breakfast_Indian']?.recommended_calories || 0,
      BreakfastGlobal: items['Breakfast_Global']?.grouped_items || {},
      CaloriesBreakfastGlobal:
        items['Breakfast_Global']?.recommended_calories || 0,
      DinnerIndian: items['Lunch_Indian']?.grouped_items || {},
      CaloriesDinnerIndian: items['Lunch_Indian']?.recommended_calories || 0,
      DinnerGlobal: items['Lunch_Global']?.grouped_items || {},
      CaloriesDinnerGlobal: items['Lunch_Global']?.recommended_calories || 0,
    };
  });

  const sumofCalories = selectedItems.reduce(
    (sum, item) => sum + item.calories,
    0,
  );

  // Select dataset based on tab + cuisine
  const selectedData = useMemo(() => {
    if (activeTab === 'Breakfast' && activeCuisine === 'Indian') return BreakfastIndian;
    if (activeTab === 'Breakfast' && activeCuisine === 'Global') return BreakfastGlobal;
    if (activeTab === 'LunchDinner' && activeCuisine === 'Indian') return DinnerIndian;
    if (activeTab === 'LunchDinner' && activeCuisine === 'Global') return DinnerGlobal;
    return {};
  }, [activeTab, activeCuisine, BreakfastIndian, BreakfastGlobal, DinnerIndian, DinnerGlobal]);

  // Filter data by search text
  const sectionedData = useMemo(() => {
    const lowerSearch = searchText.toLowerCase().trim();
    return Object.keys(selectedData)
      .map(category => {
        const items = selectedData[category] || [];
        const filteredItems = lowerSearch
          ? items.filter(i => i.name?.toLowerCase().includes(lowerSearch))
          : items;
        return filteredItems.length > 0 ? { category, items: filteredItems } : null;
      })
      .filter(Boolean);
  }, [selectedData, searchText]);

  const toggleExpand = category => {
    const isSame = expandedCategory === category;
    const newCategory = isSame ? null : category;
    setExpandedCategory(newCategory);

    if (!animationMap[category]) {
      animationMap[category] = new Animated.Value(0);
    }

    Animated.timing(animationMap[category], {
      toValue: isSame ? 0 : 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    // Collapse others
    Object.keys(animationMap).forEach(key => {
      if (key !== category) {
        Animated.timing(animationMap[key], {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();
      }
    });
  };

  const renderCard = ({ item }) => {
    const category = item.category;
    const items = item.items || [];

    if (!animationMap[category]) {
      animationMap[category] = new Animated.Value(0);
    }

    const animatedHeight = animationMap[category].interpolate({
      inputRange: [0, 1],
      outputRange: [0, items.length * hp(9)],
    });

    const isActive = expandedCategory === category;

    return (
      <View style={styles.categoryCard}>
        <TouchableOpacity
          onPress={() => toggleExpand(category)}
          style={[
            styles.categoryHeader,
            isActive && styles.categoryHeaderActive,
          ]}
        >
          <Text style={styles.categoryTitle}>
            {category} ({items.length})
          </Text>
          <Animated.View
            style={[
              {
                transform: [
                  {
                    rotate: animationMap[category].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '90deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <ChevronRight size={18} color="#94A3B8" />
          </Animated.View>
        </TouchableOpacity>

        <Animated.View
          style={[styles.expandedWrap, { height: animatedHeight }]}
        >
          {isActive &&
            items.map((subItem, index) => {
              const isAlreadyAdded = selectedItems.some(
                i => i.dishname === subItem?.name,
              );

              return (
                <View key={subItem?._id || index} style={styles.itemRowWrap}>
                  <View style={styles.itemRow}>
                    <View
                      style={[
                        styles.healthDot,
                        {
                          backgroundColor:
                            subItem?.healthColor === 'red'
                              ? tagColors['Avoid']
                              : subItem?.healthColor === 'yellow'
                              ? tagColors['Limit']
                              : subItem?.healthColor === 'green'
                              ? tagColors['Include']
                              : '#94A3B8',
                        },
                      ]}
                    />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{subItem?.name}</Text>
                      <Text style={styles.itemCal}>
                        {subItem?.calories} cal
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.addItemBtn,
                        isAlreadyAdded && styles.addItemBtnAdded,
                      ]}
                      onPress={() => {
                        const newItem = {
                          dishname: subItem?.name,
                          calories: subItem?.calories,
                          id: subItem?.recipeLink?._id,
                          section: category,
                        };
                        if (isAlreadyAdded) {
                          setSelectedItems(prev =>
                            prev.filter(i => i.dishname !== newItem.dishname),
                          );
                        } else {
                          setSelectedItems(prev => [...prev, newItem]);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.addItemBtnText,
                          isAlreadyAdded && styles.addItemBtnTextAdded,
                        ]}
                      >
                        {isAlreadyAdded ? 'Added' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
        </Animated.View>
      </View>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const combos = [
        { mealTime: 'Breakfast', cuisine: 'Indian' },
        { mealTime: 'Breakfast', cuisine: 'Global' },
        { mealTime: 'Lunch', cuisine: 'Indian' },
        { mealTime: 'Lunch', cuisine: 'Global' },
      ];
      await Promise.all(combos.map(combo => dispatch(getBuilderItems(combo))));
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (!itemsByCombo || Object.keys(itemsByCombo).length === 0) {
    return <MealBuilderSkeleton onBack={() => navigation.goBack()} />;
  }

  const targetCalories =
    activeTab === 'Breakfast' && CaloriesBreakfastIndian
      ? CaloriesBreakfastIndian
      : CaloriesDinnerGlobal;
  const remaining = targetCalories - sumofCalories;
  const fill = targetCalories
    ? Math.max(0, Math.min(1, sumofCalories / targetCalories))
    : 0;

  return (
    <View style={styles.screen}>
      {/* Floating Cart */}
      {selectedItems.length > 0 && (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('MealBuilder1', {
              dishes: selectedItems,
              activeTab,
              targetCalories,
              activeCuisine,
              sumofCalories,
            })
          }
          style={styles.floatingCart}
          activeOpacity={0.85}
        >
          <ShoppingCart size={18} color="#FFFFFF" />
          <Text style={styles.floatingCartText}>
            View Cart ({selectedItems.length})
          </Text>
        </TouchableOpacity>
      )}

      <HeroHeader
        title="Cuore Plate"
        subtitle="Build a meal that fits your target."
        onBack={() => navigation.goBack()}
      >
        <View style={styles.calCard}>
          <View style={styles.calRow}>
            <View>
              <Text style={styles.calLabel}>Target</Text>
              <Text style={styles.calValue}>{targetCalories} kcal</Text>
            </View>
            <View style={styles.calRight}>
              <Text style={styles.calLabel}>Remaining</Text>
              <Text
                style={[styles.calValue, remaining < 0 && styles.remainingOver]}
              >
                {remaining} kcal
              </Text>
            </View>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.trackFill,
                { width: `${fill * 100}%` },
                remaining < 0 && styles.trackFillOver,
              ]}
            />
          </View>
        </View>

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
                numberOfLines={1}
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
                numberOfLines={1}
              >
                Lunch/Dinner
              </Text>
            </TouchableOpacity>
        </View>
      </HeroHeader>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1E64AC"
          />
        }
        nestedScrollEnabled={true}
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
      >
        <View style={styles.searchBox}>
          <SearchIcon size={18} color="#94A3B8" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#94A3B8"
            placeholder="Search meals..."
            style={styles.searchInput}
          />
        </View>

        <View style={styles.cuisineRow}>
            <TouchableOpacity
              onPress={() => setActiveCuisine('Indian')}
              style={[styles.cuisineBox, activeCuisine === 'Indian' && styles.cuisineSelected]}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.cuisineText, activeCuisine === 'Indian' && styles.cuisineSelectedText]}
              >
                Indian
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveCuisine('Global')}
              style={[styles.cuisineBox, activeCuisine === 'Global' && styles.cuisineSelected]}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.cuisineText, activeCuisine === 'Global' && styles.cuisineSelectedText]}
              >
                Global
              </Text>
            </TouchableOpacity>
        </View>

        <View style={styles.tagRow}>
          {['Include', 'Limit', 'Avoid'].map(tag => (
            <View key={tag} style={styles.tagItem}>
              <View
                style={[styles.tagDot, { backgroundColor: tagColors[tag] }]}
              />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <FlatList
          data={sectionedData}
          keyExtractor={(item, index) => item.category + index}
          renderItem={renderCard}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>No items found</Text>
          }
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  scrollView: { flex: 1, backgroundColor: '#F4F7FB' },
  calCard: {
    marginTop: 16,
    backgroundColor: GLASS,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 16,
    padding: 14,
  },
  calRow: { flexDirection: 'row', justifyContent: 'space-between' },
  calRight: { alignItems: 'flex-end' },
  calLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  calValue: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: '#FFFFFF' },
  remainingOver: { color: '#FECACA' },
  track: {
    height: 8,
    borderRadius: 4,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  trackFill: { height: '100%', borderRadius: 4, backgroundColor: '#FFFFFF' },
  trackFillOver: { backgroundColor: '#FCA5A5' },
  tabRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 20,
    backgroundColor: GLASS,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  tabButtonActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  tabText: { fontFamily: 'Poppins-Medium', fontSize: 14, color: '#FFFFFF' },
  tabTextActive: { color: '#1E64AC', fontFamily: 'Poppins-SemiBold' },
  searchBox: {
    marginHorizontal: wp(4),
    marginTop: hp(2),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    fontFamily: 'Poppins-Regular',
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  cuisineRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: wp(4),
    marginTop: hp(1.5),
  },
  cuisineBox: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cuisineSelected: { backgroundColor: '#1E64AC', borderColor: '#1E64AC' },
  cuisineText: { fontFamily: 'Poppins-Medium', fontSize: 14, color: '#475569' },
  cuisineSelectedText: { color: '#FFFFFF', fontFamily: 'Poppins-SemiBold' },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginVertical: hp(2),
  },
  tagItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagDot: { height: 10, width: 10, borderRadius: 5 },
  tagText: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#475569' },
  floatingCart: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: hp(3),
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E64AC',
    borderRadius: 999,
    paddingHorizontal: 22,
    height: 48,
    shadowColor: '#1E64AC',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  floatingCartText: {
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    fontSize: 14,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 16,
    borderColor: '#E2E8F0',
    marginHorizontal: wp(4),
    marginBottom: hp(1.5),
    padding: hp(2),
    ...(Platform.OS === 'android' && { elevation: 0.5 }),
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryHeaderActive: { marginBottom: hp(1.5) },
  categoryTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14.5,
    color: '#0F172A',
  },
  expandedWrap: { overflow: 'hidden' },
  itemRowWrap: { marginTop: hp(0.5) },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    minHeight: hp(8),
    marginVertical: hp(0.2),
    borderRadius: 12,
    paddingHorizontal: hp(1.5),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  healthDot: { height: 10, width: 10, borderRadius: 5 },
  itemInfo: { flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8 },
  itemName: { fontFamily: 'Poppins-Medium', fontSize: 14, color: '#0F172A' },
  itemCal: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  addItemBtn: {
    minWidth: wp(18),
    height: 32,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderColor: '#1E64AC',
  },
  addItemBtnAdded: { backgroundColor: '#DCFCE7', borderColor: '#16A34A' },
  addItemBtnText: { fontFamily: 'Poppins-Medium', fontSize: 13, color: '#1E64AC' },
  addItemBtnTextAdded: { color: '#15803D' },
  emptyListText: {
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginTop: 24,
    color: '#64748B',
    fontSize: 14,
  },
  listContent: { paddingBottom: 100 },
});

export default MealBuilder;
