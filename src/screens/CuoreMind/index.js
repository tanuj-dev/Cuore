import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {color, hp, wp, Images} from '../../utilities';
import images from '../../utilities/Images';
// import MindTab from '../../components/MindTab';
// import {Ionicons} from '@expo/vector-icons';

const Mind = ({navigation}) => {
  return (
    <View style={{flex: 1,}}>
    <View style={{   backgroundColor: '#FFFFFF',}}>  <View
        style={{
          flexDirection: 'row',
              marginTop:Platform.OS =='ios'&& hp(5),
       
          // paddingTop: hp(2),
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
        <Text style={styles.title}>Sleep & Stress</Text>
      </View></View>
      <ScrollView style={styles.container}>
        <View style={styles.scoreContainer}>
          <View style={styles.scoreBox}>
            <Image
              style={{width: wp(45), height: hp(10), resizeMode: 'cover'}}
              source={images.SCORE_METER}></Image>
            {/* <Text style={styles.scoreValue}>78</Text> */}
            <Text style={styles.scoreLabel}>Sleep Score</Text>
          </View>
          <View style={styles.scoreBox}>
            <Image
              style={{width: wp(45), height: hp(10), resizeMode: 'cover'}}
              source={images.SCORE_METER}></Image>
            {/* <Text style={styles.scoreValue}>78</Text> */}
            <Text style={styles.scoreLabel}>Stress Score</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            const STEP = 6;
            navigation.navigate('OnBoarding', {STEP});
          }}
          style={styles.reassessButton}>
          <Image
            source={Images.EDIT} // Replace with actual key in your `images` object
            style={{
              resizeMode: 'contain',
              width: wp(4),
              height: hp(2),
              marginLeft: hp(-1.8),
              // tintColor: 'white',
            }}
          />

          <Text style={styles.reassessText}>Re-assess</Text>
        </TouchableOpacity>

        <View style={styles.reflectionCard}>
          <Image
            source={Images.BRAIN} // Replace with actual key in your `images` object
            style={{
              //   marginLeft: hp(3),
              resizeMode: 'contain',
              width: wp(4),
              height: hp(2),
              // marginLeft: hp(-1.8),
              // tintColor: 'white',
            }}
          />
          <View style={{marginLeft: hp(2)}}>
            <Text style={styles.reflectionTitle}>Mindful Reflections</Text>
            <Text style={styles.reflectionQuote}>
              Let go of what was. Surrender to what is. {'\n'}Have faith in what
              will be.
            </Text>
          </View>
        </View>

        <View style={{flexDirection: 'row', backgroundColor: ''}}>
          {/* <Image
            source={Images.SUN} // Replace with actual key in your `images` object
            style={{
              //   marginLeft: hp(3),
              resizeMode: 'contain',
              width: wp(4),
              height: hp(2),
              marginLeft: hp(-1.8),
              tintColor: 'white',
            }}
          /> */}
          <Text style={[styles.sectionTitle, {}]}>
            {/* Morning Calm, Mental Clarity */}
            ☀️ Morning Calm, Mental Clarity
          </Text>
        </View>
        <ScrollView horizontal={true}>
          <View horizontal={true} style={styles.cardRow}>
            <TouchableOpacity
              // onPress={() => navigation.navigate('MindDetails')}
              style={[
                styles.activityCard,
                {
                  borderWidth: 1.5,
                  borderColor: '#3B82F6',
                  backgroundColor: '#D7DFE7',
                },
              ]}>
              <Text style={styles.cardTitle}>Body Scan</Text>
              <Text style={styles.cardDesc}>Relax & ground yourself</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('MindDetails')}
              style={[
                styles.activityCard,
                {
                  borderWidth: 1.5,
                  borderColor: '#14B8A6',
                  backgroundColor: '#D7DFE7',
                },
              ]}>
              <Text style={styles.cardTitle}>Deep Breathing</Text>
              <Text style={styles.cardDesc}>Calm the mind, boost focus</Text>
            </TouchableOpacity>
            <TouchableOpacity
              // onPress={() => navigation.navigate('MindDetails')}
              style={[
                styles.activityCard,
                {
                  borderWidth: 1.5,
                  borderColor: '#3B82F6',
                  backgroundColor: '#D7DFE7',
                },
              ]}>
              <Text style={styles.cardTitle}>Body Scan</Text>
              <Text style={styles.cardDesc}>Relax & ground yourself</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* <Card  title={'Body Scan'} subtitle={'Relax & ground yourself'} ></Card> */}

        <Text style={styles.sectionTitle}>🌙 Quiet Mind, Restful Night</Text>
        <ScrollView horizontal={true}>
          <View style={styles.cardRow}>
            <View
              style={[
                styles.activityCard,
                {
                  borderWidth: 1.5,
                  borderColor: '#A855F7',
                  backgroundColor: '#F0FDFA',
                },
              ]}>
              <Text style={styles.cardTitle}>4-7-8 Breathing</Text>
              <Text style={styles.cardDesc}>Slow down, relax deeply</Text>
            </View>
            <View
              style={[
                styles.activityCard,
                {
                  borderWidth: 1.5,
                  borderColor: '#06B6D4',
                  backgroundColor: '#ECFEFF',
                },
              ]}>
              <Text style={styles.cardTitle}>Yog Nidra</Text>
              <Text style={styles.cardDesc}>Enter deep, restful awareness</Text>
            </View>
          </View>
        </ScrollView>

        <Text style={styles.footerNote}>
          Stick to one meditation for 10–15 days to build deeper benefits
        </Text>
      </ScrollView>
      {/* <MindTab></MindTab> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: wp(4),
    backgroundColor: '#F9FAFB',
    flex: 1,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  headerText: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(5.5),
    fontWeight: 'bold',
    marginLeft: wp(2),
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: hp(2),
  },
  scoreBox: {
    alignItems: 'center',
  },
  scoreValue: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(7),
    fontWeight: 'bold',
    color: 'blue',
  },
  scoreLabel: {
    fontFamily: 'Roboto-Regular',
    marginTop: hp(0.5),
    fontSize: wp(4),
  },
  reassessButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E64AC',
    padding: hp(1.2),
    borderRadius: wp(2),
    marginVertical: hp(2),
    width: wp(50),
  },
  reassessText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontWeight: '400',
    fontSize: 14,
    marginLeft: wp(1),
  },
  reflectionCard: {
    borderLeftWidth: 4,
    borderColor: '#DEA1D7',
    flexDirection: 'row',
    // justifyContent: 'space-around',
    backgroundColor: '#F2E3F2',
    padding: hp(1),
    borderRadius: wp(2),
    marginBottom: hp(2),
  },
  reflectionTitle: {
    fontFamily: 'Roboto-Regular',
    color: '#1E64AC',
    fontWeight: '400',
    fontSize: 16,
    marginBottom: hp(0.5),
  },
  reflectionQuote: {
    fontFamily: 'Roboto-Regular',
    fontWeight: 400,
    fontSize: 15,
    color: '#374151',
    lineHeight: hp(2.5),
  },
  sectionTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 18,
    fontWeight: '400',
    color: '#1E64AC',
    marginBottom: hp(1),
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  activityCard: {
    flex: 1,
    backgroundColor: '#EAF5FF',
    padding: hp(1.5),
    height: hp(12),
    borderRadius: wp(2),
    marginHorizontal: wp(1),
  },
  cardTitle: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    fontSize: 14,
    color: '#111827',
    marginBottom: hp(0.5),
  },
  cardDesc: {
    fontFamily: 'Roboto-Regular',
    marginTop: hp(1),
    fontWeight: '400',
    fontSize: 14,
    color: '#4B5563',
  },
  footerNote: {
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    fontSize: 16,
    color: '#1E64AC',
    marginTop: hp(2),
    marginBottom: hp(5),
    fontWeight: '400',
  },
});

export default Mind;
