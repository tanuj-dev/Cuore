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
import MealOptionCard from '../../components/MealOptionCard';

const RefreshRefuel = ({ navigation }) => {
  const mealOptions = [
    {
      title: '1/2 katori Sprouted Moong Chaat',
      details:
        'Soak 1 teaspoon of cumin seeds in water overnight and boil the next morning. Strain and drink warm',
      calories: 80,
    },
    {
      title: '1 small Baked Samosa with Chickpea filling',
      details:
        'Soak cucumber slices and fresh mint in water overnight, & drink in the morning',
      calories: 80,
    },
    {
      title: '2 tbsp Roasted Chana',
      details:
        'Soak 8-10 raisins in water overnight, & consume the water and raisins',
      calories: 60,
    },
    {
      title: '1 katori Steamed Corn with Lemon',
      details:
        'Soak a cinnamon stick in warm water overnight & drink in the morning on an empty stomach.',
      calories: 80,
    },
    {
      title: '1 Masala Boiled Egg',
      details:
        'Boil crushed fresh ginger in water, let it cool slightly, add a squeeze of lemon & drink.',
      calories: 90,
    },
    {
      title: '1/2 medium sized Sweet Potato Chaat',
      details:
        'Soak cucumber slices and fresh mint in water overnight, & drink in the morning',
      calories: 90,
    },
    {
      title: '2 Steamed Dumplings (Veggie or Tofu Filling)',
      details:
        'Soak cucumber slices and fresh mint in water overnight, & drink in the morning',
      calories: 110,
    },
    {
      title: 'Cucumber and Carrot Sticks with Yogurt Dip',
      details:
        'Soak cucumber slices and fresh mint in water overnight, & drink in the morning',
      calories: 110,
    },
  ];

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
                source={Images.CUP}
                style={styles.badgeIcon}
                resizeMode="contain"
              />
              <Text style={styles.badgeTitle}>Refresh & Refuel</Text>
            </View>
          </View>

          <Text style={styles.subtitle}>
            Daily variety leads to better results— try a new option each day.
          </Text>
        </ImageBackground>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Snack options</Text>
          {mealOptions.map((item, index) => (
            <MealOptionCard
              key={index}
              title={item.title}
              details={item.details}
              calories={item.calories}
            />
          ))}
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
    paddingVertical: hp(1),
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
});

export default RefreshRefuel;
