import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import React, {useState} from 'react';
import {hp, wp, color, Images} from '../../utilities';
import Header from '../../components/Header'

const Tobacco = ({navigation}) => {
  const [yesterdayCount, setYesterdayCount] = useState('4');
  const [cigarettesPerDay, setCigarettesPerDay] = useState('20');
  const [yearsOfSmoking, setYearsOfSmoking] = useState('10');

  return (
    <>
    <Header
    
    title={'Cuore Tobacco'}
    navigation={navigation}
    ></Header>
      {/* <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#FFFFFF',
          paddingTop: hp(2),
          elevation: 1,
        }}>
        <TouchableOpacity
          style={{paddingHorizontal: hp(1)}}
          onPress={() => navigation.goBack()}>
          <Image
            source={Images.BACK_BUTTON} // Replace with actual key in your `images` object
            style={{
              resizeMode: 'contain',
              height: hp(3.5),
              width: wp(4),
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.title}></Text>
      </View> */}
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.box}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Image
              style={{resizeMode: 'contain', width: wp(5), height: hp(3)}}
              source={Images.WATCH}></Image>
            <Text style={styles.daysText}>2 days tobacco-free</Text>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>
              Enter number of tobacco products or cigarettes used yesterday
            </Text>
            <TextInput
              style={styles.inputSmall}
              keyboardType="numeric"
              value={yesterdayCount}
              onChangeText={setYesterdayCount}
            />
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.levelText}>Level 1</Text>
            <Image
              style={{resizeMode: 'contain', width: wp(9), height: hp(3.5)}}
              source={Images.TROPHY}></Image>
          </View>
        </View>

        <View style={styles.quoteBox}>
          <Text style={styles.quote}>
            Your body starts healing the moment you stop smoking. Every breath
            without smoke is a step toward renewal.
          </Text>
        </View>

        <View style={[styles.box, {backgroundColor: '#F5F5F5', elevation: 1}]}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontFamily: 'Roboto-Regular',
                fontSize: 20,
                fontWeight: '400',
                color: '#1E64AC',
              },
            ]}>
            Next Level Challenge
          </Text>
          <Text
            style={[
              styles.subText,
              {
                fontFamily: 'Roboto-Regular',
                fontSize: 18,
                fontWeight: '400',
                color: '#000000',
                paddingVertical: hp(1),
              },
            ]}>
            It starts now—clear the path
          </Text>
          <Text
            style={[
              styles.detailText,
              {
                fontFamily: 'Roboto-Regular',
                fontSize: 16,
                fontWeight: '400',
                color: '#000000',
              },
            ]}>
            Remove all tobacco, lighters, and reminders from your space
          </Text>
        </View>

        <View style={styles.profileBox}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontFamily: 'Roboto-Regular',
                fontSize: 18,
                fontWeight: '400',
                color: '#000000',
              },
            ]}>
            Your Smoking Profile
          </Text>

          <Text
            style={[
              styles.inputLabel,
              {
                fontFamily: 'Roboto-Regular',
                fontSize: 14,
                fontWeight: '400',
                color: '#000000',
              },
            ]}>
            Cigarettes per day
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={cigarettesPerDay}
            onChangeText={setCigarettesPerDay}
          />

          <Text style={[styles.inputLabel, {marginVertical: hp(2)}]}>
            Years of smoking
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={yearsOfSmoking}
            onChangeText={setYearsOfSmoking}
          />
        </View>

        <View style={styles.gridContainer}>
          <View style={styles.gridBox}>
            <Image
              style={{
                resizeMode: 'contain',
                width: wp(5),
                height: hp(4),
                alignSelf: 'flex-start',
              }}
              source={Images.SOIL_WATCH}></Image>
            <Text style={styles.gridLabel}>Years Lost</Text>
            <Text style={styles.gridValueRed}>5 years</Text>
          </View>

          <View style={styles.gridBox}>
            <Image
              style={{
                resizeMode: 'contain',
                width: wp(5),
                height: hp(4),
                alignSelf: 'flex-start',
              }}
              source={Images.COIN}></Image>
            <Text style={styles.gridLabel}>Money Spent</Text>
            <Text style={styles.gridValue}>₹1,73,000</Text>
          </View>
        </View>

        <Text
          style={[
            styles.sectionTitle,
            {
              fontFamily: 'Roboto-Regular',
              fontSize: 18,
              fontWeight: '500',
              color: '#1E64AC',
            },
          ]}>
          Benefits of Quitting Now
        </Text>

        <View style={styles.gridContainer}>
          <View style={styles.gridBox}>
            <Image
              style={{
                resizeMode: 'contain',
                width: wp(5),
                height: hp(4),
                alignSelf: 'flex-start',
              }}
              source={Images.HEART}></Image>
            <Text style={styles.gridLabel}>Years Saved</Text>
            <Text style={styles.gridValue}>5 years</Text>
          </View>

          <View style={styles.gridBox}>
            <Image
              style={{
                resizeMode: 'contain',
                width: wp(5),
                height: hp(4),
                alignSelf: 'flex-start',
              }}
              source={Images.PIGIBACK}></Image>
            <Text style={styles.gridLabel}>Money Saved</Text>
            <Text style={styles.gridValue}>₹3,75,000</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: wp(4),
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontFamily: 'Roboto-Regular',
    marginTop: hp(1),
    marginLeft: hp(12),
    fontSize: 20,
    fontWeight: '400',
    marginBottom: hp(2),
    alignSelf: 'center',
    color: '#000000',
  },
  box: {
    backgroundColor: '#F5F5F5',
    padding: wp(4),
    borderRadius: wp(2),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  daysText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    marginLeft: hp(1),
    fontWeight: '400',
    // marginBottom: hp(1.5),
    color: '#000000',
  },
  inputRow: {
    paddingVertical: hp(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
    flexWrap: 'wrap',
  },
  label: {
    fontFamily: 'Roboto-Regular',
    flex: 1,
    fontWeight: '400',
    fontSize: 15,
    color: '#374151',
    marginRight: wp(3),
  },
  inputSmall: {
    backgroundColor: '#F3DCDC',
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    width: wp(15),
    textAlign: 'center',
    fontWeight: '600',
    color: '#000',
  },
  levelText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#000000',
    fontWeight: '400',
  },
  quoteBox: {
    borderLeftWidth: 3,
    borderColor: '#7D7D7E',
    backgroundColor: '#F3E7F3',
    padding: wp(4),
    borderRadius: wp(2),
    marginBottom: hp(2),
  },
  quote: {
    fontFamily: 'Roboto-Regular',
    fontSize: 15,
    color: '#374151',
    fontWeight: '400',
  },
  sectionTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(2),
    fontWeight: '600',
    color: '#1D4ED8',
    marginBottom: hp(1),
  },
  subText: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(1.7),
    fontWeight: '500',
    color: '#111827',
    marginBottom: hp(0.5),
  },
  detailText: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(1.6),
    color: '#4B5563',
  },
  profileBox: {
    backgroundColor: '#D5DADF',
    padding: wp(4),
    borderRadius: wp(2),
    marginBottom: hp(2),
  },
  inputLabel: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(1.6),
    color: '#111827',
    marginTop: hp(1.2),
    marginBottom: hp(0.5),
  },
  input: {
    fontFamily: 'Roboto-Regular',
    backgroundColor: '#fff',
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
    color: '#000000',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  gridBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: wp(4),
    borderRadius: wp(2),
    marginRight: wp(2),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gridIcon: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(2.5),
    marginBottom: hp(0.5),
  },
  gridLabel: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#374151',
    paddingVertical: hp(1),
    fontWeight: 400,
  },
  gridValue: {
    fontFamily: 'Roboto-Regular',
    fontSize: 20,
    fontWeight: '400',
    color: '#000000',
  },
  gridValueRed: {
    fontFamily: 'Roboto-Regular',
    fontSize: 20,
    fontWeight: '400',
    color: '#DC2626',
  },
});

export default Tobacco;
