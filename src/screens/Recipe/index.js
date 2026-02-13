import React from 'react';
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

const Recipe = ({ navigation, route }) => {
  const recipeData = route?.params?.recipeData;
  const { ingredients, instructions } = recipeData || {};

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
          We couldn’t find a recipe for this particular dish. Please try another
          one or check back later.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.screen}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Image source={Images.BACK_BUTTON} style={styles.backIcon} />
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          <Text style={styles.measurements}>
            1 katori = 150ml, 1 Cup = 200ml, 1 Bowl = 300ml
          </Text>
          <View style={styles.card}>
            <View>
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeTitle}>{recipeData?.name}</Text>

                <View style={styles.timeContainer}>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeLabel}>Prep</Text>
                    <Text style={styles.timeValue}>
                      {recipeData?.prepTime ?? '5 mins'}
                    </Text>
                  </View>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeLabel}>Cook</Text>
                    <Text style={styles.timeValue}>
                      {recipeData?.cookTime ?? '10 mins'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Ingredients:</Text>

              {ingredients?.map((item, index) => (
                <View key={`ingredient-${index}`} style={styles.ingredientRow}>
                  <View
                    key={`substep-${index}-${item?.name}`}
                    style={styles.stepRow}
                  >
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>{index + 1}</Text>
                    </View>
                  </View>
                  <Text style={styles.ingredientText}>
                    {item?.quantity} {item?.unit} {item?.name}
                  </Text>
                </View>
              ))}
            </View>
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

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: hp(2),
    marginTop: Platform.OS === 'ios' ? hp(4) : hp(1.5),
    backgroundColor: '#F8FAFC',
  },
  backButton: {
    paddingVertical: hp(0.5),
  },
  backIcon: {
    height: hp(3.5),
    width: wp(4),
    resizeMode: 'contain',
    tintColor: '#1E293B',
  },
  emptyScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    backgroundColor: '#F8FAFC',
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: '#11418A',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  emptyMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  container: {
    padding: wp(4),
    paddingBottom: hp(6),
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  measurements: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#475569',
    letterSpacing: 0.2,
  },
  card: {
    padding: wp(4),
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: hp(2),
    borderLeftWidth: 4,
    borderLeftColor: '#11418A',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && { elevation: 1 }),
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    marginBottom: hp(2),
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  sectionTitleSpaced: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    marginBottom: hp(2),
    marginTop: hp(3),
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  stepSection: {
    marginBottom: hp(3),
  },
  recipeHeader: {
    alignItems: 'center',
    marginBottom: hp(3),
  },
  recipeTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Medium',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: hp(1),
    letterSpacing: 0.2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(10),
    marginTop: hp(1),
  },
  timeBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#11418A',
    marginBottom: hp(0.5),
    letterSpacing: 0.2,
  },
  timeValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  stepHeading: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#11418A',
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
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    marginRight: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    letterSpacing: 0.2,
  },
  stepText: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    lineHeight: 22,
    letterSpacing: 0.2,
    minWidth: 0,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1),
  },
  ingredientText: {
    fontSize: 14.5,
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    lineHeight: 22,
    flex: 1,
    minWidth: 0,
    letterSpacing: 0.2,
  },
});

export default Recipe;
