import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ChefHat, Timer, Flame, Info } from 'lucide-react-native';
import { hp } from '../../utilities';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';

const DIET_COLORS = {
  'Non-Veg': { bg: '#FEE2E2', text: '#991B1B' },
  Eggetarian: { bg: '#FEF9C3', text: '#A16207' },
  Veg: { bg: '#DCFCE7', text: '#166534' },
};

const Recipe = ({ navigation, route }) => {
  const recipeData = route?.params?.recipeData;
  useLightStatusBar();
  const { ingredients, instructions } = recipeData || {};

  const dietPref = recipeData?.dietPreference;
  const badgeColors = DIET_COLORS[dietPref] || DIET_COLORS['Veg'];

  const goBack = () => navigation.goBack();

  if (!recipeData || recipeData.message === 'Recipe not found.') {
    return (
      <View style={styles.screen}>
        <HeroHeader title="Recipe" onBack={goBack} />
        <View style={styles.emptyScreen}>
          <View style={styles.emptyTile}>
            <ChefHat size={30} color="#1E64AC" />
          </View>
          <Text style={styles.emptyTitle}>No recipe found</Text>
          <Text style={styles.emptyMessage}>
            We couldn't find a recipe for this dish. Please try another one or
            check back later.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <HeroHeader title="Recipe" onBack={goBack}>
        <Text style={styles.heroTitle}>{recipeData?.name}</Text>
        {dietPref ? (
          <View style={[styles.dietBadge, { backgroundColor: badgeColors.bg }]}>
            <Text style={[styles.dietBadgeText, { color: badgeColors.text }]}>
              {dietPref === 'Eggetarian' ? 'Egg' : dietPref}
            </Text>
          </View>
        ) : null}
      </HeroHeader>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={[styles.statTile, { backgroundColor: '#DBEAFE' }]}>
              <Timer size={16} color="#1E64AC" />
            </View>
            <Text style={styles.statLabel}>Prep time</Text>
            <Text style={styles.statValue}>
              {recipeData?.prepTime?.replace(/\t/g, '') || 'N/A'}
            </Text>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statTile, { backgroundColor: '#FEF3C7' }]}>
              <Flame size={16} color="#B45309" />
            </View>
            <Text style={styles.statLabel}>Cook time</Text>
            <Text style={styles.statValue}>
              {recipeData?.cookTime?.replace(/\t/g, '') || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.note}>
          <Info size={15} color="#1E64AC" />
          <Text style={styles.noteText}>
            1 katori = 150ml, 1 cup = 200ml, 1 bowl = 300ml
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Ingredients</Text>
        <View style={styles.card}>
          {ingredients?.map((item, index) => (
            <View key={`ingredient-${index}`} style={styles.ingredientRow}>
              <View style={styles.dot} />
              <Text style={styles.ingredientText}>
                {item?.quantity} {item?.unit} {item?.name}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Instructions</Text>
        <View style={styles.card}>
          {instructions?.map((step, index) => (
            <View key={`step-${index}`} style={styles.stepSection}>
              {step?.heading?.toLowerCase() !== 'instructions' && (
                <Text style={styles.stepHeading}>{step.heading}</Text>
              )}
              {step?.steps?.map((subStep, subIndex) => (
                <View key={`substep-${index}-${subIndex}`} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{subIndex + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{subStep}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  scroll: { flex: 1 },
  container: { padding: 16, paddingBottom: hp(6) },
  heroTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    lineHeight: 28,
    color: '#FFFFFF',
    marginTop: 14,
  },
  dietBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 8,
  },
  dietBadgeText: { fontFamily: 'Poppins-Medium', fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  statTile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: { fontFamily: 'Poppins-Regular', fontSize: 12, color: '#64748B' },
  statValue: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#0F172A' },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  noteText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12.5,
    color: '#1E3A8A',
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#0F172A',
    marginTop: 18,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E64AC',
    marginTop: 9,
    marginRight: 12,
  },
  ingredientText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  stepSection: { marginBottom: 6 },
  stepHeading: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14.5,
    color: '#0F172A',
    marginBottom: 8,
    marginTop: 4,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  stepBadgeText: { fontFamily: 'Poppins-SemiBold', fontSize: 12, color: '#1E64AC' },
  stepText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  emptyScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTile: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default Recipe;
