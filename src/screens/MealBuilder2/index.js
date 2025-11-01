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
    console.log('Recipe ID:', recipeId);
    const recipe = recipeId;
    try {
      setLoading(true);
      const res = await dispatch(getRecipe(recipe)).unwrap();
      setLoading(false);
      navigation.navigate('Recipe', { recipeData: res });
    } catch (error) {
      setLoading(false);
      console.error('Failed to fetch recipe:', error);
      // Optionally show a toast or alert here
    }
  };

  return (
    <ScrollView style={{}}>
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

        <View
          onPress={() => navigation.navigate('Recipe')}
          style={{
            backgroundColor: '#326FAA',
            width: hp(20),
            alignItems: 'center',
            alignSelf: 'center',
            marginTop: hp(1),
            padding: hp(1),
            borderRadius: hp(1),
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#FFFFFF' }}>
            My Custom Meal
          </Text>
        </View>
      </ImageBackground>

      <View style={{ flex: 1, backgroundColor: '#F9FAFB', padding: wp(4) }}>
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const originalName = item?.name; // "1 tbsp Coconut Chutney"
            const newServingSize = item?.newServingSizeString; // "1.75 tbsp"
            const updatedName = originalName.replace(
              /^\d+(\.\d+)?\s*\w+/,
              newServingSize,
            );

            return (
              <TouchableOpacity
                onPress={() => handleRecipePress(item?.recipeLink)}
                style={{
                  marginHorizontal: hp(1),
                  backgroundColor: '#FFFFFF',
                  padding: hp(3),
                  borderRadius: hp(1),
                  marginVertical: hp(0.5),
                  elevation: 1,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowOffset: { width: 0, height: 1 },
                  shadowRadius: 2,
                  // elevation: 2,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      height: hp(2),
                      width: hp(2),
                      borderRadius: hp(1),
                      // margin: hp(1),
                      backgroundColor: 'red',
                      // backgroundColor: tagColors[item.tag],
                      marginRight: wp(3),
                      // paddingVertical: hp(0.5),
                    }}
                  />
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontFamily: 'Roboto-Regular',
                          fontSize: 15,
                          fontWeight: '400',
                          color: '#000000',
                        }}
                      >
                        {updatedName}
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'Roboto-Regular',
                          fontSize: 14,
                          color: '#6B7280',
                        }}
                      >
                        {item?.adjustedCalories} cal
                      </Text>
                    </View>
                    <Image
                      style={{
                        height: hp(2),
                        width: wp(4),
                        resizeMode: 'contain',
                        // position: 'absolute',
                        // left: hp(37),
                      }}
                      source={Images.RIGHT_ARROW}
                    ></Image>
                  </View>
                </View>

                {/* increment decrement button */}
              </TouchableOpacity>
            );
          }}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate({ index: 0, name: 'MealBuilder' })}
          style={{
            backgroundColor: '#1E64AC',
            marginHorizontal: wp(20),
            marginTop: hp(2),
            padding: hp(1.5),
            alignItems: 'center',
            borderRadius: hp(1),
            // marginBottom: hp(20),
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontSize: 16,
                fontWeight: '500',
                color: '#FFFFFF',
              }}
            >
              Clear Selection
            </Text>
          )}
        </TouchableOpacity>
        <Text
          style={{
            marginTop: hp(2),
            fontSize: 12,
            color: '#6B7280',
            width: wp(90),
            alignSelf: 'center',
            textAlign: 'center',
            // fontFamily: 'Roboto-Regular',
            // lineHeight: 16,
            marginBottom: hp(10),
          }}
        >
          Note: {selectedItems?.message}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    height: hp(20),
    padding: hp(2),
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerContainer: {
    marginTop: Platform.OS == 'ios' && hp(5),
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
    fontSize: 18,
    fontWeight: '400',
  },
});

export default MealBuilder2;
