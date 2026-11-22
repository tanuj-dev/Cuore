import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Minus,
  Plus,
  ShoppingCart,
  TriangleAlert,
  Scale,
} from 'lucide-react-native';
import { hp } from '../../utilities';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
import LimitExceededModal from '../../components/LimitExceedModa';
import { useDispatch } from 'react-redux';
import { adjustPortion } from '../../redux/slices';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const MealBuilder1 = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();
  useLightStatusBar();
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
    <>
      {AlertComponent}
      <View style={styles.screen}>
        <HeroHeader
          title="Your Plate"
          subtitle="Set portions, then let Cuore balance them."
          onBack={() => navigation.goBack()}
        >
          <View style={styles.headerRow}>
            <View style={styles.countPill}>
              <ShoppingCart size={14} color="#FFFFFF" />
              <Text style={styles.countPillText} numberOfLines={1}>
                {selectedItems.length} items selected
              </Text>
            </View>
            {selectedItems.length > maxAllowed && (
              <View style={styles.warningPill}>
                <TriangleAlert size={13} color="#B45309" />
                <Text style={styles.warningText}>Max 4 allowed</Text>
              </View>
            )}
          </View>
        </HeroHeader>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.contentWrap}
          contentInsetAdjustmentBehavior="never"
        >
          {selectedItems.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyTile}>
                <ShoppingCart size={28} color="#1E64AC" />
              </View>
              <Text style={styles.emptyText}>No items selected.</Text>
            </View>
          ) : null}

          <FlatList
            data={selectedItems}
            scrollEnabled={false}
            keyExtractor={(item, index) =>
              String(item?.id ?? item?.dishname ?? index)
            }
            renderItem={({ item }) => (
              <View style={styles.dishCard}>
                <View style={styles.dishInfo}>
                  <Text style={styles.dishName}>{item?.dishname}</Text>
                  <Text style={styles.dishCal}>{item?.calories} cal</Text>
                </View>

                <View style={styles.portionRow}>
                  <TouchableOpacity
                    onPress={() => decrement(item?.id)}
                    style={styles.portionBtn}
                    accessibilityLabel="Remove one portion"
                  >
                    <Minus size={16} color="#1E64AC" />
                  </TouchableOpacity>
                  <Text style={styles.countText}>{item.count}</Text>
                  <TouchableOpacity
                    onPress={() => increment(item.id)}
                    style={[styles.portionBtn, styles.portionBtnFilled]}
                    accessibilityLabel="Add one portion"
                  >
                    <Plus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          {selectedItems?.length > 0 && (
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total calories</Text>
                <Text style={styles.summaryBold}>{totalCalories} kcal</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Target</Text>
                <Text style={styles.summaryValue}>{TargetCalories} kcal</Text>
              </View>
              {totalCalories > TargetCalories && (
                <Text style={styles.extraText}>
                  {totalCalories - TargetCalories} kcal over your target
                </Text>
              )}
              {selectedItems?.length < 2 && (
                <Text style={styles.noteText}>
                  Balance your meal by adding more dishes.
                </Text>
              )}
            </View>
          )}

          {selectedItems?.length > 0 && (
            <TouchableOpacity
              onPress={handleAdjustPortions}
              style={styles.adjustButton}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Scale size={18} color="#FFFFFF" />
                  <Text style={styles.adjustButtonText}>Adjust Portions</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
        <LimitExceededModal
          visible={showLimitModal}
          onClose={() => setShowLimitModal(false)}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  scroll: { flex: 1 },
  contentWrap: { padding: 16, paddingBottom: hp(6) },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countPillText: { fontFamily: 'Poppins-Medium', fontSize: 13, color: '#FFFFFF' },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  warningText: { fontFamily: 'Poppins-Medium', fontSize: 12.5, color: '#B45309' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTile: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: { fontFamily: 'Poppins-Medium', fontSize: 15, color: '#475569' },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  dishInfo: { flex: 1, minWidth: 0, marginRight: 10 },
  dishName: { fontFamily: 'Poppins-Medium', fontSize: 14, color: '#0F172A' },
  dishCal: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  portionRow: { flexDirection: 'row', alignItems: 'center' },
  portionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E64AC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  portionBtnFilled: { backgroundColor: '#1E64AC' },
  countText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#0F172A',
    minWidth: 32,
    textAlign: 'center',
  },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  summaryLabel: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#475569' },
  summaryValue: { fontFamily: 'Poppins-Medium', fontSize: 14, color: '#0F172A' },
  summaryBold: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#0F172A' },
  extraText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#DC2626',
    marginTop: 8,
  },
  noteText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#B45309',
    marginTop: 8,
  },
  adjustButton: {
    flexDirection: 'row',
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1E64AC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  adjustButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});

export default MealBuilder1;
