import React, { useState, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
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
  StatusBar,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { hp, wp, Images } from '../../utilities';
import LimitExceededModal from '../../components/LimitExceedModa';
import { useDispatch } from 'react-redux';
import { adjustPortion } from '../../redux/slices';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const tagColors = {
  green: '#00C853',
  yellow: '#FFD600',
};

const MealBuilder1 = ({ navigation, route }) => {
  const { colors: c, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(c, isDark), [c, isDark]);

  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();
  console.log('Route params:', route.params);
  const { dishes, targetCalories, sumofCalories, activeTab, activeCuisine } =
    route.params;
  console.log('Dishes:', dishes);

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
    console.log('Handling portion adjustment...');

    // Early exit if too many items
    if (selectedItems.length > 4) {
      console.log('Exceeded max allowed items');
      setShowLimitModal(true);
      return;
    }

    // Early exit if no items selected
    if (selectedItems.length === 0) {
      alert('No items selected', 'Please select at least one item.');
      return;
    }

    // Prepare cart items for dispatch
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
      recipeLink: item.id ?? null,
    }));

    console.log('Cart Items to adjust:', cartItems);

    try {
      setLoading(true);

      const response = await dispatch(
        adjustPortion({ recommendedCalories: targetCalories, cartItems }),
      ).unwrap();

      if (response?.adjustedItems?.length > 0) {
        console.log('Adjusted portion response:', response);
        setAdjustedPortions(response);
        navigation.navigate('MealBuilder2', { selectedItems: response });
      } else {
        alert(
          'Adjustment Error',
          'Could not adjust portions. Please try again.',
        );
      }
    } catch (error) {
      console.warn('Adjustment failed:', error);
      alert('Error', 'Something went wrong while adjusting portions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screenRoot} edges={['bottom', 'left', 'right']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      {AlertComponent}
      <ScrollView style={styles.scroll}>
        <ImageBackground
          style={[
            styles.backgroundImage,
            {
              paddingTop:
                insets.top +
                (Platform.OS === 'ios' ? hp(2) : hp(1)),
              minHeight: hp(24) + insets.top,
            },
          ]}
          source={Images.BACKGROUND_IMAGE_NUTRITION}
          resizeMode="cover"
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

          <View style={styles.headerRow}>
            <View style={styles.headerRowLeft}>
              <Text style={styles.itemsSelectedText} numberOfLines={1}>
                {selectedItems.length} items selected
              </Text>
            </View>
            {selectedItems.length > maxAllowed && (
              <View style={styles.warningRow}>
                <Image style={styles.warningIcon} source={Images.WARNING} />
                <Text style={styles.warningText}>max 4 allowed</Text>
              </View>
            )}
          </View>
        </ImageBackground>

        {selectedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Image source={Images.EMPTY_CART} style={styles.emptyImage} />
            <Text style={styles.emptyText}>No items selected.</Text>
          </View>
        ) : null}

        <View style={styles.contentWrap}>
          <FlatList
            data={selectedItems}
            keyExtractor={(item, index) =>
              String(item?.id ?? item?.dishname ?? index)
            }
            renderItem={({ item }) => (
              <View style={styles.dishCard}>
                <View style={styles.dishRow}>
                  <View style={styles.dishDot} />
                  <View style={styles.dishInfo}>
                    <Text style={styles.dishName}>{item?.dishname}</Text>
                    <Text style={styles.dishCal}>{item?.calories} cal</Text>
                  </View>
                </View>

                <View style={styles.portionRow}>
                  <TouchableOpacity
                    onPress={() => decrement(item?.id)}
                    style={styles.portionBtn}
                  >
                    <Text style={styles.portionBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.countText}>{item.count}</Text>
                  <TouchableOpacity
                    onPress={() => increment(item.id)}
                    style={styles.portionBtn}
                  >
                    <Text style={styles.portionBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          {selectedItems?.length > 0 && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>
                Total Calories:{' '}
                <Text style={styles.summaryBold}>{totalCalories}</Text>
              </Text>
              {totalCalories > TargetCalories && (
                <Text style={styles.extraText}>
                  Extra: {totalCalories - TargetCalories} calories
                </Text>
              )}
              {selectedItems?.length < 2 && (
                <Text style={styles.noteText}>
                  Note: Balance your meal by adding more dishes
                </Text>
              )}
            </View>
          )}

          {selectedItems?.length > 0 && (
            <TouchableOpacity
              onPress={handleAdjustPortions}
              style={styles.adjustButton}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.adjustButtonText}>Adjust Portions</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        <LimitExceededModal
          visible={showLimitModal}
          onClose={() => setShowLimitModal(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (c, isDark) => StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: c.surface },
  scroll: { flex: 1, backgroundColor: c.surface },
  backgroundImage: {
    minHeight: hp(24),
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
    borderBottomWidth: 1,
    borderColor: c.border,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: isDark
      ? 'rgba(255, 255, 255, 0.42)'
      : 'rgba(255, 255, 255, 0.45)',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    resizeMode: 'contain',
    height: hp(3.5),
    width: wp(4),
    tintColor: c.navIconTint,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: c.text,
    letterSpacing: 0.2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(2),
    paddingHorizontal: hp(1),
  },
  headerRowLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: wp(2),
  },
  itemsSelectedText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.text,
    letterSpacing: 0.2,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  warningIcon: {
    width: wp(5),
    height: hp(2.5),
    marginRight: wp(1.5),
    resizeMode: 'contain',
  },
  warningText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#DC2626',
    letterSpacing: 0.2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: hp(50),
  },
  emptyImage: {
    resizeMode: 'contain',
    height: hp(20),
    width: hp(20),
    marginBottom: hp(2),
  },
  emptyText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: isDark ? '#FFFFFF' : c.onboardingSubtitle,
    letterSpacing: 0.2,
  },
  contentWrap: {
    flex: 1,
    backgroundColor: c.surface,
    padding: wp(4),
    paddingBottom: hp(6),
  },
  dishCard: {
    marginHorizontal: hp(1),
    backgroundColor: c.card,
    padding: hp(2),
    borderRadius: 12,
    marginVertical: hp(0.75),
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && { elevation: 1 }),
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dishDot: {
    height: hp(1.5),
    width: hp(1.5),
    borderRadius: hp(0.75),
    backgroundColor: 'red',
    marginRight: wp(3),
  },
  dishInfo: { flex: 1 },
  dishName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: c.text,
    letterSpacing: 0.2,
  },
  dishCal: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: isDark ? '#FFFFFF' : c.onboardingSubtitle,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1.5),
    marginLeft: hp(0.5),
  },
  portionBtn: {
    height: hp(3.5),
    width: hp(3.5),
    borderRadius: hp(1.75),
    backgroundColor: c.mutedSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionBtnText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: c.primary,
  },
  countText: {
    fontFamily: 'Poppins-Medium',
    marginHorizontal: wp(3),
    fontSize: 16,
    color: c.text,
  },
  summaryBox: {
    padding: hp(2),
    borderTopWidth: 1,
    borderColor: c.border,
    marginTop: hp(1),
    alignItems: 'flex-end',
  },
  summaryText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: isDark ? '#FFFFFF' : c.onboardingSubtitle,
    letterSpacing: 0.2,
  },
  summaryBold: {
    fontFamily: 'Poppins-Medium',
    color: c.text,
  },
  extraText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#DC2626',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  noteText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#DC2626',
    marginTop: hp(0.5),
    letterSpacing: 0.2,
  },
  adjustButton: {
    backgroundColor: c.primary,
    marginHorizontal: wp(10),
    marginTop: hp(2),
    paddingVertical: hp(1.5),
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && { elevation: 2 }),
  },
  adjustButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: c.onPrimary,
    letterSpacing: 0.3,
  },
});

export default MealBuilder1;
