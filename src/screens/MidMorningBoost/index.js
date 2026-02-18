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

const MidMorningBoost = ({ navigation }) => {
  const mealOptions = [
    {
      title: '1 small or 1/2 of a large apple',
      details:
        'Soak 1 teaspoon of cumin seeds in water overnight and boil the next morning. Strain and drink warm.',
      calories: 75,
    },
    {
      title: '5-6 strawberries',
      details:
        'Soak cucumber slices and fresh mint in water overnight, & drink in the morning.',
      calories: 23,
    },
    {
      title: '1 cup diced muskmelon',
      details:
        'Soak 8-10 raisins in water overnight, & consume the water and raisins.',
      calories: 60,
    },
    {
      title: '1 cup diced papaya',
      details:
        'Soak a cinnamon stick in warm water overnight & drink in the morning on an empty stomach.',
      calories: 60,
    },
    {
      title: '1 medium sized orange',
      details:
        'Boil crushed fresh ginger in water, let it cool slightly, add a squeeze of lemon & drink.',
      calories: 60,
    },
    {
      title: 'Handful of grapes',
      details:
        'Soak cucumber slices and fresh mint in water overnight, & drink in the morning.',
      calories: 60,
    },
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
              <Image
                source={Images.APPLE}
                style={styles.badgeIcon}
                resizeMode="contain"
              />
              <Text style={styles.badgeTitle}>Mid Morning Boost</Text>
            </View>
          </View>

          <Text style={styles.subtitle}>
            Daily variety leads to better results— try a new option each day.
          </Text>
        </ImageBackground>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Snack options</Text>
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

export default MidMorningBoost;
