import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import { Images, hp, wp } from '../../utilities';
import { useDispatch, useSelector } from 'react-redux';
import { getNourish, getRecipe } from '../../redux/slices';
import ApiErrorFallback from '../../components/ApiError';
import Toast from '../../components/Toast';

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
  const [receipeData, setRecipeData] = useState(null);

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
          setToast('Recipe data unavailable for this meal.');
        }
      }
    } catch (error) {
      console.error('Failed to fetch recipe:', error);
      setLoading(false);
    }
  };

  const renderMealCard = (item, index) => {
    const dietTag = item?.dietTag?.toUpperCase() || item?.type?.toUpperCase();
    let tagColor = '#dc2626';
    let tagLabel = Images.VEG;

    if (dietTag.startsWith('V')) {
      tagColor = '#16a34a';
      tagLabel = Images.VEG;
    } else if (dietTag.startsWith('N')) {
      tagColor = '#dc2626';
      tagLabel = Images.NON_VEG;
    } else if (dietTag.startsWith('E')) {
      tagColor = '#f59e0b';
      tagLabel = Images.EGG;
    } else if (dietTag.startsWith('C')) {
      tagColor = '#dc2626';
      tagLabel = Images.WARNING;
    }

    return (
      <TouchableOpacity
        onPress={() => handlePress(item, navigation)}
        key={index}
        style={[styles.card, { borderLeftColor: tagColor }]}
      >
        <View>
          <Text style={styles.mealTitle}>{item?.name || item?.title}</Text>

          <View>
            {item?.components?.map((line, idx) => (
              <Text key={idx} style={styles.detail}>
                {'\u2022'} {line}
              </Text>
            ))}
            <Image
              style={{
                height: hp(2),
                width: wp(4),
                resizeMode: 'contain',
                position: 'absolute',
                right: hp(0),
                top: hp(1),
              }}
              source={Images.RIGHT_ARROW}
            />
          </View>
        </View>
        <View style={styles.cardFooter}>
          {tagLabel === Images.EGG ? (
            <View
              style={{
                backgroundColor: '#fff8c3',
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: hp(2),
                paddingHorizontal: wp(2),
                borderRadius: hp(1),
                justifyContent: 'center',
              }}
            >
              <Image
                style={{
                  height: hp(2.5),
                  width: wp(3),
                  resizeMode: 'contain',
                  marginRight: hp(0),
                }}
                source={Images.EGG}
              />
              <Text style={styles.eggTagText}>Egg</Text>
            </View>
          ) : (
            <Image
              style={{
                height: tagLabel === Images.WARNING ? hp(2) : hp(2.5),
                width: tagLabel === Images.WARNING ? wp(14) : wp(13),
                resizeMode: 'contain',
              }}
              source={tagLabel}
            />
          )}

          <Text
            style={[
              styles.kcal,
              tagLabel == Images.EGG ? { marginLeft: -hp(1.2) } : '',
            ]}
          >
            {item?.calories || item?.custom_plate} kcal
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
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
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          {/* Fixed Header Buttons - Always Visible */}
          <View style={styles.fixedHeader}>
            <TouchableOpacity
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              onPress={() => navigation.goBack()}
              style={styles.fixedButton}
            >
              <Image
                style={{
                  resizeMode: 'contain',
                  height: hp(3),
                  width: wp(4),
                }}
                source={Images.BACK_BUTTON}
              />
            </TouchableOpacity>
            <TouchableOpacity
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              onPress={handleShareScreenshot}
              style={styles.fixedButton}
            >
              <Image
                style={{
                  height: hp(2),
                  width: wp(4),
                  resizeMode: 'contain',
                }}
                source={Images.SHARE_4}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.container}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            contentContainerStyle={
              {
                // paddingTop: Platform.OS === 'ios' ? hp(4) : hp(1.5),
              }
            }
          >
            {/* 🔵 Header */}
            <ImageBackground
              style={{ padding: hp(2) }}
              source={Images.BACKGROUND_IMAGE_NUTRITION}
            >
              {/* Spacer for fixed buttons */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  height: Platform.OS === 'ios' ? hp(4) : hp(1.5),
                }}
              >
                <View style={{ width: wp(4) }} />
                <View style={{ width: wp(4) }} />
              </View>

              {/* Tabs */}
              <View
                style={{
                  justifyContent: 'center',
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: Platform.OS === 'ios' ? hp(0) : hp(2),
                }}
              >
                {/* Breakfast Tab */}
                <TouchableOpacity
                  onPress={() => setActiveTab('Breakfast')}
                  style={[
                    styles.tabButton,
                    {
                      backgroundColor:
                        activeTab === 'Breakfast' ? '#11418A' : '#94A3B8',
                    },
                  ]}
                >
                  <Image style={styles.tabIcon} source={Images.BREAKFAST} />
                  <Text style={styles.tabText}>Breakfast</Text>
                </TouchableOpacity>

                {/* Lunch & Dinner Tab */}
                <TouchableOpacity
                  onPress={() => setActiveTab('LunchDinner')}
                  style={[
                    styles.tabButton,
                    {
                      backgroundColor:
                        activeTab === 'LunchDinner' ? '#11418A' : '#94A3B8',
                    },
                  ]}
                >
                  <Image style={styles.tabIcon} source={Images.KNIFE} />
                  <Text style={styles.tabText}>Lunch/Dinner</Text>
                </TouchableOpacity>
              </View>

              {/* 🔍 Search Bar */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Search')}
                style={styles.searchContainer}
              >
                <View>
                  <Image source={Images.SEARCH} style={styles.searchIcon} />
                </View>

                <Text style={styles.searchPlaceholder}> Search Recipe...</Text>
              </TouchableOpacity>

              {loading ? (
                <ActivityIndicator
                  style={{ marginTop: hp(2) }}
                  size="small"
                  color="#11418A"
                />
              ) : (
                <Text style={styles.headerTitle}>
                  Daily variety leads to better results— try a new option each
                  day.
                </Text>
              )}
            </ImageBackground>

            {/* 🥗 Meal Cards */}
            <View style={styles.cardList}>
              {filteredMeals?.length > 0 ? (
                filteredMeals.map((item, index) => renderMealCard(item, index))
              ) : (
                <Text style={styles.noResultText}>No meals found.</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </ViewShot>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  fixedHeader: {
    // position: 'absolute',
    // top: Platform.OS === 'ios' ? hp(0) : hp(1.5),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: hp(2),
    zIndex: 1000,
    // elevation: 1000,
    pointerEvents: 'box-none',
  },
  fixedButton: {
    // backgroundColor: 'rgba(255, 255, 255, 0.95)',
    // borderRadius: 12,
    // padding: hp(1.2),
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 6,
    // elevation: 3,
  },
  headerTitle: {
    fontFamily: 'Poppins-Regular',
    paddingHorizontal: hp(5),
    fontSize: 15,
    color: '#1E293B',
    textAlign: 'center',
    marginTop: hp(1.5),
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  cardList: {
    padding: wp(5),
  },
  card: {
    borderLeftWidth: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: wp(4),
    marginBottom: hp(1.8),
    elevation: 2,
    borderLeftColor: '#10B981',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  mealTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#1E293B',
    marginBottom: hp(0.5),
    letterSpacing: -0.2,
  },
  detail: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  cardFooter: {
    marginTop: hp(1.5),
    flexDirection: 'row',
    alignItems: 'center',
  },
  kcal: {
    fontFamily: 'Poppins-Regular',
    marginLeft: hp(0),
    fontSize: 14,
    color: '#475569',
    letterSpacing: 0.2,
  },
  tabButton: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: hp(1.2),
    paddingHorizontal: hp(4),
    borderRadius: 12,
    marginHorizontal: hp(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tabIcon: {
    resizeMode: 'contain',
    height: hp(3),
    width: wp(4),
    tintColor: '#FFFFFF',
  },
  tabText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: hp(1),
    letterSpacing: 0.3,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: hp(1),
    marginTop: hp(2),
    paddingHorizontal: hp(2),
    paddingVertical: hp(1.2),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  searchPlaceholder: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#94A3B8',
    letterSpacing: 0.2,
  },
  searchIcon: {
    height: hp(2.5),
    width: wp(4),
    resizeMode: 'contain',
    tintColor: '#94A3B8',
    marginRight: hp(1),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#1E293B',
    paddingVertical: Platform.OS === 'ios' ? hp(1.5) : 0,
    letterSpacing: 0.2,
  },
  noResultText: {
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
    marginTop: hp(2),
    letterSpacing: 0.2,
  },
  eggTagText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: '#C68A40',
    letterSpacing: 0.2,
  },
});

export default Nutrition;
