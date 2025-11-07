import React, { useState, useEffect } from 'react';
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
} from 'react-native';
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

  // 🟢 Log scroll position when it changes

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
              <Text
                style={{ fontSize: hp(1.8), color: '#c68a40', fontSize: 10 }}
              >
                Egg
              </Text>
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
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {toast && (
        <View style={styles.toastContainer}>
          <Toast
            message={toast}
            type={toastType}
            onHide={() => setToast(null)}
            // 🟢 dynamically position Toast based on scroll
            top={hp(4)}
          />
        </View>
      )}
      <ScrollView
        style={styles.container}
        scrollEventThrottle={16} // 🟢 ensures frequent updates
      >
        {/* 🔵 Header */}
        <ImageBackground
          style={{ padding: hp(2) }}
          source={Images.BACKGROUND_IMAGE_NUTRITION}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: Platform.OS === 'ios' ? hp(4) : hp(1.5),
            }}
          >
            <TouchableOpacity
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              onPress={() => navigation.goBack()}
            >
              <Image
                style={{ resizeMode: 'contain', height: hp(3), width: wp(4) }}
                source={Images.BACK_BUTTON}
              />
            </TouchableOpacity>
            <Image
              style={{ height: hp(2), width: wp(4), resizeMode: 'contain' }}
              source={Images.SHARE_4}
            />
          </View>

          <View
            style={{
              justifyContent: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: hp(2),
            }}
          >
            {/* Breakfast Tab */}
            <TouchableOpacity
              onPress={() => setActiveTab('Breakfast')}
              style={[
                styles.tabButton,
                {
                  backgroundColor:
                    activeTab === 'Breakfast' ? '#1E64AC' : '#9CA3AF',
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
                    activeTab === 'LunchDinner' ? '#1E64AC' : '#9CA3AF',
                },
              ]}
            >
              <Image style={styles.tabIcon} source={Images.KNIFE} />
              <Text style={styles.tabText}>Lunch/Dinner</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              style={{ marginTop: hp(2) }}
              size="small"
              color="#1E64AC"
            />
          ) : (
            <Text style={styles.headerTitle}>
              Daily variety leads to better results— try a new option each day.
            </Text>
          )}
        </ImageBackground>

        {/* 🥗 Meal Cards */}
        <View style={styles.cardList}>
          {nourishData?.meal_plan?.map((item, index) =>
            renderMealCard(item, index),
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerTitle: {
    fontFamily: 'Roboto-Regular',
    paddingHorizontal: hp(5),
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
    marginTop: hp(1.5),
  },
  cardList: {
    padding: wp(5),
  },
  card: {
    borderLeftWidth: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(1.5),
    elevation: 2,
    borderLeftColor: '#17AD8D',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  mealTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    marginBottom: hp(0.5),
  },
  detail: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  cardFooter: {
    marginTop: hp(1.5),
    flexDirection: 'row',
    // justifyContent: 'space-between',
    alignItems: 'center',
  },
  kcal: {
    fontFamily: 'Roboto-Regular',
    marginLeft: hp(0),
    fontSize: 14,
    color: '#4B5563',
  },
  tabButton: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: hp(1),
    paddingHorizontal: hp(4),
    borderRadius: hp(3),
    marginHorizontal: hp(1),
  },
  tabIcon: {
    resizeMode: 'contain',
    height: hp(3),
    width: wp(4),
    tintColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: hp(1),
  },
  toastContainer: {
    position: 'absolute',
    top: hp(10),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999, // for Android
  },
});

export default Nutrition;
