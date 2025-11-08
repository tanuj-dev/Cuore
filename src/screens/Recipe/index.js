import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Tts from 'react-native-tts';
import { hp, wp } from '../../utilities';
import { Play, Pause, StopCircle, Images } from 'lucide-react-native'; // Optional icon lib
// import {  } from 'react-native-svg';
import images from '../../utilities/Images';

const Recipe = ({ navigation, route }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  console.log('Route params in Recipe screen:', route.params);
  const { recipeData } = route.params;
  console.log('Recipe Data:', recipeData);
  const { ingredients, instructions } = recipeData || {};

  // console.log('Received recipe data:', recipeData);

  if (!recipeData || recipeData.message === 'Recipe not found.') {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
          backgroundColor: '#F9FAFB',
        }}
      >
        <Image
          source={Images.EMPTY_STATE_ICON} // Replace with your own image or icon
          style={{ width: 120, height: 120, marginBottom: 20 }}
          resizeMode="contain"
        />
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#195d9dff',
            marginBottom: 8,
          }}
        >
          No recipe found
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#6B7280',
            textAlign: 'center',
            lineHeight: 20,
            fontFamily: 'Roboto-Regular',
          }}
        >
          We couldn’t find a recipe for this particular dish. Please try another
          one or check back later.
        </Text>
      </View>
    );
  }

  const onSpeak = () => {
    Tts.stop();
    setIsSpeaking(true);
    Tts.speak('Let me tell you how to make Rava Upma.');
    recipeSteps.forEach(step => Tts.speak(step));
  };

  const onPause = () => {
    Tts.pause();
    setIsSpeaking(false);
  };

  const onStop = () => {
    Tts.stop();
    setIsSpeaking(false);
  };

  return (
    <ScrollView style={{ backgroundColor: '#F3F4F6' }}>
      <View style={{ flex: 1, backgroundColor: '' }}>
        <View style={{ backgroundColor: '#F3F4F6', padding: hp(2) }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: Platform.OS == 'ios' ? hp(4) : hp(1.5),
              //   paddingHorizontal: hp(1),
            }}
          >
            <TouchableOpacity
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              onPress={() => navigation.goBack()}
            >
              <Image
                style={{
                  height: hp(3),
                  width: wp(4),
                  resizeMode: 'contain',
                  tintColor: '#000000',
                }}
                source={images.BACK_BUTTON}
              ></Image>
            </TouchableOpacity>

            <Image
              style={{
                height: hp(3),
                width: wp(4),
                resizeMode: 'contain',
                tintColor: '#1E64AC',
              }}
              source={images.SHARE_4}
            ></Image>
          </View>

          {/* Controls */}
        </View>
        <View style={styles.container}>
          <Text style={styles.measurements}>
            1 katori = 150ml, 1 Cup = 200ml, 1 Bowl = 300ml
          </Text>
          {/* Instructions */}
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

              {/* ingredients  */}
              {ingredients?.map((item, index) => (
                <View key={`ingredient-${index}`} style={styles.ingredientRow}>
                  <View
                    key={`substep-${index}-${item.name}`}
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
            <Text style={[styles.sectionTitle, { marginTop: hp(3) }]}>
              Instructions:
            </Text>
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
  container: {
    padding: wp(4),
    backgroundColor: '#F3F4F6',
    flex: 1,
  },
  title: {
    marginTop: hp(2.4),
    fontSize: 20,
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    textAlign: 'left',
    color: '#FFFFFF',
    // marginBottom: hp(1),
  },
  measurements: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Roboto-Regular',
    color: '#4B5563',
    // marginBottom: hp(2),
    // fontWeight: '400',
  },
  card: {
    padding: wp(4),
    backgroundColor: '#FFFFFF',
    borderRadius: wp(2),
    marginTop: hp(2),
    borderLeftWidth: 4,
    borderColor: '#1E64AC',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    // marginBottom: hp(5),
    fontSize: 15,
    fontWeight: '500',
    marginBottom: hp(2),
    fontFamily: 'Roboto-Regular',
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
    fontWeight: '700',
    fontFamily: 'Roboto-Regular',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: hp(1),
  },

  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(10),
    marginTop: hp(1),
  },

  timeBadge: {
    backgroundColor: '#E0F2FE',
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: wp(2),
    alignItems: 'center',
  },

  timeLabel: {
    fontSize: 12,
    color: '#1E64AC',
    fontWeight: '600',
    marginBottom: hp(0.5),
  },

  timeValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },

  stepHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E64AC',
    marginBottom: hp(1),
    fontFamily: 'Roboto-Regular',
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1.5),
  },

  stepBadge: {
    backgroundColor: '#4c8dcfff',
    borderRadius: wp(10),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    marginRight: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },

  stepText: {
    flex: 1,
    fontSize: 14.5,
    color: '#4b6184ff',
    fontFamily: 'Roboto-Regular',
    lineHeight: 20,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1),
  },

  dot: {
    fontSize: 16,
    color: '#17AD8D',
    marginRight: wp(2),
    lineHeight: 20,
  },

  ingredientText: {
    fontSize: 14.5,
    fontFamily: 'Roboto-Regular',
    color: '#4b6184ff',
    fontWeight: '400',
    lineHeight: 20,
    flexShrink: 1,
  },
});

export default Recipe;
