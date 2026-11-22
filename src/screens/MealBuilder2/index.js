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
import { ChevronRight, UtensilsCrossed, Info, RotateCcw } from 'lucide-react-native';
import { hp } from '../../utilities';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
import { getRecipe } from '../../redux/slices';
import { useDispatch } from 'react-redux';

const MealBuilder2 = ({ navigation, route }) => {
  console.log('Route params in MealBuilder2:', route.params);

  const [loading, setLoading] = useState(false);
  useLightStatusBar();

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
    <View style={styles.screen}>
      <HeroHeader
        title="My Custom Meal"
        subtitle="Portions balanced to your calorie target."
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentWrap}
        contentInsetAdjustmentBehavior="never"
      >
        <Text style={styles.sectionTitle}>Your portions</Text>
        <FlatList
          data={data}
          scrollEnabled={false}
          keyExtractor={(item, index) =>
            String(item?.id ?? item?.name ?? index)
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleRecipePress(item?.recipeLink)}
              style={styles.itemCard}
              activeOpacity={0.7}
            >
              <View style={styles.itemTile}>
                <UtensilsCrossed size={16} color="#1E64AC" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.servingText}>
                  {item?.newServingSizeString}
                </Text>
                <Text style={styles.calText}>{item?.adjustedCalories} cal</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        />

        {selectedItems?.message ? (
          <View style={styles.note}>
            <Info size={15} color="#1E64AC" />
            <Text style={styles.noteText}>{selectedItems.message}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('MealBuilder', { mealTime: 'Breakfast' })
          }
          style={styles.clearButton}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#1E64AC" />
          ) : (
            <>
              <RotateCcw size={17} color="#1E64AC" />
              <Text style={styles.clearButtonText}>Clear Selection</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  scroll: { flex: 1 },
  contentWrap: { padding: 16, paddingBottom: hp(6) },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  itemTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: { flex: 1, minWidth: 0, marginHorizontal: 12 },
  servingText: { fontFamily: 'Poppins-Medium', fontSize: 14, color: '#0F172A' },
  calText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  noteText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#1E3A8A',
  },
  clearButton: {
    flexDirection: 'row',
    gap: 8,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E64AC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  clearButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#1E64AC',
  },
});

export default MealBuilder2;
