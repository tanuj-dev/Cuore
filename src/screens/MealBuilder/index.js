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
      <View
        style={{
          backgroundColor: '#F9FAFB',
          borderWidth: 1,
          borderRadius: hp(1),
          borderColor: '#E5E7EB',
          margin: 3,
          padding: hp(2),
          marginHorizontal: hp(2),
          marginBottom: hp(1),
        }}
      >
        {/* Header */}
        <TouchableOpacity
          onPress={() => toggleExpand(category)}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: isActive ? hp(3) : 0,
          }}
        >
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 14,
              color: '#000',
            }}
          >
            {category} ({items.length})
          </Text>
          <Animated.Image
            style={{
              height: hp(2),
              width: wp(3),
              transform: [
                {
                  rotate: animationMap[category].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '90deg'],
                  }),
                },
              ],
            }}
            source={images.RIGHT_ARROW}
          />
        </TouchableOpacity>

        {/* Expanded Items */}
        <Animated.View style={{ height: animatedHeight, overflow: 'hidden' }}>
          {isActive &&
            items.map((subItem, index) => {
              const isAlreadyAdded = selectedItems.some(
                i => i.dishname === subItem?.name,
              );

              return (
                <View key={subItem?._id || index}>
                  <View
                    style={{
                      backgroundColor: '#FFF',
                      height: hp(8),
                      overflow: 'hidden',
                      margin: hp(0.5),
                      borderRadius: hp(0.5),
                      justifyContent: 'center',
                      elevation: 0.5,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.5,
                      shadowRadius: 2,
                      borderWidth: Platform.OS === 'ios' ? 0.5 : 0,
                      borderColor: '#E5E7EB',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-evenly',
                        alignItems: 'center',
                      }}
                    >
                      <View
                        style={{
                          height: hp(2),
                          width: wp(4),
                          borderRadius: hp(2),
                          backgroundColor:
                            subItem?.healthColor == 'red'
                              ? tagColors['Avoid']
                              : subItem?.healthColor == 'yellow'
                              ? tagColors['Limit']
                              : subItem?.healthColor == 'green'
                              ? tagColors['Include']
                              : '#D1D5DB',
                        }}
                      />
                      <View
                        style={{
                          width: hp(20),
                          alignItems: 'flex-start',
                          marginLeft: hp(2),
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '400',
                            color: '#000',
                          }}
                        >
                          {subItem?.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: '#6B7280',
                            marginTop: hp(0.5),
                          }}
                        >
                          {subItem?.calories} cal
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={{
                          width: wp(18),
                          height: hp(4),
                          borderWidth: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: hp(4),
                          backgroundColor: isAlreadyAdded
                            ? '#D1FAE5'
                            : '#FFFFFF',
                          borderColor: isAlreadyAdded ? '#22C55E' : '#000',
                        }}
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
                          style={{
                            fontSize: 14,
                            fontWeight: '400',
                            color: '#000',
                          }}
                        >
                          {isAlreadyAdded ? 'Added' : 'Add'}
                        </Text>
                      </TouchableOpacity>
                    </View>
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
          <Text style={{ color: '#FFF', marginLeft: hp(1), fontWeight: '600' }}>
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
            color="#3271B1"
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
                  0 && { color: 'red' },
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
                  0 && { color: 'red' },
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
            title="Pull to refresh..."
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        nestedScrollEnabled={true}
        style={{ backgroundColor: '#F9FAFB' }}
      >
        <View style={styles.body}>
          <View style={styles.mealTypeRow}>
            <TouchableOpacity
              onPress={() => setActiveTab('Breakfast')}
              style={[
                styles.breakfastBox,
                {
                  backgroundColor:
                    activeTab === 'Breakfast' ? '#1E64AC' : '#9CA3AF',
                },
              ]}
            >
              <Image
                style={styles.breakfastIcon}
                source={Images.BREAKFAST}
                // tintColor="#FFFFFF"
              />
              <Text style={[styles.breakfastText, { color: '#FFFFFF' }]}>
                Breakfast
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('LunchDinner')}
              style={[
                styles.lunchDinnerBox,
                {
                  backgroundColor:
                    activeTab === 'LunchDinner' ? '#1E64AC' : '#9CA3AF',
                },
              ]}
            >
              <Image
                style={styles.lunchDinnerIcon}
                source={Images.KNIFE}
                // tintColor="#FFFFFF"
              />
              <Text style={[styles.lunchDinnerText, { color: '#FFFFFF' }]}>
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
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={() => (
              <Text
                style={{ textAlign: 'center', marginTop: 20, color: '#777' }}
              >
                No items found 😢
              </Text>
            )}
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
    marginTop: Platform.OS == 'ios' && hp(4),
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
    marginTop: hp(1),
  },
  title: {
    fontFamily: 'Roboto-Regular',
    fontSize: 18,
    fontWeight: '400',
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
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  kcal: {
    fontFamily: 'Roboto-Regular',
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  remainingKcal: {
    fontFamily: 'Roboto-Regular',
    color: '#46BCA1',
  },
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
    backgroundColor: '#1E64AC',
    padding: hp(1),
    // margin: hp(1),
    paddingHorizontal: hp(6),
    borderRadius: hp(0.5),
    alignItems: 'center',
    width: wp(42),
  },
  breakfastIcon: {
    height: hp(3),
    width: wp(4),
    marginRight: hp(1),
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  breakfastText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  lunchDinnerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: wp(42),
    flexDirection: 'row',
    backgroundColor: '#9CA3AF',
    padding: hp(1.4),
    paddingHorizontal: hp(4.5),
    borderRadius: hp(0.5),
    alignItems: 'center',
  },
  lunchDinnerIcon: {
    height: hp(2),
    width: wp(4),
    marginRight: hp(1),
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  lunchDinnerText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  searchBox: {
    marginHorizontal: hp(2),
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: hp(0.5),
    paddingHorizontal: hp(2),
    borderRadius: hp(0.9),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: hp(2),
  },
  searchIcon: {
    height: hp(2),
    width: wp(4),
    marginRight: hp(1),
    resizeMode: 'contain',
  },
  searchInput: {
    fontFamily: 'Roboto-Regular',
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? hp(1) : hp(1),
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
    backgroundColor: '#6B7280',
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
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  cuisineUnselected: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
    width: hp(18),
    paddingVertical: hp(1.3),
    borderRadius: hp(0.6),
  },
  cuisineUnselectedText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
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
    fontFamily: 'Roboto-Regular',
    marginLeft: hp(0.5),
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
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
    backgroundColor: '#bb6a62ff',
    position: 'absolute',
    borderRadius: hp(5),
    paddingHorizontal: hp(2),
    right: wp(28),
    bottom: hp(3),
    zIndex: 999, // ensure it's above everything else
    width: wp(45),
    padding: hp(1),
    height: hp(6),
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
});

export default MealBuilder;
