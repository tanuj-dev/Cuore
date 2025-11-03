import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { hp, wp, Images } from '../../utilities';
import { useSelector, useDispatch } from 'react-redux';
import { updateFitnessTime } from '../../redux/slices';
import ToastMessage from '../../components/Toast';
import ApiError from '../../components/ApiError';
import { SafeAreaView } from 'react-native-safe-area-context';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WorkoutCard = ({
  item,
  index,
  navigation,
  expandedIndex,
  setExpandedIndex,
}) => {
  const animation = useRef(new Animated.Value(0)).current;
  const isExpanded = expandedIndex === index;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const animatedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, hp(30)],
  });

  return (
    <TouchableOpacity
      // onPress={() =>

      //   setExpandedIndex(isExpanded ? null : index)}
      onPress={() =>
        navigation.navigate('FitnessDetails', {
          instruction: item?.instructions,
          data: item,
        })
      }
      style={[styles.card, { borderLeftColor: item?.color }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image
          style={{
            resizeMode: 'contain',
            height: hp(2),
            width: wp(4),
            tintColor: '#000000',
          }}
          source={Images.COIN}
        />
        <Text style={styles.cardTitle}>{item?.title}</Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: hp(0.7),
        }}
      >
        <Text style={{ fontSize: 14, color: '#374151' }}>
          Reps: {item?.reps}
        </Text>
        <Text style={{ fontSize: 14, color: '#374151' }}>
          Sets: {item?.sets}
        </Text>
      </View>
      {/* <Text style={styles.cardDetail}>
        {` Reps: ${item?.reps}       Sets: ${item?.sets}`}
      </Text> */}

      {/* <Animated.View style={{ height: animatedHeight, overflow: 'hidden' }}>
        <View style={styles.expandedContent}>
          <Image
            style={{ resizeMode: 'cover', height: hp(20), width: wp(85) }}
            source={{
              uri: 'https://img.freepik.com/premium-vector/empty-gym-with-exercise-equipment_88100-207.jpg',
            }}
          />
          <View
            style={{
              backgroundColor: '#EBEDEF',
              alignItems: 'center',
              padding: hp(1),
              marginTop: hp(2),
              borderRadius: hp(1),
              elevation: 2,
            }}
          >
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('FitnessDetails', {
                  instruction: item?.instructions,
                })
              }
              style={{
                flexDirection: 'row',
                padding: hp(1),
                backgroundColor: '#1E64AC',
                alignSelf: 'center',
                borderRadius: hp(1),
                paddingHorizontal: hp(2),
                alignItems: 'center',
              }}
            >
              <Image
                style={{
                  resizeMode: 'contain',
                  height: hp(2.5),
                  width: wp(5),
                  tintColor: '#17AD8D',
                  marginRight: hp(1),
                }}
                source={Images?.WATCH}
              />
              <Text
                style={{
                  fontFamily: 'Roboto-Regular',
                  fontSize: 15,
                  fontWeight: '400',
                  color: '#FFFFFF',
                }}
              >
                start
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View> */}
    </TouchableOpacity>
  );
};

const Fitness = ({ navigation, route }) => {
  console.log('Navigation and route props:', route);
  const todayWorkoutDay = route?.params?.initialTab || 'Wed';
  const [selectedDay, setSelectedDay] = useState(todayWorkoutDay);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [toast, setToast] = useState(null);

  const dispatch = useDispatch();

  const data = useSelector(state => state.fitness.data);
  const fitnessData = data?.schedule;

  const onChangeTime = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) setTime(selectedTime);
  };

  const handleUpdateTime = async () => {
    const formattedTime = formatTime(time);
    const formData = {
      preferred_ex_time: formattedTime,
    };
    const res = await dispatch(updateFitnessTime(formData));
    console.log('Update Time Response:', res);

    if (res?.payload?.status) {
      setToast('Preferred exercise time updated successfully!');
    } else {
      setToast('Failed to update preferred exercise time. Please try again.');
    }
  };

  useEffect(() => {
    // Any additional logic when selectedDay changes can be added here
    setTime(data?.preferredTime ? new Date(data.preferredTime) : new Date());
  }, [data]);

  const formatTime = date => {
    const hours = date.getHours();
    const mins = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHour = hours % 12 || 12;
    const formattedMin = mins < 10 ? `0${mins}` : mins;
    return `${formattedHour}:${formattedMin} ${ampm}`;
  };

  if (!fitnessData) {
    return (
      <ApiError
        message="No fitness data available at the moment."
        onRetry={() => {
          // Retry logic can be added here
        }}
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#FFFFFF' }}
        nestedScrollEnabled={true}
      >
        {toast && (
          <ToastMessage
            top={hp(8)}
            message={toast}
            type="success"
            onHide={() => setToast(null)}
          />
        )}
        <View style={{ flex: 1, backgroundColor: '#F6F5FF', height: '100%' }}>
          <View style={{ backgroundColor: '#FFFFFF' }}>
            <View
              style={{
                flexDirection: 'row',
                // marginTop: Platform.OS === 'ios' && hp(5),
                // paddingTop: hp(2),
                alignItems: 'center',
                // justifyContent: 'center',
                elevation: 1,
              }}
            >
              <TouchableOpacity
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                style={{ paddingHorizontal: hp(1) }}
                onPress={() => navigation.goBack()}
              >
                <Image
                  source={Images.BACK_BUTTON}
                  style={{
                    marginLeft: wp(1),
                    resizeMode: 'contain',
                    height: hp(3.5),
                    width: wp(4),
                  }}
                />
              </TouchableOpacity>
              <Text style={styles.title}>Cuore Fitness</Text>
            </View>
          </View>

          <View
            style={{
              padding: wp(4),
              backgroundColor: '#F6F5FF',
              flex: 1,
              height: hp(100),
            }}
          >
            <View style={styles.timeCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  style={{
                    resizeMode: 'contain',
                    height: hp(2.5),
                    width: wp(5),
                    tintColor: '#17AD8D',
                  }}
                  source={Images.WATCH}
                />
                <Text
                  style={{
                    fontFamily: 'Roboto-Regular',
                    marginLeft: hp(1),
                    fontSize: 18,
                    fontWeight: '400',
                    color: '#000000',
                  }}
                >
                  Update Preferred Exercise Time
                </Text>
              </View>

              <Text
                style={{
                  fontFamily: 'Roboto-Regular',
                  fontSize: 14,
                  fontWeight: '400',
                  color: '#4B5563',
                  marginTop: 4,
                }}
              >
                Ideal between 6:00 AM – 7:00 PM
              </Text>

              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={{ fontFamily: 'Roboto-Regular', fontSize: wp(4) }}>
                  {formatTime(time)}
                </Text>
                <Image
                  style={{
                    resizeMode: 'contain',
                    height: hp(2),
                    width: wp(5),
                    tintColor: '#8F8F8F',
                  }}
                  source={Images.WATCH}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdateTime}
                style={styles.updateBtn}
              >
                <Text
                  style={{
                    fontFamily: 'Roboto-Regular',
                    color: '#FFFFFF',
                    fontWeight: '400',
                    fontSize: 14,
                  }}
                >
                  ✓ Update Time
                </Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  mode="time"
                  value={time}
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChangeTime}
                />
              )}
            </View>

            <View style={styles.innerShadowContainer}>
              <View
                style={{
                  paddingHorizontal: hp(1),
                  paddingVertical: hp(0.5),
                }}
              >
                <View style={{ flexDirection: 'row' }}>
                  {days.map((day, index) => (
                    <TouchableOpacity
                      key={day}
                      onPress={() => {
                        setSelectedDay(day);
                        setExpandedIndex(null);
                      }}
                      style={[
                        styles.dayBtn,
                        selectedDay === day && styles.selectedDayBtn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          selectedDay === day && styles.selectedDayText,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <FlatList
              data={fitnessData?.[selectedDay]}
              keyExtractor={(item, index) => `${item.title}-${index}`}
              renderItem={({ item, index }) => (
                <WorkoutCard
                  item={item}
                  index={index}
                  navigation={navigation}
                  expandedIndex={expandedIndex}
                  setExpandedIndex={setExpandedIndex}
                />
              )}
              contentContainerStyle={{ paddingBottom: hp(5) }}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', marginTop: hp(2) }}>
                  No exercises scheduled for {selectedDay}.
                </Text>
              }
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
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
  headerText: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(5),
    fontWeight: '600',
  },
  timeCard: {
    backgroundColor: '#FFFFFF',
    padding: wp(4),
    borderRadius: 12,
    marginBottom: hp(2),
    elevation: 2,
  },
  timeButton: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginTop: hp(1),
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  updateBtn: {
    marginTop: hp(1.5),
    backgroundColor: '#0057D9',
    paddingVertical: hp(1),
    alignItems: 'center',
    borderRadius: 4,
  },
  card: {
    padding: wp(4),
    marginVertical: hp(0.8),
    borderLeftWidth: 4,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',

    // Floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1, // Android
  },
  cardTitle: {
    fontFamily: 'Roboto-Regular',
    marginLeft: hp(1),
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
  cardDetail: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    marginTop: 4,
    color: '#374151',
  },
  expandedContent: {
    marginTop: hp(1),
  },
  expandedText: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.5),
    color: '#333',
    marginTop: 2,
  },
  dayScroll: {
    padding: hp(2),
    backgroundColor: 'red',
    borderWidth: 1,
    width: '100',
    flexDirection: 'row',
    marginBottom: hp(1),
  },
  dayBtn: {
    // backgroundColor: 'red',
    alignItems: 'center',

    paddingVertical: hp(0.8),

    borderRadius: 20,
    paddingHorizontal: wp(3),
  },
  selectedDayBtn: {
    // elevation: 4,
    // backgroundColor: '#0057D9',
  },
  dayText: {
    // margin: 0,
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    fontWeight: '400',
    color: '#1E64AC',
  },
  selectedDayText: {
    fontFamily: 'Roboto-Regular',
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },
  innerShadowContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    overflow: 'hidden', // important to keep shadows inside
  },
  shadowTop: {
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // right: 0,
    // height: 10,
    // backgroundColor: '#000',
    // opacity: 0.1,
  },
  shadowBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: '#000',
    opacity: 0.1,
  },
  shadowLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
    backgroundColor: '#000',
    opacity: 0.1,
  },
  shadowRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 2,
    backgroundColor: '#000',
    opacity: 0.1,
  },
});

export default Fitness;
