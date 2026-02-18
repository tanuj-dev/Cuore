import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images, hp, wp } from '../../utilities';

const CalorieIgnite = ({ navigation }) => {
  const mealOptions = [
    { title: '1 glass Apple Cider Vinegar Water', details: 'Mix 1-2 teaspoons of raw apple cider vinegar in a glass of warm water & drink.', calories: 2 },
    { title: '1 glass Soaked Cinnamon Water', details: 'Soak a cinnamon stick in warm water overnight & drink in the morning on an empty stomach.', calories: 3 },
    { title: '1 glass Green Tea with Turmeric', details: 'Brew green tea, add a pinch of turmeric powder, and drink warm.', calories: 4 },
    { title: '1 glass Soaked Tulsi Water', details: 'Soak a few fresh tulsi leaves in water overnight, warm it slightly & drink in the morning.', calories: 4 },
    { title: '1 glass Soaked Jeera Water', details: 'Soak 1 teaspoon of cumin seeds in water overnight. Boil the next morning, strain & drink warm.', calories: 8 },
    { title: '1 glass Soaked Ajwain Water', details: 'Soak 1 teaspoon of ajwain seeds in water overnight, strain & drink in the morning.', calories: 8 },
    { title: '1 glass Soaked Methi Water', details: 'Soak 1 teaspoon of methi seeds in water overnight & drink the water on an empty stomach.', calories: 12 },
    { title: '1 glass Cucumber Mint Infusion', details: 'Soak cucumber slices and fresh mint leaves in water overnight & drink in the morning.', calories: 12 },
    { title: '1 glass Lemon Honey Water', details: 'Mix fresh lemon juice and a dash of honey in warm water & drink on an empty stomach.', calories: 15 },
    { title: '1 glass Soaked Flaxseed Water', details: 'Soak 1 teaspoon of flaxseeds in water overnight & consume both the water and flaxseeds.', calories: 15 },
    { title: '1 glass Soaked Raisin Water', details: 'Soak 8-10 raisins in water overnight & consume both the water and raisins in the morning.', calories: 16 },
    { title: '1 glass Ginger Lemon Water', details: 'Boil crushed fresh ginger in water, let it cool slightly, add a squeeze of lemon & drink.', calories: 18 },
    { title: '1 glass Amla Water', details: 'Mix 1 teaspoon of amla juice in water & drink fresh in the morning.', calories: 20 },
    { title: '1 glass Lemon and Chia Seed Water', details: 'Soak 1 teaspoon of chia seeds in a glass of water with lemon juice for 10 minutes & drink.', calories: 25 },
    { title: '1 glass Beetroot Water', details: 'Blend 1 beetroot with water, strain the juice & drink fresh.', calories: 35 },
  ];

  const renderMealCard = (item, index) => (
    <View key={index} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.kcalPill}>
          <Text style={styles.kcalText}>⚡ {item.calories} kcal</Text>
        </View>
      </View>
      <Text style={styles.mealTitle}>{item.title}</Text>
      <Text style={styles.detail}>{item.details}</Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          style={styles.headerImage}
          source={Images.BACKGROUND_IMAGE_NUTRITION}
          imageStyle={styles.headerImageStyle}
        >
          <TouchableOpacity
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Image
              source={Images.BACK_BUTTON}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.badgeWrapper}>
            <View style={styles.badge}>
              <Image source={Images.WHITE_FIRE} style={styles.badgeIcon} resizeMode="contain" />
              <Text style={styles.badgeTitle}>Calorie Ignite</Text>
            </View>
          </View>

          <Text style={styles.subtitle}>
            Daily variety leads to better results— try a new option each day.
          </Text>
        </ImageBackground>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Morning drink options</Text>
          {mealOptions.map((item, index) => renderMealCard(item, index))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: hp(6),
  },
  headerImage: {
    height: hp(28),
    paddingHorizontal: wp(4),
    paddingTop: Platform.OS === 'ios' ? hp(1) : hp(2),
    justifyContent: 'flex-start',
  },
  headerImageStyle: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: hp(0.5),
  },
  backIcon: {
    height: hp(3.5),
    width: wp(5),
  },
  badgeWrapper: {
    alignItems: 'center',
    marginTop: hp(2),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#11418A',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(5),
    borderRadius: 20,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#11418A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
    }),
  },
  badgeIcon: {
    height: hp(3.5),
    width: wp(5),
    marginRight: wp(2),
  },
  badgeTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginTop: hp(2),
    paddingHorizontal: wp(4),
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  content: {
    paddingHorizontal: wp(5),
    paddingTop: hp(3),
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#1E293B',
    marginBottom: hp(2),
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: wp(4),
    marginBottom: hp(1.8),
    borderLeftWidth: 4,
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
    justifyContent: 'flex-end',
    marginBottom: hp(0.5),
  },
  kcalPill: {
    backgroundColor: '#ECFDF5',
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(3),
    borderRadius: 12,
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
    color: '#1E293B',
    marginBottom: hp(0.8),
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  detail: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
});

export default CalorieIgnite;
