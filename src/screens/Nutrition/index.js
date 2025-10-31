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
} from 'react-native';
import { Images, hp, wp } from '../../utilities';
import { useDispatch, useSelector } from 'react-redux';
import { getNourish, getRecipe } from '../../redux/slices';
import ApiErrorFallback from '../../components/ApiError';
import Toast from '../../components/Toast';
import { Activity } from 'lucide-react-native';

const Nutrition = ({ navigation }) => {
  // const [selectedTab, setSelectedTab] = useState('Breakfast');
  const [activeTab, setActiveTab] = useState('Breakfast');
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

  const handlePress = async (item, navigation) => {
    try {
      console.log('Pressed item:', item);

      if (item.type === 'custom_plate') {
        navigation.navigate('MealBuilder');
      } else {
        setLoading(true);

        const response = await dispatch(
          getRecipe(item?.recipeLink?._id),
        ).unwrap();
        console.log('Fetched recipe response:', response);

        if (response.ingredients?.length > 0) {
          setToast('recipe fetched successfully');
          setToastType('success');
          setLoading(false);
          setRecipeData(response);
          navigation.navigate('Recipe', { receipeData: response });
        } else {
          setLoading(false);
          setToastType('error');
          setToast('Recipe data is unavailable for this meal.');
          console.error(
            'Failed to fetch recipe, status code:',
            response.status,
          );
        }
      }
    } catch (error) {
      console.error('Failed to fetch recipe:', error);
    }
  };

  const renderMealCard = (item, index) => {
    const dietTag = item?.dietTag?.toUpperCase() || item?.type?.toUpperCase();
    // console.log('Rendering meal card with dietTag:', item);

    const customPlate = item?.custom_plate;

    let tagColor = '#dc2626'; // default
    let tagLabel = Images.EGG; // default

    if (dietTag.startsWith('V')) {
      tagColor = '#16a34a'; // green for vegetarian
      tagLabel = Images.VEG;
    } else if (dietTag.startsWith('N')) {
      console.log('Rendering non-veg item:', dietTag);
      tagColor = '#dc2626'; // red for non-vegetarian
      tagLabel = Images.NON_VEG;
    } else if (dietTag.startsWith('E')) {
      tagColor = '#f59e0b'; // indigo for egg
      tagLabel = Images.EGG;
    } else if (dietTag.startsWith('C')) {
      tagColor = '#dc2626'; // red for custom
      tagLabel = Images.WARNING;
    }

    // Use tagColor and tagLabel in your card rendering

    return (
      <TouchableOpacity
        onPress={() => handlePress(item, navigation)}
        key={index}
        style={[
          styles.card,
          {
            borderLeftColor: tagColor,
          },
        ]}
      >
        <View>
          <Text style={styles.mealTitle}>{item?.name || item?.title}</Text>

          <View style={{}}>
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
                left: hp(37),
              }}
              source={Images.RIGHT_ARROW}
            ></Image>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              style={{
                tintColor: tagLabel === Images.WARNING && '#dc2626',
                height: tagLabel === Images.WARNING ? hp(2) : hp(2.5),
                width: tagLabel === Images.WARNING ? wp(10) : wp(15),
                marginLeft: hp(-1),
                resizeMode: 'contain',
              }}
              source={tagLabel}
            ></Image>
            <Text style={styles.kcal}>
              {item?.calories || item?.custom_plate} kcal
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 🔵 Header */}

      <ImageBackground
        style={{ padding: hp(2) }}
        source={Images.BACKGROUND_IMAGE_NUTRITION}
      >
        {toast && (
          <Toast
            message={toast}
            type={toastType}
            onHide={() => setToast(null)}
            top={hp(10)}
          />
        )}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: Platform.OS == 'ios' ? hp(4) : hp(1.5),
          }}
        >
          <TouchableOpacity
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            onPress={() => navigation.goBack()}
          >
            <Image
              style={{ resizeMode: 'contain', height: hp(3), width: wp(4) }}
              source={Images.BACK_BUTTON}
            ></Image>
          </TouchableOpacity>
          <Image
            style={{ height: hp(2), width: wp(4), resizeMode: 'contain' }}
            source={Images.SHARE_4}
          ></Image>
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
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              padding: hp(1),
              backgroundColor:
                activeTab === 'Breakfast' ? '#1E64AC' : '#9CA3AF',
              paddingHorizontal: hp(4),
              borderRadius: hp(3),
            }}
          >
            <Image
              style={{
                resizeMode: 'contain',
                height: hp(3),
                width: wp(4),
                tintColor: '#FFFFFF',
              }}
              source={Images.BREAKFAST}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: '#FFFFFF',
                marginLeft: hp(1),
              }}
            >
              Breakfast
            </Text>
          </TouchableOpacity>

          {/* Lunch & Dinner Tab */}
          <TouchableOpacity
            onPress={() => setActiveTab('LunchDinner')}
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              padding: hp(1),
              backgroundColor:
                activeTab === 'LunchDinner' ? '#1E64AC' : '#9CA3AF',
              paddingHorizontal: hp(4),
              borderRadius: hp(3),
              marginLeft: hp(2),
            }}
          >
            <Image
              style={{
                resizeMode: 'contain',
                height: hp(3),
                width: wp(4),
                tintColor: '#FFFFFF',
              }}
              source={Images.KNIFE}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: '#FFFFFF',
                marginLeft: hp(1),
              }}
            >
              Lunch/Dinner
            </Text>
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

      {/* Meal Cards */}
      <View style={styles.cardList}>
        {nourishData?.meal_plan?.map((item, index) =>
          renderMealCard(item, index),
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerImage: {
    width: '100%',
    height: hp(30),
    justifyContent: 'flex-end',
  },
  headerContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(14),
  },
  headerTitle: {
    fontFamily: 'Roboto-Regular',
    paddingHorizontal: hp(5),
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    // alignSelf: 'center',
    textAlign: 'center',
    marginTop: hp(1.5),
  },

  toggleContainer: {
    flexDirection: 'row',
    // backgroundColor: '#9CA3AF',
    borderRadius: wp(2),
    overflow: 'hidden',
    marginTop: hp(-20),
  },
  toggleButton: {
    flex: 1,
    margin: 1,
    borderRadius: hp(2),
    paddingVertical: hp(1),
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  toggleActive: {
    backgroundColor: '#2563eb',
  },
  toggleTextActive: {
    fontFamily: 'Roboto-Regular',
    color: '#fff',
    fontWeight: '600',
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
  },
  tag: { fontFamily: 'Roboto-Regular', fontSize: wp(3.2), fontWeight: '500' },
  kcal: {
    fontFamily: 'Roboto-Regular',
    marginLeft: hp(0),
    fontSize: 14,
    color: '#4B5563',
  },
});

export default Nutrition;
