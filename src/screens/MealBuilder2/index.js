import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';
import { getRecipe } from '../../redux/slices';
import { useDispatch } from 'react-redux';

const tagColors = {
  green: '#00C853',
  yellow: '#FFD600',
};

const MealBuilder2 = ({ navigation, route }) => {
  console.log('Route params in MealBuilder2:', route.params);

  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  // const { selectedItems?.adjustedItems } = route.params;
  const data = route?.params?.selectedItems?.adjustedItems;
  const selectedItems = route?.params?.selectedItems;

  const [adjustedPortions, setAdjustedPortions] = useState(data || []);

  const handleRecipePress = async recipeId => {
    if (!recipeId) return;
    try {
      setLoading(true);
      const res = await dispatch(getRecipe(recipeId)).unwrap();
      setLoading(false);
      if (res) {
        navigation.navigate('Recipe', { recipeData: res });
      } else {
        navigation.navigate('Recipe', { recipeData: null });
      }
    } catch (error) {
      setLoading(false);
      console.error('Failed to fetch recipe:', error);
      navigation.navigate('Recipe', { recipeData: null });
    }
  };

  return (
    <ScrollView style={styles.scroll}>
      <ImageBackground
        style={styles.backgroundImage}
        source={Images.BACKGROUND_IMAGE_NUTRITION}
      >
        <View style={styles.headerOverlay} />
        <TouchableOpacity
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          onPress={() => navigation.goBack()}
          style={styles.headerContainer}
        >
          <Image style={styles.backButton} source={Images.BACK_BUTTON} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Cuore plate</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Recipe')}
          style={styles.badge}
          activeOpacity={0.8}
        >
          <Text style={styles.badgeText}>My Custom Meal</Text>
        </TouchableOpacity>
      </ImageBackground>

      <View style={styles.contentWrap}>
        <FlatList
          data={data}
          keyExtractor={(item, index) =>
            String(item?.id ?? item?.name ?? index)
          }
          renderItem={({ item }) => {
            const newServingSize = item?.newServingSizeString;

            return (
              <TouchableOpacity
                onPress={() => handleRecipePress(item?.recipeLink)}
                style={styles.itemCard}
                activeOpacity={0.7}
              >
                <View style={styles.itemRow}>
                  <View style={styles.itemDot} />
                  <View style={styles.itemContent}>
                    <Text style={styles.servingText}>{newServingSize}</Text>
                    <Text style={styles.calText}>
                      {item?.adjustedCalories} cal
                    </Text>
                  </View>
                  <Image style={styles.arrowIcon} source={Images.RIGHT_ARROW} />
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('MealBuilder', { mealTime: 'Breakfast' })
          }
          style={styles.clearButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.clearButtonText}>Clear Selection</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.noteText}>Note: {selectedItems?.message}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  backgroundImage: {
    height: hp(24),
    paddingHorizontal: wp(4),
    paddingTop: Platform.OS === 'ios' ? hp(2) : hp(1),
    paddingBottom: hp(2),
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    resizeMode: 'contain',
    height: hp(3.5),
    width: wp(4),
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  badge: {
    backgroundColor: '#11418A',
    alignSelf: 'center',
    marginTop: hp(1.5),
    paddingVertical: hp(1),
    paddingHorizontal: hp(2),
    borderRadius: 10,
  },
  badgeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  contentWrap: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: wp(4),
    paddingBottom: hp(10),
  },
  itemCard: {
    marginHorizontal: hp(1),
    backgroundColor: '#FFFFFF',
    padding: hp(2),
    borderRadius: 12,
    marginVertical: hp(0.75),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && { elevation: 1 }),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDot: {
    height: hp(2),
    width: hp(2),
    borderRadius: hp(1),
    backgroundColor: 'red',
    marginRight: wp(3),
  },
  itemContent: {
    flex: 1,
  },
  servingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  calText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  arrowIcon: {
    height: hp(2),
    width: wp(4),
    resizeMode: 'contain',
  },
  clearButton: {
    backgroundColor: '#11418A',
    marginHorizontal: wp(10),
    marginTop: hp(2),
    paddingVertical: hp(1.5),
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && { elevation: 2 }),
  },
  clearButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  noteText: {
    fontFamily: 'Poppins-Regular',
    marginTop: hp(2),
    fontSize: 12,
    color: '#64748B',
    width: wp(90),
    alignSelf: 'center',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: hp(10),
    letterSpacing: 0.2,
  },
});

export default MealBuilder2;
