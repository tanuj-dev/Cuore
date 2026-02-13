import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ImageBackground,
  Image,
  FlatList,
  Animated,
  Easing,
  Platform,
  RefreshControl,
} from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { hp, wp, Images } from '../../utilities';
import images from '../../utilities/Images';
import { useDispatch, useSelector } from 'react-redux';
import { getBuilderItems } from '../../redux/slices';
import ApiErrorFallback from '../../components/ApiError';

const tagColors = {
  Include: '#22C55E',
  Limit: '#EAB308',
  Avoid: '#EF4444',
};

const MealBuilder = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('Breakfast');
  const [activeCuisine, setActiveCuisine] = useState('Indian');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const { mealItem = 'Breakfast' } = route?.params;
  const dispatch = useDispatch();
  const animationMap = useRef({})?.current;

  useEffect(() => {
    if (mealItem) {
      setActiveTab(mealItem);
    }
  }, [mealItem]);

  // Redux data
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
  let selectedData = {};
  if (activeTab === 'Breakfast' && activeCuisine === 'Indian') {
    selectedData = BreakfastIndian;
  } else if (activeTab === 'Breakfast' && activeCuisine === 'Global') {
    selectedData = BreakfastGlobal;
  } else if (activeTab === 'LunchDinner' && activeCuisine === 'Indian') {
    selectedData = DinnerIndian;
  } else if (activeTab === 'LunchDinner' && activeCuisine === 'Global') {
    selectedData = DinnerGlobal;
  }

  // ✅ Filter data by search text
  const sectionedData = useMemo(() => {
    const lowerSearch = searchText.toLowerCase().trim();
    const categoryNames = Object.keys(selectedData);
    return categoryNames
      .map(category => {
        const items = selectedData[category] || [];
        const filteredItems = lowerSearch
          ? items.filter(i => i.name?.toLowerCase().includes(lowerSearch))
          : items;
        return filteredItems.length > 0
          ? { category, items: filteredItems }
          : null;
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
          <Animated.Image
            style={[
              styles.categoryChevron,
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
            source={images.RIGHT_ARROW}
          />
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
                          id: subItem?._id,
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

  // if (!sectionedData || sectionedData.length === 0) {
  //   return <ApiErrorFallback message="No meals found" onRetry={onRefresh} />;
  // }

  return (
    <View style={{ flex: 1 }}>
      {/* Floating Cart */}
      {selectedItems.length > 0 && (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('MealBuilder1', {
              dishes: selectedItems,
              activeTab,
              targetCalories:
                activeTab === 'Breakfast' && CaloriesBreakfastIndian
                  ? CaloriesBreakfastIndian
                  : CaloriesDinnerGlobal,
              activeCuisine,
              sumofCalories,
            })
          }
          style={styles.floatingText}
        >
          <Image source={Images.CART} style={styles.cartImage} />
          <Text style={styles.floatingCartText}>
            View Cart ({selectedItems.length})
          </Text>
        </TouchableOpacity>
      )}

      <ImageBackground
        style={styles.backgroundImage}
        source={Images.BACKGROUND_IMAGE_NUTRITION}
      >
        <TouchableOpacity
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          onPress={() => navigation.goBack()}
          style={styles.headerContainer}
        >
          <Image style={styles.backButton} source={Images.BACK_BUTTON} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Cuore MealBuilder</Text>
        </View>

        <View style={styles.progressRow}>
          <View>
            <Text style={styles.target}>Target</Text>
            <Text style={styles.kcal}>
              {activeTab === 'Breakfast' && CaloriesBreakfastIndian
                ? CaloriesBreakfastIndian
                : CaloriesDinnerGlobal}
              {' kcal'}
            </Text>
          </View>

          <ProgressBar
            progress={
              sumofCalories /
              (activeTab === 'Breakfast' && CaloriesBreakfastIndian
                ? CaloriesBreakfastIndian
                : CaloriesDinnerGlobal)
            }
            color="#11418A"
            style={styles.progress}
          />

          <View>
            <Text
              style={[
                styles.target,
                (activeTab === 'Breakfast' && CaloriesBreakfastIndian
                  ? CaloriesBreakfastIndian
                  : CaloriesDinnerGlobal) -
                  sumofCalories <
                  0 && styles.remainingOver,
              ]}
            >
              Remaining
            </Text>
            <Text
              style={[
                styles.kcal,
                styles.remainingKcal,
                (activeTab === 'Breakfast' && CaloriesBreakfastIndian
                  ? CaloriesBreakfastIndian
                  : CaloriesDinnerGlobal) -
                  sumofCalories <
                  0 && styles.remainingOver,
              ]}
            >
              {(activeTab === 'Breakfast' && CaloriesBreakfastIndian
                ? CaloriesBreakfastIndian
                : CaloriesDinnerGlobal) - sumofCalories}{' '}
              kcal
            </Text>
          </View>
        </View>
      </ImageBackground>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#11418A"
          />
        }
        nestedScrollEnabled={true}
        style={styles.scrollView}
      >
        <View style={styles.body}>
          <View style={styles.mealTypeRow}>
            <TouchableOpacity
              onPress={() => setActiveTab('Breakfast')}
              style={[
                styles.breakfastBox,
                activeTab === 'Breakfast'
                  ? styles.mealTabActive
                  : styles.mealTabInactive,
              ]}
            >
              <Image
                style={styles.breakfastIcon}
                source={Images.BREAKFAST}
                // tintColor="#FFFFFF"
              />
              <Text
                style={styles.breakfastText}
                numberOfLines={1}
                adjustsFontSizeToFit
                allowFontScaling={false}
              >
                Breakfast
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('LunchDinner')}
              style={[
                styles.lunchDinnerBox,
                activeTab === 'LunchDinner'
                  ? styles.mealTabActive
                  : styles.mealTabInactive,
              ]}
            >
              <Image
                style={styles.lunchDinnerIcon}
                source={Images.KNIFE}
                // tintColor="#FFFFFF"
              />
              <Text
                style={styles.lunchDinnerText}
                numberOfLines={1}
                adjustsFontSizeToFit
                allowFontScaling={false}
              >
                Lunch Dinner
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <>
          {/* Search */}
          <View style={styles.searchBox}>
            <Image style={styles.searchIcon} source={Images.SEARCH} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={'#6B7280'}
              placeholder="Search meals..."
              style={styles.searchInput}
            />
          </View>

          <View style={styles.cuisineRow}>
            {/* Indian Tab */}
            <TouchableOpacity
              onPress={() => setActiveCuisine('Indian')}
              style={[
                styles.cuisineBox,
                activeCuisine === 'Indian'
                  ? styles.cuisineSelected
                  : styles.cuisineUnselected,
              ]}
            >
              <Text
                style={
                  activeCuisine === 'Indian'
                    ? styles.cuisineSelectedText
                    : styles.cuisineUnselectedText
                }
              >
                Indian
              </Text>
            </TouchableOpacity>

            {/* Global Tab */}
            <TouchableOpacity
              onPress={() => setActiveCuisine('Global')}
              style={[
                styles.cuisineBox,
                activeCuisine === 'Global'
                  ? styles.cuisineSelected
                  : styles.cuisineUnselected,
              ]}
            >
              <Text
                style={
                  activeCuisine === 'Global'
                    ? styles.cuisineSelectedText
                    : styles.cuisineUnselectedText
                }
              >
                Global
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagRow}>
            {['Include', 'Limit', 'Avoid'].map(tag => (
              <View key={tag} style={styles.tagItem}>
                <View
                  style={{
                    height: hp(2),
                    width: wp(4),
                    borderRadius: hp(2),
                    backgroundColor: tagColors[tag],
                  }}
                />
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <FlatList
            data={sectionedData}
            keyExtractor={(item, index) => item.category + index}
            renderItem={renderCard}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>No items found</Text>
            }
          />
        </>
      </ScrollView>
    </View>
  );
};

// --- styles unchanged ---

const styles = StyleSheet.create({
  backgroundImage: {
    height: hp(20),
    padding: hp(2),
    // flex: 1,
    // marginBottom: hp(1),
  },
  headerContainer: {
    // marginTop: Platform.OS == 'ios' && hp(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    marginTop: Platform.OS == 'ios' ? hp(0) : hp(1),
    resizeMode: 'contain',
    height: hp(3.5),
    width: wp(4),
  },
  titleContainer: {
    alignItems: 'center',
    // marginTop: hp(1),
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  progressRow: {
    marginTop: hp(2.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  progress: {
    height: hp(1),
    width: hp(20),
    borderRadius: wp(2),
    marginVertical: hp(1),
  },
  target: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  kcal: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  remainingKcal: {
    fontFamily: 'Poppins-Medium',
    color: '#0D9488',
    letterSpacing: 0.2,
  },
  remainingOver: { color: '#DC2626' },
  body: {
    padding: hp(2),
    // marginTop: hp(1),
  },
  mealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakfastBox: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    padding: hp(1),
    paddingHorizontal: wp(2.5),
    borderRadius: 10,
    width: wp(42),
  },
  breakfastIcon: {
    height: hp(3),
    width: wp(5),
    marginRight: wp(1.5),
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  breakfastText: {
    fontFamily: 'Poppins-Regular',
    fontSize: hp(1.6),
    color: '#FFFFFF',
    flexShrink: 1,
    letterSpacing: 0.2,
  },
  lunchDinnerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: wp(42),
    flexDirection: 'row',
    padding: hp(1.4),
    paddingHorizontal: wp(1.5),
    borderRadius: 10,
  },
  lunchDinnerIcon: {
    height: hp(2),
    width: wp(5),
    marginRight: wp(1.5),
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  lunchDinnerText: {
    fontFamily: 'Poppins-Regular',
    fontSize: hp(1.6),
    color: '#FFFFFF',
    flexShrink: 1,
    letterSpacing: 0.2,
  },
  searchBox: {
    marginHorizontal: hp(2),
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: hp(1),
    paddingHorizontal: hp(2),
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: hp(2),
  },
  searchIcon: {
    height: hp(2),
    width: wp(4),
    marginRight: hp(1),
    resizeMode: 'contain',
  },
  searchInput: {
    fontFamily: 'Poppins-Regular',
    flex: 1,
    paddingVertical: hp(1),
    fontSize: 14,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  cuisineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2),
    // backgroundColor: 'red',
    // width: wp(90),
    // backgroundColor: 'red',
  },
  cuisineSelected: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#11418A',
    width: hp(18),
    paddingVertical: hp(1.3),
    borderRadius: hp(0.6),
  },
  cuisineBox: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,

    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  cuisineSelectedText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cuisineUnselected: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
    width: hp(18),
    paddingVertical: hp(1.3),
    borderRadius: hp(0.6),
  },
  cuisineUnselectedText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#475569',
    letterSpacing: 0.2,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp(2),
    marginTop: hp(2),
    marginHorizontal: hp(1),
    marginVertical: hp(1),
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    fontFamily: 'Poppins-Regular',
    marginLeft: hp(0.5),
    fontSize: 14,
    color: '#475569',
    letterSpacing: 0.2,
  },
  cartImage: {
    width: hp(4),
    height: hp(4),
    resizeMode: 'cover',
    tintColor: 'white',
  },
  floatingText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#11418A',
    position: 'absolute',
    borderRadius: 12,
    paddingHorizontal: hp(2),
    right: wp(28),
    bottom: hp(3),
    zIndex: 999,
    width: wp(45),
    padding: hp(1),
    height: hp(6),
    shadowColor: '#11418A',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  floatingCartText: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    marginLeft: hp(1),
    fontSize: 14,
    letterSpacing: 0.3,
  },
  scrollView: { backgroundColor: '#F8FAFC' },
  mealTabActive: { backgroundColor: '#11418A' },
  mealTabInactive: { backgroundColor: '#94A3B8' },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 12,
    borderColor: '#E2E8F0',
    marginHorizontal: hp(2),
    marginBottom: hp(1.5),
    padding: hp(2),
    ...(Platform.OS === 'android' && { elevation: 0.5 }),
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryHeaderActive: { marginBottom: hp(2) },
  categoryTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  categoryChevron: {
    height: hp(2),
    width: wp(3),
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
    borderRadius: 10,
    paddingHorizontal: hp(1.5),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  healthDot: {
    height: hp(2),
    width: wp(4),
    borderRadius: hp(1),
  },
  itemInfo: {
    flex: 1,
    marginLeft: hp(2),
    justifyContent: 'center',
  },
  itemName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  itemCal: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  addItemBtn: {
    minWidth: wp(18),
    height: hp(4),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderColor: '#11418A',
  },
  addItemBtnAdded: {
    backgroundColor: '#D1FAE5',
    borderColor: '#22C55E',
  },
  addItemBtnText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#11418A',
    letterSpacing: 0.2,
  },
  addItemBtnTextAdded: {
    color: '#15803D',
  },
  emptyListText: {
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginTop: 24,
    color: '#64748B',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  listContent: { paddingBottom: 100 },
});

export default MealBuilder;
