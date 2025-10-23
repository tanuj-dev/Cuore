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
  const { receipeData } = route?.params;
  const { ingredients, instructions } = receipeData || {};
  console.log('Received recipe data:', receipeData);
  ``;
  console.log('Recipe ingredients:', ingredients);
  console.log('Recipe instructions:', instructions);

  // console.log('Received recipe data:', receipeData);

  if (!receipeData || receipeData.message === 'Recipe not found.') {
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
              marginTop: Platform.OS == 'ios' && hp(4),
              //   paddingHorizontal: hp(1),
            }}
          >
            <TouchableOpacity onPress={() => navigation.goBack()}>
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
              <Text style={styles.sectionTitle}>Ingredients:</Text>

              {ingredients?.map((item, index) => (
                <Text key={index} style={styles.text}>
                  • {item?.quantity} {item?.unit} {item?.name}
                </Text>
              ))}
            </View>
            <Text style={[styles.sectionTitle, { marginTop: hp(3) }]}>
              Instructions:
            </Text>
            {instructions?.map((step, index) => (
              <View key={index}>
                {step?.heading == 'Instructions' ? null : (
                  <Text
                    style={{
                      marginVertical: hp(1),
                      fontWeight: 'bold',
                      color: '#1E64AC',
                    }}
                  >
                    {step?.heading}
                  </Text>
                )}

                {step?.steps.map((subStep, subIndex) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      // alignItems: 'center',
                      // justifyContent: 'center',
                    }}
                    key={subIndex + 100}
                  >
                    <Text key={subIndex + 8} style={styles.text}>
                      {`${subIndex + 1} `}
                    </Text>
                    <Text
                      key={subIndex + 3}
                      style={[styles.text, { width: wp(80) }]}
                    >
                      {`${subStep}`}
                    </Text>
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
    fontFamily: 'Roboto-Regular',
    color: '#4B5563',
    // marginBottom: hp(2),
    fontWeight: '400',
  },
  card: {
    padding: wp(4),
    backgroundColor: '#FFFFFF',
    borderRadius: wp(2),
    marginTop: hp(2),
    borderLeftWidth: 4,
    borderColor: '#17AD8D',
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
    fontWeight: 'bold',
    marginBottom: hp(2),
    fontFamily: 'Roboto-Regular',
  },
  text: {
    // width: '100%',
    fontSize: 14.5,
    marginBottom: hp(0.5),
    fontFamily: 'Roboto-Regular',
    color: '#1E64AC',
    fontWeight: '400',
  },
  controls: {
    marginTop: hp(3),
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(5),
  },
  iconWrap: {
    backgroundColor: '#1E64AC',
    padding: wp(3),
    borderRadius: wp(10),
  },
});

export default Recipe;
