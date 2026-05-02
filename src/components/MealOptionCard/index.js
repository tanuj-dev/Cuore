import React, { useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { wp, hp } from '../../utilities';

const MealOptionCard = ({ title, details, calories, style }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <Text style={styles.mealTitle}>{title}</Text>
        <View style={styles.kcalPill}>
          <Text style={styles.kcalText}>⚡ {calories} kcal</Text>
        </View>
      </View>
      <Text style={styles.detail}>{details}</Text>
    </View>
  );
};

const createStyles = c => StyleSheet.create({
  card: {
    backgroundColor: c.card,
    borderRadius: 16,
    padding: wp(4),
    paddingVertical: hp(1.5),
    marginBottom: hp(1.8),
    borderLeftWidth: 1,
    borderLeftColor: '#17AD8D',
    ...Platform.select({
      android: { elevation: 1.5 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: hp(0.8),
    columnGap: wp(2),
  },
  kcalPill: {
    backgroundColor: '#ECFDF5',
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(3),
    borderRadius: 12,
    flexShrink: 0,
  },
  kcalText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#059669',
    letterSpacing: 0.2,
  },
  mealTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: c.text,
    flex: 1,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  detail: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: c.subText,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
});

export default MealOptionCard;
