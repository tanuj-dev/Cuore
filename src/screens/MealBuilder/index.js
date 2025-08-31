import React, {useState} from 'react';
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
} from 'react-native';
import {ProgressBar} from 'react-native-paper';
import {hp, wp, Images} from '../../utilities';
import images from '../../utilities/Images';

const foodItems = [
  {
    id: 'group-1',
    title: 'Indian Breads & Wraps',
    data: [
      {id: '1', name: '1 Tandoori Roti', calories: 120, tag: 'Include'},
      {id: '2', name: '1 Butter Naan', calories: 180, tag: 'Avoid'},
      {id: '3', name: '1 Plain Roti', calories: 80, tag: 'Include'},
      {id: '4', name: '1 Garlic Naan', calories: 200, tag: 'Include'},
      {id: '5', name: '1 Missi Roti', calories: 150, tag: 'Limit'},
    ],
  },
  {
    id: 'group-2',
    title: 'Rice & Grains',
    data: [
      {id: '6', name: '1 cup White Rice', calories: 206, tag: 'Avoid'},
      {id: '7', name: '1 cup Brown Rice', calories: 215, tag: 'Include'},
      {id: '8', name: '1 cup Quinoa', calories: 222, tag: 'Include'},
      {id: '9', name: '1 cup Millet', calories: 207, tag: 'Limit'},
      {id: '10', name: '1 cup Pulao', calories: 250, tag: 'Limit'},
    ],
  },
  {
    id: 'group-3',
    title: 'Snacks & Namkeen',
    data: [
      {id: '11', name: '1 Samosa', calories: 308, tag: 'Avoid'},
      {id: '12', name: '1 Kachori', calories: 200, tag: 'Avoid'},
      {id: '13', name: '1 packet Bhel', calories: 120, tag: 'Limit'},
      {id: '14', name: 'Roasted Chana (100g)', calories: 387, tag: 'Include'},
      {id: '15', name: 'Masala Makhana (30g)', calories: 150, tag: 'Include'},
    ],
  },
  {
    id: 'group-4',
    title: 'Dals & Lentils',
    data: [
      {id: '16', name: '1 cup Toor Dal', calories: 194, tag: 'Include'},
      {id: '17', name: '1 cup Moong Dal', calories: 147, tag: 'Include'},
      {id: '18', name: '1 cup Chana Dal', calories: 269, tag: 'Limit'},
      {id: '19', name: '1 cup Masoor Dal', calories: 230, tag: 'Include'},
      {id: '20', name: '1 cup Rajma', calories: 215, tag: 'Limit'},
    ],
  },
  {
    id: 'group-5',
    title: 'Sweets & Desserts',
    data: [
      {id: '21', name: '1 Gulab Jamun', calories: 150, tag: 'Avoid'},
      {id: '22', name: '1 Rasgulla', calories: 125, tag: 'Avoid'},
      {id: '23', name: '1 piece Barfi', calories: 200, tag: 'Limit'},
      {id: '24', name: '1 serving Kheer', calories: 250, tag: 'Limit'},
      {id: '25', name: '1 scoop Ice Cream', calories: 180, tag: 'Avoid'},
    ],
  },
];

const tagColors = {
  Include: '#22C55E',
  Limit: '#EAB308',
  Avoid: '#EF4444',
};

const MealBuilder = ({navigation}) => {
  const [activeTab, setActiveTab] = useState('Breakfast');
  const [activeCuisine, setActiveCuisine] = useState('Indian');
  const [expand, setExpand] = useState(false);
  const [foodId, setFoodID] = useState('');

  const renderCard = ({item}) => {
    return (
      <View
        style={{
          backgroundColor: '#F9FAFB',
          borderWidth: 1,
          borderRadius: hp(1),
          borderColor: '#E5E7EB',
          margin: 3,
          padding: hp(2),
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: expand ? hp(3) : hp(0),
          }}>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 14,
              fontWeight: '400',
              color: '#000000',
            }}>
            {item.title} ({item.data.length})
          </Text>
          <TouchableOpacity
            onPress={() => {
              setExpand(!expand);
              setFoodID(item.id);
            }}>
            <Image
              style={{height: hp(2), width: wp(3)}}
              source={images.RIGHT_ARROW}
            />
          </TouchableOpacity>
        </View>

        {expand &&
          foodId == item.id &&
          item?.data.map((subItem, index) => (
            <View key={subItem.id || index} style={{}}>
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  elevation: 1,
                  height: hp(10),
                  margin: hp(0.5),
                  borderRadius: hp(0.5),
                  justifyContent: 'center',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                  }}>
                  <View
                    style={{
                      height: hp(2),
                      width: wp(4),
                      borderRadius: hp(2),
                      backgroundColor: tagColors[subItem.tag],
                    }}
                  />
                  <View
                    style={{
                      width: hp(20),
                      alignItems: 'flex-start',
                      marginLeft: hp(2),
                    }}>
                    <Text>{subItem.name}</Text>
                    <Text>{subItem.calories} cal</Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      width: wp(18),
                      height: hp(4),
                      borderWidth: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: hp(4),
                    }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '400',
                        color: '#000000',
                        fontFamily: 'Roboto-Regular',
                      }}>
                      Add
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
      </View>
    );
  };

  return (
    <View style={{flex: 1}}>
      <View style={styles.floatingText}>
        {/* <Text style={styles.floatingTextLabel}>Floating Reminder</Text> */}
        <TouchableOpacity onPress={() => navigation.navigate('MealBuilder1')}>
          <Image source={Images.CART} style={styles.cartImage} />
        </TouchableOpacity>
      </View>
      <ScrollView style={{backgroundColor: '#F9FAFB'}}>
        <ImageBackground
          style={styles.backgroundImage}
          source={Images.BACKGROUND_IMAGE_NUTRITION}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerContainer}>
            <Image style={styles.backButton} source={Images.BACK_BUTTON} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Cuore MealBuilder</Text>
          </View>

          <View style={styles.progressRow}>
            <View>
              <Text style={styles.target}>Target</Text>
              <Text style={styles.kcal}>400 kcal</Text>
            </View>

            <ProgressBar
              progress={5 / 7}
              color="#3271B1"
              style={styles.progress}
            />

            <View>
              <Text style={styles.target}>Remaining</Text>
              <Text style={[styles.kcal, styles.remainingKcal]}>100 kcal</Text>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.mealTypeRow}>
            {/* Breakfast Tab */}
            <TouchableOpacity
              onPress={() => setActiveTab('Breakfast')}
              style={[
                styles.breakfastBox,
                {
                  backgroundColor:
                    activeTab === 'Breakfast' ? '#1E64AC' : '#9CA3AF',
                },
              ]}>
              <Image
                style={styles.breakfastIcon}
                source={Images.BREAKFAST}
                // tintColor="#FFFFFF"
              />
              <Text style={[styles.breakfastText, {color: '#FFFFFF'}]}>
                Breakfast
              </Text>
            </TouchableOpacity>

            {/* Lunch Dinner Tab */}
            <TouchableOpacity
              onPress={() => setActiveTab('LunchDinner')}
              style={[
                styles.lunchDinnerBox,
                {
                  backgroundColor:
                    activeTab === 'LunchDinner' ? '#1E64AC' : '#9CA3AF',
                },
              ]}>
              <Image
                style={styles.lunchDinnerIcon}
                source={Images.KNIFE}
                // tintColor="#FFFFFF"
              />
              <Text style={[styles.lunchDinnerText, {color: '#FFFFFF'}]}>
                Lunch Dinner
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Image style={styles.searchIcon} source={Images.SEARCH} />
            <TextInput
              placeholderTextColor={'#6B7280'}
              placeholder="Search..."
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
              ]}>
              <Text
                style={
                  activeCuisine === 'Indian'
                    ? styles.cuisineSelectedText
                    : styles.cuisineUnselectedText
                }>
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
              ]}>
              <Text
                style={
                  activeCuisine === 'Global'
                    ? styles.cuisineSelectedText
                    : styles.cuisineUnselectedText
                }>
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
            data={foodItems}
            keyExtractor={item => item.id}
            renderItem={renderCard}
            contentContainerStyle={{paddingBottom: 100}}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    height: hp(20),
    padding: hp(2),
  },
  headerContainer: {marginTop:Platform.OS =='ios'&& hp(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
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
    marginTop: hp(3),
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
    fontWeight: '400',
    color: '#5B636F',
  },
  kcal: {
    fontFamily: 'Roboto-Regular',
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
  },
  remainingKcal: {
    fontFamily: 'Roboto-Regular',
    color: '#46BCA1',
  },
  body: {
    padding: hp(2),
  },
  mealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakfastBox: {
    flexDirection: 'row',
    backgroundColor: '#1E64AC',
    padding: hp(1),
    paddingHorizontal: hp(6),
    borderRadius: hp(0.5),
    alignItems: 'center',
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
  searchInput: {fontFamily: 'Roboto-Regular', flex: 1},
  cuisineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2),
  },
  cuisineSelected: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B7280',
    width: hp(20),
    paddingVertical: hp(1.3),
    borderRadius: hp(0.6),
  },
  cuisineBox: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
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
    width: hp(20),
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
  cartImage: {width: hp(4), height: hp(4), resizeMode: 'cover'},
  floatingText: {
    position: 'absolute',
    top: hp(45), // adjust as needed
    left: wp(85),
    right: wp(5),
    zIndex: 999, // ensure it's above everything else
    // backgroundColor: 'red',
    padding: hp(1),
    borderRadius: 8,
    // shadowColor: '#000',
    // shadowOpacity: 0.1,
    // shadowOffset: {width: 0, height: 2},
    // shadowRadius: 4,
    // elevation: 5,
  },
});

export default MealBuilder;
