import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { color, hp, wp, Images } from '../../utilities';
import images from '../../utilities/Images';
import GaugeMeter from '../../components/SpeedpMeter';
import { useSelector, useDispatch } from 'react-redux';
import { getMind } from '../../redux/slices';
import ApiErrorFallback from '../../components/ApiError';
import { SafeAreaView } from 'react-native-safe-area-context';
// import MindTab from '../../components/MindTab';
// import {Ionicons} from '@expo/vector-icons';

const Mind = ({ navigation }) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const userId = useSelector(state => state.auth.userId);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (userId) {
      dispatch(getMind(userId));
    }
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, [dispatch, userId]);

  const dispatch = useDispatch();
  const { data, loading, error } = useSelector(state => state.mind);
  const role = useSelector(state => state.auth.role);
  console.log('Mind data from Redux:', data);

  const morning = data?.data?.morningHarmony;
  const evening = data?.data?.quietMind;

  const colorSchemes = [
    {
      borderColor: '#3B82F6', // blue
      backgroundColor: '#D8E0E8',
    },
    {
      borderColor: '#14B8A6', // red
      backgroundColor: '#D8E0E7', // light yellow
    },
    {
      borderColor: '#A855F7', // green
      backgroundColor: '#F0FDFA', // light green
    },
    {
      borderColor: '#06B6D4', // yellow
      backgroundColor: '#ECFEFF', // light yellow
    },
  ];

  if (!morning && !evening) {
    return <ApiErrorFallback message="No data available" onRetry={onRefresh} />;
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flex: 1 }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            // paddingVertical: Platform.OS === 'ios' ? hp(1) : hp(1),
            // elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              // marginTop: Platform.OS == 'ios' && hp(3),
              paddingHorizontal: hp(1),
              alignItems: 'center',
              marginBottom: hp(1),
            }}
          >
            <TouchableOpacity
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              style={{ paddingHorizontal: hp(1), marginTop: hp(1) }}
              onPress={() => navigation.goBack()}
            >
              <Image
                source={Images.BACK_BUTTON} // Replace with actual key in your `images` object
                style={{
                  resizeMode: 'contain',
                  height: hp(3.5),
                  width: wp(4),
                  // marginTop: hp(),
                  // marginLeft: Platform.OS == 'ios' ? hp(1) : hp(0.2),
                }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.title}>Sleep & Stress</Text>
          </View>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.scoreContainer}>
            <View
              style={[
                styles.scoreBox,
                // {
                //   backgroundColor: 'red',
                //   borderRadius: wp(2),
                //   padding: hp(1.5),
                // },
              ]}
            >
              <GaugeMeter
                size={wp(32)}
                value={data?.data?.sleepScore}
                thickness={15}
              />
              {/* <Text style={styles.scoreValue}>78</Text> */}
              <Text style={styles.scoreLabel}>Sleep Score</Text>
            </View>
            <View style={styles.scoreBox}>
              <GaugeMeter
                size={wp(32)}
                value={data?.data?.stressScore}
                thickness={15}
              />
              {/* <Text style={styles.scoreValue}>78</Text> */}
              <Text style={styles.scoreLabel}>Stress Score</Text>
            </View>
          </View>

          <TouchableOpacity
            disabled={role == 'caregiver'}
            onPress={() => {
              const STEP = 6;
              navigation.navigate('OnBoarding', {
                STEP,
                screen: 'Reassess',
                navigateTo: 'Mind',
              });
            }}
            style={styles.reassessButton}
          >
            <Image
              source={Images.EDIT} // Replace with actual key in your `images` object
              style={{
                resizeMode: 'contain',
                width: wp(4),
                height: hp(4),
                // marginLeft: hp(-1.8),
                tintColor: 'white',
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
            <View style={{ marginLeft: hp(2) }}>
              <Text style={styles.reflectionTitle}>Mindful Reflections</Text>
              <Text style={styles.reflectionQuote}>
                Let go of what was. Surrender to what is. {'\n'}Have faith in
                what will be.
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', backgroundColor: '' }}>
            <Image
              source={Images.SUN} // Replace with actual key in your `images` object
              style={{
                //   marginLeft: hp(3),
                resizeMode: 'contain',
                width: wp(4),
                height: hp(2),
                marginLeft: hp(-1.8),
                tintColor: 'white',
              }}
            />
            <Text style={[styles.sectionTitle, {}]}>
              {/* Morning Calm, Mental Clarity */}
              ☀️ Morning Calm, Mental Clarity
            </Text>
          </View>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            >
              {morning?.map((item, index) => {
                const scheme = colorSchemes[index % colorSchemes.length];
                return (
                  <View key={index} style={styles.cardRow}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('MindDetails', {
                          instructions: item?.instructions,
                          audio: item?.audioUrl,
                        })
                      }
                      style={[
                        styles.activityCard,
                        {
                          borderWidth: 1.5,
                          borderColor: scheme.borderColor,
                          backgroundColor: scheme.backgroundColor,
                        },
                      ]}
                    >
                      <Text style={styles.cardTitle}>{item?.title}</Text>
                      <Text style={styles.cardDesc}>{item?.subtitle}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </ScrollView>

          {/* <Card  title={'Body Scan'} subtitle={'Relax & ground yourself'} ></Card> */}

          <Text style={styles.sectionTitle}>🌙 Quiet Mind, Restful Night</Text>
          <ScrollView showsHorizontalScrollIndicator={false} horizontal={true}>
            {evening?.map((item, index) => {
              const scheme = colorSchemes[index % colorSchemes.length];
              return (
                // console.log('Morning Item:', item),
                <View key={index} horizontal={true} style={styles.cardRow}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('MindDetails', {
                        instructions: item?.instructions,
                        audio: item?.audioUrl,
                      })
                    }
                    style={[
                      styles.activityCard,
                      {
                        borderWidth: 1.5,
                        borderColor: scheme.borderColor,
                        backgroundColor: scheme.backgroundColor,
                      },
                    ]}
                  >
                    <Text style={styles.cardTitle}>{item?.title}</Text>
                    <Text style={styles.cardDesc}>{item?.subtitle}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          <Text style={styles.footerNote}>
            Stick to one meditation for 21 days to unlock deeper benefits
          </Text>
        </ScrollView>
        {/* <MindTab></MindTab> */}
      </View>
    </SafeAreaView>
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
    marginLeft: hp(11),
    fontSize: 20,
    fontWeight: '400',
    // marginBottom: hp(2),
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
    // paddingVertical: hp(3),
    // marginTop: hp(30),
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
    // padding: hp(1.2),
    borderRadius: wp(2),
    marginVertical: hp(2),
    width: wp(50),
  },
  reassessText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontWeight: '800',
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
    // backgroundColor: 'red',
    // width: wp(50),
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  activityCard: {
    flex: 1,
    backgroundColor: '#EAF5FF',
    padding: hp(1.5),
    height: hp(12),
    width: wp(50),
    borderRadius: wp(2),
    marginHorizontal: wp(1),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    marginTop: hp(2),
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
