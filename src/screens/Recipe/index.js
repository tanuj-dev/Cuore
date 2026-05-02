import React, { useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';

const DIET_COLORS = {
  'Non-Veg': { bg: '#FEE2E2', text: '#991B1B' },
  Eggetarian: { bg: '#FEF9C3', text: '#A16207' },
  Veg: { bg: '#DCFCE7', text: '#166534' },
};

const Recipe = ({ navigation, route }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const recipeData = route?.params?.recipeData;
  const { ingredients, instructions } = recipeData || {};

  const totalSteps =
    instructions?.reduce((acc, s) => acc + (s?.steps?.length || 0), 0) ?? 0;

  const dietPref = recipeData?.dietPreference;
  const badgeColors = DIET_COLORS[dietPref] || DIET_COLORS['Veg'];

  if (!recipeData || recipeData.message === 'Recipe not found.') {
    return (
      <View style={styles.emptyScreen}>
        <Image
          source={Images.EMPTY_CART}
          style={styles.emptyImage}
          resizeMode="contain"
        />
        <Text style={styles.emptyTitle}>No recipe found</Text>
        <Text style={styles.emptyMessage}>
          We couldn't find a recipe for this particular dish. Please try another
          one or check back later.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} bounces={false}>
      <View style={styles.screen}>
        {/* ── Hero Header ── */}
        <View style={styles.heroHeader}>
          <View style={styles.heroTopRow}>
            <TouchableOpacity
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Image source={Images.BACK_BUTTON} style={styles.backIcon} />
            </TouchableOpacity>

            {dietPref && (
              <View
                style={[styles.dietBadge, { backgroundColor: badgeColors.bg }]}
              >
                <Text
                  style={[styles.dietBadgeText, { color: badgeColors.text }]}
                >
                  {dietPref === 'Eggetarian' ? 'Egg' : dietPref}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.heroTitle}>{recipeData?.name}</Text>
          <Text style={styles.heroMeasurements}>
            1 katori = 150ml • 1 Cup = 200ml • 1 Bowl = 300ml
          </Text>
        </View>

        {/* ── Floating Stats Card ── */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Prep Time</Text>
            <Text style={styles.statValue}>
              {recipeData?.prepTime?.replace(/\t/g, '') || 'N/A'}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Cook Time</Text>
            <Text style={styles.statValue}>
              {recipeData?.cookTime?.replace(/\t/g, '') || 'N/A'}
            </Text>
          </View>
          {/* <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Ingredients</Text>
            <Text style={styles.statValue}>{ingredients?.length ?? 0}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Steps</Text>
            <Text style={styles.statValue}>{totalSteps}</Text>
          </View> */}
        </View>

        {/* ── Content ── */}
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ingredients:</Text>

            {ingredients?.map((item, index) => (
              <View key={`ingredient-${index}`} style={styles.ingredientRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{index + 1}</Text>
                </View>
                <Text style={styles.ingredientText}>
                  {item?.quantity} {item?.unit} {item?.name}
                </Text>
              </View>
            ))}

            <Text style={styles.sectionTitleSpaced}>Instructions:</Text>

            {instructions?.map((step, index) => (
              <View key={`step-${index}`} style={styles.stepSection}>
                {step?.heading?.toLowerCase() !== 'instructions' && (
                  <Text style={styles.stepHeading}>{step.heading}</Text>
                )}
                {step?.steps?.map((subStep, subIndex) => (
                  <View
                    key={`substep-${index}-${subIndex}`}
                    style={styles.stepRow}
                  >
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>{subIndex + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{subStep}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const createStyles = c => StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: c.surface,
  },
  screen: {
    flex: 1,
    backgroundColor: c.surface,
  },

  /* ── Empty State ── */
  emptyScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    backgroundColor: c.surface,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: c.primary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  emptyMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: c.subText,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.2,
  },

  /* ── Hero Header ── */
  heroHeader: {
    backgroundColor: '#11418A',
    paddingTop: Platform.OS === 'ios' ? hp(6) : hp(4),
    paddingHorizontal: wp(5),
    paddingBottom: hp(7),
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2.5),
  },
  backButton: {
    paddingVertical: hp(0.5),
  },
  backIcon: {
    height: hp(3),
    width: wp(4),
    resizeMode: 'contain',
    tintColor: c.card,
  },
  dietBadge: {
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.6),
    borderRadius: 20,
  },
  dietBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.2,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: 'Poppins-SemiBold',
    color: c.card,
    letterSpacing: 0.3,
    marginBottom: hp(1.2),
    lineHeight: 34,
  },
  heroMeasurements: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.2,
  },

  /* ── Floating Stats Card ── */
  statsCard: {
    flexDirection: 'row',
    backgroundColor: c.card,
    borderRadius: 18,
    marginHorizontal: wp(5),
    marginTop: -hp(4),
    paddingVertical: hp(2),
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: hp(4),
    backgroundColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: c.tabInactive,
    marginBottom: 3,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: c.primary,
    textAlign: 'center',
  },

  /* ── Content ── */
  container: {
    padding: wp(4),
    paddingTop: hp(2.5),
    paddingBottom: hp(6),
  },
  card: {
    padding: wp(4),
    backgroundColor: c.card,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#11418A',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: c.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && { elevation: 1 }),
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: hp(2),
    color: c.text,
    letterSpacing: 0.2,
  },
  sectionTitleSpaced: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: hp(2),
    marginTop: hp(3),
    color: c.text,
    letterSpacing: 0.2,
  },
  stepSection: {
    marginBottom: hp(2),
  },
  stepHeading: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: c.primary,
    marginBottom: hp(1),
    letterSpacing: 0.2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1.5),
  },
  stepBadge: {
    backgroundColor: '#11418A',
    borderRadius: 20,
    minWidth: wp(5.5),
    height: wp(5.5),
    marginRight: wp(2.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: c.card,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 10,
    letterSpacing: 0.2,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: c.subText,
    lineHeight: 22,
    letterSpacing: 0.2,
    minWidth: 0,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1.2),
  },
  ingredientText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: c.subText,
    lineHeight: 22,
    flex: 1,
    minWidth: 0,
    letterSpacing: 0.2,
  },
});

export default Recipe;
