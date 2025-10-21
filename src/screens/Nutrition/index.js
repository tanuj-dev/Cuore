import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
} from 'react-native';
import { Images, hp, wp } from '../../utilities';
import { useDispatch, useSelector } from 'react-redux';
import { getNourish, getRecipe } from '../../redux/slices';

const Nutrition = ({ navigation }) => {
  // const [selectedTab, setSelectedTab] = useState('Breakfast');
  const [activeTab, setActiveTab] = useState('Breakfast');

  const dispatch = useDispatch();
  const nourishData = useSelector(state => state.nourish.data);
  const loading = useSelector(state => state.nourish.loading);

  const mealOptions = [
    {
      title: 'Mung Dal Chilla',
      details: ['2 Moong Dal Chilla', '1/2 Katori Curd'],
      type: 'Veg',
      calories: 390,
    },
    {
      title: 'Dal paratha with curd',
      details: ['1 1/2 Dal Paratha', '1/2 Katori Curd'],
      type: 'Veg',
      calories: 370,
    },
    {
      title: 'Roti with paneer masala',
      details: ['3 Roti/ 2 Palak or Methi Roti', '3 tbsp Paneer Masala'],
      type: 'Veg',
      calories: 400,
    },
    {
      title: 'Appam with vegetable stew',
      details: ['3 Appam', '3/4 Katori Vegetable Stew', '1/2 glass Buttermilk'],
      type: 'Veg',
      calories: 410,
    },
    {
      title: 'Vegetable sandwich',
      details: ['1 Vegetable Sandwich', '1/2 cup Yogurt'],
      type: 'Veg',
      calories: 380,
    },
    {
      title: 'Oats with milk',
      details: ['1 cup Oats with toned milk', '2 tbsp Nuts'],
      type: 'Veg',
      calories: 400,
    },
    {
      title: 'Scrambled egg with toast',
      details: ['2 Whole Wheat Bread', '2 Egg Scrambled'],
      type: 'Non-Veg',
      calories: 380,
    },
    {
      title: 'Custom Plate (Choose Your Own Meal)',
      details: [],
      type: 'Custom',
      calories: 400,
    },
  ];
  useEffect(() => {
    if (activeTab === 'Breakfast') {
      dispatch(getNourish('Breakfast'));
    } else if (activeTab === 'LunchDinner') {
      dispatch(getNourish('Lunch/Dinner'));
    }
  }, [activeTab]);

  const handlePress = async (item, navigation) => {
    try {
      console.log('Fetching recipe for item:', item);
      const response = await dispatch(
        getRecipe(item?.recipeLink?._id),
      ).unwrap();
      console.log('Recipe data:', response.data);

      if (item.type === 'Custom') {
        navigation.navigate('MealBuilder');
      } else {
        navigation.navigate('Recipe');
      }
    } catch (error) {
      console.error('Failed to fetch recipe:', error);
    }
  };

  const renderMealCard = (item, index) => {
    const dietTag = item?.dietTag?.toUpperCase() || '';

    let tagColor = '#f59e0b'; // default
    let tagLabel = Images.WARNING; // default

    if (dietTag.startsWith('V')) {
      tagColor = '#16a34a'; // green for vegetarian
      tagLabel = Images.VEG;
    } else if (dietTag.startsWith('N')) {
      console.log('Rendering non-veg item:', dietTag);
      tagColor = '#dc2626'; // red for non-vegetarian
      tagLabel = Images.NON_VEG;
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
          <Text style={styles.mealTitle}>{item?.name}</Text>

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
                tintColor: tagLabel === Images.WARNING && '#f59e0b',
                height: tagLabel === Images.WARNING ? hp(2) : hp(2.5),
                width: tagLabel === Images.WARNING ? wp(10) : wp(15),
                marginLeft: hp(-1),
                resizeMode: 'contain',
              }}
              source={tagLabel}
            ></Image>
            <Text style={styles.kcal}>{item?.calories} kcal</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || !nourishData) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
        }}
      >
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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
            marginTop: Platform.OS == 'ios' && hp(4),
          }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
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
        <Text
          style={{
            fontFamily: 'Roboto-Regular',
            paddingHorizontal: hp(5),
            fontSize: 15,
            fontWeight: '400',
            color: '#000000',
            // alignSelf: 'center',
            textAlign: 'center',
            marginTop: hp(1.5),
          }}
        >
          Daily variety leads to better results— try a new option each day.
        </Text>
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
    fontSize: wp(3.5),
    color: '#1f2937',
    marginBottom: hp(1),
    fontWeight: '500',
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
