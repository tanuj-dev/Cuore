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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';
import LimitExceededModal from '../../components/LimitExceedModa';
import { useDispatch } from 'react-redux';
import { adjustPortion } from '../../redux/slices';

const tagColors = {
  green: '#00C853',
  yellow: '#FFD600',
};

const MealBuilder1 = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { dishes, targetCalories, sumofCalories, activeTab, activeCuisine } =
    route.params;

  const TargetCalories = targetCalories;
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState(
    dishes.map(item => ({ ...item, count: 1 })),
  );
  console.log('Selected Items:', selectedItems);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [adjustedPortions, setAdjustedPortions] = useState(null);

  const increment = id => {
    const updated = selectedItems.map(item =>
      item.id === id ? { ...item, count: item.count + 1 } : item,
    );
    setSelectedItems(updated);
  };

  const decrement = id => {
    const updated = selectedItems
      .map(item => (item.id === id ? { ...item, count: item.count - 1 } : item))
      .filter(item => item.count > 0); // ⛔ Remove if count is 0

    setSelectedItems(updated);
  };

  const totalSelected = selectedItems.length;
  const totalCalories = selectedItems.reduce(
    (sum, item) => sum + item.count * item.calories,
    0,
  );
  const maxAllowed = 4;

  const handleAdjustPortions = async () => {
    if (selectedItems.length > 4) {
      setShowLimitModal(true);
      return;
    }

    const cartItems = selectedItems.map(item => ({
      _id: item._id,
      name: item.dishname,
      calories: item.calories,
      servingSize: item.servingSize,
      adjustmentWeight: item.adjustmentWeight ?? 1,
      numOfServings: item.count,
      section: item.section,
      cuisine: activeCuisine,
      mealTime: activeTab,
      recipeLink: item.id,
    }));

    try {
      setLoading(true);
      console.log(cartItems, 'Cart Items for Adjustment');
      const response = await dispatch(
        adjustPortion({ recommendedCalories: targetCalories, cartItems }),
      ).unwrap();
      if (response?.adjustedItems?.length > 0) {
        setLoading(false);

        console.log('Adjusted portion response:', response);
        setAdjustedPortions(response);
        navigation.navigate('MealBuilder2', { selectedItems: response });
      } else {
        setLoading(false);
        Alert.alert(
          'Adjustment Error',
          'Could not adjust portions. Please try again.',
        );
      }
    } catch (error) {
      console.warn('Adjustment failed:', error);
      // optionally show error modal or toast
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
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: hp(2),
            paddingHorizontal: hp(4),
            alignItems: 'center',
          }}
        >
          <View>
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontSize: 14,
                fontWeight: '400',
                color: '#171615',
              }}
            >
              {selectedItems.length} items selected
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {selectedItems.length > maxAllowed && (
              <>
                <Image
                  style={[styles.backButton, { marginRight: hp(1) }]}
                  source={Images.WARNING}
                />
                <Text
                  style={{
                    fontFamily: 'Roboto-Regular',
                    fontSize: 14,
                    fontWeight: '400',
                    color: '#DF3938',
                  }}
                >
                  max 4 allowed
                </Text>
              </>
            )}
          </View>
        </View>
      </ImageBackground>

      {selectedItems.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            height: hp(50),
          }}
        >
          <Image
            source={Images.EMPTY_CART}
            style={{
              resizeMode: 'stretch',
              // tintColor: '#6B7280',
              height: hp(20),
              width: hp(20),
              marginBottom: hp(2),
            }}
          />
          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: '#6B7280',
            }}
          >
            No items selected.
          </Text>
        </View>
      ) : null}

      <View style={{ flex: 1, backgroundColor: '#F9FAFB', padding: wp(4) }}>
        <FlatList
          data={selectedItems}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            // console.log('Rendering item:', item),
            <View
              style={{
                marginHorizontal: hp(1),
                backgroundColor: '#FFFFFF',
                padding: hp(1.5),
                borderRadius: hp(1),
                marginVertical: hp(0.5),
                elevation: 2, // Android
                shadowColor: '#000', // iOS
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    height: hp(1.5),
                    width: hp(1.5),
                    borderRadius: hp(1),
                    backgroundColor: 'red',
                    marginRight: wp(3),
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '400',
                      color: '#000000',
                    }}
                  >
                    {item?.dishname}
                  </Text>
                  <Text
                    style={{
                      fontSize: hp(1.6),
                      color: '#6B7280',
                      marginTop: hp(0.5),
                    }}
                  >
                    {item?.calories} cal
                  </Text>
                </View>
              </View>

              {/* increment decrement button */}

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: hp(2),
                  marginLeft: hp(2.5),
                }}
              >
                <TouchableOpacity
                  onPress={() => decrement(item?.id)}
                  style={{
                    height: hp(3),
                    width: hp(3),
                    borderRadius: hp(2),
                    backgroundColor: '#eee',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: hp(2) }}>-</Text>
                </TouchableOpacity>
                <Text style={{ marginHorizontal: wp(2), fontSize: hp(2) }}>
                  {item.count}
                </Text>
                <TouchableOpacity
                  onPress={() => increment(item.id)}
                  style={{
                    height: hp(3),
                    width: hp(3),
                    borderRadius: hp(2),
                    backgroundColor: '#eee',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: hp(1.5) }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        {selectedItems?.length > 0 && (
          <View
            style={{
              padding: hp(2),
              borderTopWidth: 1,
              borderColor: '#ddd',
              marginTop: hp(1),
              alignItems: 'flex-end',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '400', color: '#4B5563' }}>
              Total Calories:{' '}
              <Text style={{ fontWeight: 'bold' }}>{totalCalories}</Text>
            </Text>
            {totalCalories > TargetCalories && (
              <Text
                style={{ fontSize: 14, fontWeight: '400', color: '#DC2626' }}
              >
                Extra: {totalCalories - TargetCalories} calories
              </Text>
            )}
          </View>
        )}

        {selectedItems?.length > 0 && (
          <TouchableOpacity
            onPress={handleAdjustPortions}
            style={{
              backgroundColor: '#1E64AC',
              marginHorizontal: wp(20),
              marginTop: hp(2),
              padding: hp(1.5),
              alignItems: 'center',
              borderRadius: hp(1),
              // marginBtom: hp(20),
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={{
                  fontFamily: 'Roboto-Regular',
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#FFFFFF',
                }}
              >
                Adjust Portions
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      <LimitExceededModal
        visible={showLimitModal}
        onClose={() => setShowLimitModal(false)}
      />
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
    marginTop: hp(2),
  },
  title: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'Roboto-Regular',
  },
});

export default MealBuilder1;
