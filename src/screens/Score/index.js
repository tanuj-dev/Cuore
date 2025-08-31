import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {hp, wp, Images, color} from '../../utilities';

// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Score = ({navigation}) => {
  return (
    <ScrollView style={styles.container}>
      <View style={{backgroundColor: '#FFFFFF', elevation: 1}}>
        <View
          style={{
            flexDirection: 'row',
            // backgroundColor: 'red',
             marginTop:Platform.OS =='ios'&& hp(4),
            justifyContent: 'space-between',
            padding: hp(1),
          }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{   }}>
            <Image
              source={Images.BACK_BUTTON} // Replace with actual key in your `images` object
              style={{
                resizeMode: 'contain',
                height: hp(3.5),
                width: wp(4),
                marginLeft: hp(1.5),
                tintColor: '#000000',
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Image
              source={Images.SHARE_4} // Replace with actual key in your `images` object
              style={{
                resizeMode: 'contain',
                height: hp(2),
                tintColor: 'black',
                // marginLeft: hp(-1.8),
              }}
              resizeMode="contain"
            />
            <Image
              source={Images.UNCLE} // Replace with actual key in your `images` object
              style={{
                // tintColor: 'red',
                width: wp(9),
                resizeMode: 'cover',
                height: hp(3),
                // marginLeft: hp(-1.8),
              }}
              resizeMode="contain"
            />
          </View>
        </View>
        <View style={styles.header}>
          <Text style={styles.date}>Feb 25, 2025</Text>
          <Text style={styles.title}>Cuore Score</Text>
          <View style={styles.avatarWrapper}>
            <Image source={Images.avatar} style={styles.avatar} />
          </View>
        </View>
      </View>

      <View style={styles.scoreCard}>
        <Image source={Images.SCORE_METER_1} style={styles.meter} />
        {/* <Text style={styles.score}>78</Text> */}
        <Text style={styles.timeToTarget}>Estimated Time to Target</Text>
        <View style={{flexDirection: 'row'}}>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 17,
              color: '#1E64AC',
              fontWeight: '500',
            }}>
            7
          </Text>
          <Text style={styles.months}> months</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('OnBoarding')}
          style={styles.reassessButton}>
          <Image
            source={Images.EDIT} // Replace with actual key in your `images` object
            style={{
              resizeMode: 'contain',
              height: hp(2),

              marginLeft: hp(2),
            }}
          />

          <Text style={styles.reassessText}>Re-assess</Text>
        </TouchableOpacity>
        <Text style={styles.reassessNote}>
          As your health evolves, so should your plan Re-assess monthly
        </Text>
      </View>

      <View style={styles.row}>
        <InfoCard label="Metabolic Age" value="38 years" subText="+4 years" />
        <InfoCard label="Weight" value="74 kg" subText="Target: 68" />
      </View>
      <View style={styles.row}>
        <InfoCard label="BMI" value="26.4" subText="Target: 23" />
        <InfoCard label="Lifestyle" value="63%" subText="Target: >75%" />
      </View>

      <View style={styles.row}>
        <InfoCard label="Recommended Calories" value="1600 kcal" />
        <InfoCard label="Recommended Exercise" value="30 min" />
      </View>
      <View
        style={{
          marginTop: hp(1),
          marginHorizontal: hp(1.5),
          elevation: 2,
          backgroundColor: 'white',
        }}>
        <VitalCard
          label="Resting BP"
          hint=""
          value="135/85"
          target="120/80"
          colorCode="yellow"
        />
        <VitalCard
          label="Blood Sugar "
          hint="(Fasting)"
          value="110"
          target="<160"
          colorCode="green"
        />
        <View style={{marginVertical: hp(2)}}>
          <VitalCard
            label="Blood Sugar "
            hint="(After Meal)"
            value="180"
            target="<180"
            colorCode="green"
          />
        </View>

        <VitalCard
          label="Cholesterol "
          hint="(TG/HDL)"
          value="3.3"
          target="2.5"
          colorCode="yellow"
        />
        <VitalCard
          label="Body Fat%"
          hint=""
          value="28%"
          target="23%"
          colorCode="red"
        />
        <View style={styles.focusRow}>
          <Text style={styles.focusLabel}>Main Focus</Text>
          <View style={styles.focusTags}>
            <Text style={styles.focusTag}>Nutrition</Text>
            <Text style={styles.focusTag}>Tobacco Cessation</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('Checkout')}
        style={styles.continueButton}>
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
      {/* <View
        style={{
          zIndex: 10000,
          // backgroundColor: 'red',
          // width: '100%',
          // position: 'absolute',
          flexDirection: 'row',
          flex: 1,
          justifyContent: 'space-between',
          borderTopWidth: 1,
          bottom: hp(3.5),
          paddingTop: hp(1),
          borderColor: '#E5E7EB',
          paddingHorizontal: hp(3),
        }}>
        <View style={{alignItems: 'center'}}>
          <Image
            style={{height: hp(3), width: wp(5), tintColor: '#9CA3AF'}}
            source={Images.HOME}></Image>
          <Text style={styles.bottomText}>home</Text>
        </View>
        <View style={{alignItems: 'center'}}>
          <Image
            style={{height: hp(3), width: wp(5), tintColor: '#9CA3AF'}}
            source={Images.EXPLORE}></Image>
          <Text style={styles.bottomText}>Explore</Text>
        </View>
        <View style={{alignItems: 'center'}}>
          <Image
            style={{height: hp(3), width: wp(5), tintColor: '#9CA3AF'}}
            source={Images.PREDICT}></Image>
          <Text style={styles.bottomText}>Predict</Text>
        </View>
        <View style={{alignItems: 'center'}}>
          <Image
            style={{height: hp(3), width: wp(5), tintColor: '#9CA3AF'}}
            source={Images.CHAT}></Image>
          <Text style={styles.bottomText}>Chat</Text>
        </View>
        <View style={{alignItems: 'center'}}>
          <Image
            style={{height: hp(3), width: wp(5), tintColor: '#9CA3AF'}}
            source={Images.PROFILE}></Image>
          <Text style={styles.bottomText}>Profile</Text>
        </View>
      </View> */}
    </ScrollView>
  );
};

const InfoCard = ({label, value, subText}) => (
  <View style={styles.infoCard}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>

    {subText && <Text style={styles.infoSub}>{subText}</Text>}
  </View>
);

const VitalCard = ({label, value, target, colorCode, hint}) => (
  <View style={styles.vitalCard}>
    <View style={styles.vitalRow}>
      <View
        style={{
          width: wp(25),
          // backgroundColor: 'yellow',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text
          style={[styles.vitalLabel, {marginTop: hint == '' ? hp(2) : hp(0)}]}>
          {label}
        </Text>
        <Text style={styles.vitalLabel}>{hint}</Text>
      </View>
      <View
        style={{
          // backgroundColor: 'red',
          width: wp(20),
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={styles.vitalValue}>{value}</Text>
      </View>
      <View style={{flexDirection: 'row', width: hp(22)}}>
        <View style={[styles.vitalBar, styles[colorCode]]} />

        <Text style={styles.vitalTarget}>{target}</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  header: {
    padding: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.5),
    color: '#6B7280',
    marginBottom: hp(3),
  },
  title: {
    fontFamily: 'Roboto-Regular',
    marginLeft: hp(-4),
    fontSize: wp(5),
    fontWeight: '400',
    marginTop: hp(2),
    color: '#000000',
  },
  avatarWrapper: {},
  avatar: {width: wp(10), height: wp(10), borderRadius: wp(5)},

  scoreCard: {
    backgroundColor: 'red',
    paddingVertical: hp(2),
    marginHorizontal: hp(1),
    backgroundColor: '#FFFFFF',
    elevation: 1,
    borderRadius: hp(1),
    alignItems: 'center',
    marginVertical: hp(2),
  },
  meter: {width: wp(70), height: wp(34), resizeMode: 'cover'},
  score: {fontSize: wp(10), fontWeight: 'bold', color: '#0047AB'},
  timeToTarget: {
    fontFamily: 'Roboto-Regular',
    fontSize: 15,
    color: 'red',
    fontWeight: '400',
    color: '#4B5563',
  },
  months: {
    fontFamily: 'Roboto-Regular',
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
  },
  reassessButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#1E64AC',
    // marginTop: hp(4),
    // paddingHorizontal: wp(30),
    paddingVertical: hp(1),
    borderRadius: wp(2),
    // marginTop: hp(2),
    marginVertical: hp(2),
    marginHorizontal: hp(2),
    width: '90%',
  },
  reassessText: {
    fontFamily: 'Roboto-Regular',
    color: '#fff',
    fontWeight: '400',
    marginRight: hp(6),
    fontSize: 15,
  },
  reassessNote: {
    fontFamily: 'Roboto-Regular',
    paddingHorizontal: hp(1),
    textAlign: 'center',
    marginTop: hp(1),
    fontSize: 16,
    color: '#1E64AC',
    fontWeight: '400',
  },
  reassessLink: {
    fontFamily: 'Roboto-Regular',
    textDecorationLine: 'underline',
    color: '#0047AB',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    marginVertical: hp(1),
  },
  infoCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    elevation: 1,
    padding: wp(3),
    borderRadius: wp(2),
    // alignItems: 'center',
    justifyContent: 'center',
  },
  infoValue: {
    fontFamily: 'Roboto-Regular',
    // marginLeft: hp(2),
    fontSize: 18,
    fontWeight: '400',
    color: '#000000',
  },
  infoLabel: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  infoSub: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#FF8D10',
    fontWeight: '400',
  },

  vitalCard: {
    justifyContent: 'center',
    // alignItems: 'center',
    // backgroundColor: 'red',
    paddingHorizontal: wp(4),
    marginVertical: hp(0.8),
  },
  vitalLabel: {
    fontFamily: 'Roboto-Regular',
    alignSelf: 'flex-start',
    fontSize: 14,
    // marginBottom: hp(0.5),
    fontWeight: 400,
    color: '#000000',
  },
  vitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vitalValue: {
    fontFamily: 'Roboto-Regular',
    marginLeft: hp(2),
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',

    alignSelf: 'flex-start',
  },
  vitalTarget: {
    fontFamily: 'Roboto-Regular',
    marginLeft: hp(1),
    fontSize: 14,
    color: '#6B7280',
  },
  vitalBar: {
    // alignSelf: 'flex-start',
    marginTop: hp(0.5),
    width: wp(25),
    height: hp(1),
    borderRadius: wp(2),
    marginHorizontal: wp(2),
  },
  green: {backgroundColor: '#4CAF50'},
  yellow: {backgroundColor: '#FFC107'},
  red: {backgroundColor: '#F44336'},

  focusRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: wp(4),
    marginVertical: hp(2),
  },
  focusLabel: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(4),
    marginBottom: hp(1),
    color: '#000000',
    fontSize: 14,
    fontWeight: '400',
  },
  focusTags: {flexDirection: 'row', gap: wp(3)},
  focusTag: {
    fontFamily: 'Roboto-Regular',
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    backgroundColor: '#D2E0EE',
    borderRadius: wp(1),
    fontSize: wp(3.5),
    color: '#B63241',
  },

  continueButton: {
    marginTop: hp(4),
    marginBottom: hp(6),
    margin: wp(4),
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1.5),
    borderRadius: wp(1),
    alignItems: 'center',
  },
  continueText: {
    fontFamily: 'Roboto-Regular',
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  bottomText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    fontFamily: 'Roboto-Regular',
  },
});

export default Score;
