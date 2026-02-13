import React, { useState } from 'react';
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

const CalorieIgnite = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('Breakfast');

  const mealOptions = [
    {
      title: '1 glass Apple Cider Vinegar Water',
      details:
        'Mix 1-2 teaspoons of raw apple cider vinegar in a glass of warm water & drink.',
      calories: 2,
    },
    {
      title: '1 glass Soaked Cinnamon Water',
      details:
        'Soak a cinnamon stick in warm water overnight & drink in the morning on an empty stomach.',
      calories: 3,
    },
    {
      title: '1 glass Green Tea with Turmeric',
      details:
        'Brew green tea, add a pinch of turmeric powder, and drink warm.',
      calories: 4,
    },
    {
      title: '1 glass Soaked Tulsi Water',
      details:
        'Soak a few fresh tulsi leaves in water overnight, warm it slightly & drink in the morning.',
      calories: 4,
    },
    {
      title: '1 glass Soaked Jeera Water',
      details:
        'Soak 1 teaspoon of cumin seeds in water overnight. Boil the next morning, strain & drink warm.',
      calories: 8,
    },
    {
      title: '1 glass Soaked Ajwain Water',
      details:
        'Soak 1 teaspoon of ajwain seeds in water overnight, strain & drink in the morning.',
      calories: 8,
    },
    {
      title: '1 glass Soaked Methi Water',
      details:
        'Soak 1 teaspoon of methi seeds in water overnight & drink the water on an empty stomach.',
      calories: 12,
    },
    {
      title: '1 glass Cucumber Mint Infusion',
      details:
        'Soak cucumber slices and fresh mint leaves in water overnight & drink in the morning.',
      calories: 12,
    },
    {
      title: '1 glass Lemon Honey Water',
      details:
        'Mix fresh lemon juice and a dash of honey in warm water & drink on an empty stomach.',
      calories: 15,
    },
    {
      title: '1 glass Soaked Flaxseed Water',
      details:
        'Soak 1 teaspoon of flaxseeds in water overnight & consume both the water and flaxseeds.',
      calories: 15,
    },
    {
      title: '1 glass Soaked Raisin Water',
      details:
        'Soak 8-10 raisins in water overnight & consume both the water and raisins in the morning.',
      calories: 16,
    },
    {
      title: '1 glass Ginger Lemon Water',
      details:
        'Boil crushed fresh ginger in water, let it cool slightly, add a squeeze of lemon & drink.',
      calories: 18,
    },
    {
      title: '1 glass Amla Water',
      details:
        'Mix 1 teaspoon of amla juice in water & drink fresh in the morning.',
      calories: 20,
    },
    {
      title: '1 glass Lemon and Chia Seed Water',
      details:
        'Soak 1 teaspoon of chia seeds in a glass of water with lemon juice for 10 minutes & drink.',
      calories: 25,
    },
    {
      title: '1 glass Beetroot Water',
      details: 'Blend 1 beetroot with water, strain the juice & drink fresh.',
      calories: 35,
    },
  ];

  const renderMealCard = (item, index) => {
    return (
      <TouchableOpacity
        // onPress={() => navigation.goBack()}
        key={index}
        style={[styles.card, { borderLeftColor: '#17AD8D' }]}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            position: 'absolute',
          }}
        >
          <Text style={styles.kcal}>⚡{item.calories} kcal</Text>
        </View>

        <View>
          <Text style={styles.mealTitle}>{item.title}</Text>

          <View style={{}}>
            <Text style={styles.detail}>{item.details}</Text>

            {/* <Image
              style={{
                height: hp(2),
                width: wp(4),
                resizeMode: 'contain',
                position: 'absolute',
                left: hp(37),
                bottom: hp(4),
              }}
              source={Images.RIGHT_ARROW}></Image> */}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 🔵 Header */}

      <ImageBackground
        style={{ height: hp(25), padding: hp(2) }}
        source={Images.BACKGROUND_IMAGE_NUTRITION}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: Platform.OS == 'ios' && hp(5),
          }}
        >
          <TouchableOpacity
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            style={{ paddingHorizontal: hp(1) }}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={Images.BACK_BUTTON} // Replace with actual key in your `images` object
              style={{
                resizeMode: 'contain',
                height: hp(3.5),
                width: wp(4),
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* <Image
            style={{ height: hp(2), width: wp(4), resizeMode: 'contain' }}
            source={Images.SHARE_4}
          ></Image> */}
        </View>

        <View
          style={{
            // flexDirection: 'row',
            alignItems: 'center',
            marginTop: hp(2),
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#1E64AC',
              paddingHorizontal: hp(2),
              borderRadius: hp(3),
            }}
          >
            <Image
              style={{
                height: hp(5),
                width: wp(4),
                resizeMode: 'contain',
                marginHorizontal: hp(1),
                // backgroundColor: 'red',
              }}
              source={Images.WHITE_FIRE}
            ></Image>

            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontSize: 14,
                fontWeight: '400',
                color: '#FFFFFF',
              }}
            >
              Calorie Ignite
            </Text>
          </View>
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
        {mealOptions.map((item, index) => renderMealCard(item, index))}
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
    marginVertical: hp(1),
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    // marginBottom: hp(0.5),
  },
  detail: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  cardFooter: {
    // marginTop: hp(1.5),
    // flexDirection: 'row',
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

export default CalorieIgnite;
