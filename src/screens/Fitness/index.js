import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {hp, wp, color, Images} from '../../utilities'; // Ensure these are defined in your project
import images from '../../utilities/Images';

const days = ['Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];

const mockWorkout = {
  Mon: [
    {title: 'Lateral Leg Swing', reps: '6-8', sets: '1', color: '#A68DFF'},
    {title: 'Jumping Jack', reps: '10-12', sets: '2', color: '#FF6B81'},
  ],
  Tue: [],
  Wed: [
    {title: 'Hamstring Stretch', reps: '4-6', sets: '1', color: '#6699FF'},
    {title: 'Tadasana', reps: '3-4', sets: '1', color: '#66CC99'},
    {title: 'Side Leg Swing', reps: '6-8', sets: '1', color: '#A68DFF'},
    {title: 'Jumping Jack', reps: '10-12', sets: '1', color: '#FF6B81'},
    {title: 'Hamstring Stretch', reps: '4-6', sets: '1', color: '#6699FF'},
  ],
  Thurs: [],
  Fri: [],
  Sat: [],
  Sun: [],
};

const Fitness = ({navigation}) => {
  const [selectedDay, setSelectedDay] = useState('Wed');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [expandedIndex, setExpandedIndex] = useState(null); // manage expanded card

  const onChangeTime = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) setTime(selectedTime);
  };

  const formatTime = date => {
    const hours = date.getHours();
    const mins = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHour = hours % 12 || 12;
    const formattedMin = mins < 10 ? `0${mins}` : mins;
    return `${formattedHour}:${formattedMin} ${ampm}`;
  };

  const renderWorkoutItem = ({item, index}) => {
    const isExpanded = expandedIndex === index;

    return (
      <TouchableOpacity
        onPress={() => setExpandedIndex(isExpanded ? null : index)}
        style={[styles.card, {borderLeftColor: item.color}]}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {/* <Image
            style={{
              resizeMode: 'contain',
              height: hp(2.5),
              width: wp(5),
              //   tintColor: '#17AD8D',
            }}
            source={Images.DUMBLE}></Image> */}
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <Text style={styles.cardDetail}>
          {` Reps: ${item.reps}       Sets: ${item.sets}`}
        </Text>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View>
              <Image
                style={{resizeMode: 'cover', height: hp(20), width: wp(85)}}
                source={{
                  uri: 'https://img.freepik.com/premium-vector/empty-gym-with-exercise-equipment_88100-207.jpg',
                }}></Image>
            </View>
            <View>
              <View
                style={{
                  backgroundColor: '#EBEDEF',
                  alignItems: 'center',
                  padding: hp(1),
                  marginTop: hp(2),
                  borderRadius: hp(1),
                  elevation: 2,
                }}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('FitnessDetails')}
                  style={{
                    flexDirection: 'row',
                    padding: hp(1),
                    backgroundColor: '#1E64AC',
                    alignSelf: 'center',
                    borderRadius: hp(1),
                    paddingHorizontal: hp(2),
                    alignItems: 'center',
                  }}>
                  <Image
                    style={{
                      resizeMode: 'contain',
                      height: hp(2.5),
                      width: wp(5),
                      tintColor: '#17AD8D',
                      marginRight: hp(1),
                    }}
                    source={Images.WATCH}></Image>
                  <Text
                    style={{
                      fontFamily: 'Roboto-Regular',
                      fontFamily: 'Roboto-Regular',
                      fontSize: 15,
                      fontWeight: '400',
                      color: '#FFFFFF',
                    }}>
                    start
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView>
      <View style={{flex: 1, backgroundColor: '#F6F5FF'}}>
        <View style={{backgroundColor: '#FFFFFF',}}>
            <View
          style={{
            flexDirection: 'row',
              marginTop:Platform.OS =='ios'&& hp(5),
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
          <Text style={styles.title}>Cuore Fitness</Text>
        </View>
        </View>
      
        <View style={{padding: wp(4)}}>
          <View style={styles.timeCard}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image
                style={{
                  resizeMode: 'contain',
                  height: hp(2.5),
                  width: wp(5),
                  tintColor: '#17AD8D',
                }}
                source={Images.WATCH}></Image>
              <Text
                style={{
                  fontFamily: 'Roboto-Regular',
                  marginLeft: hp(1),
                  fontSize: 18,
                  fontWeight: '400',
                  color: '#000000',
                }}>
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
              }}>
              Ideal between 6:00 AM – 7:00 PM
            </Text>

            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowTimePicker(true)}>
              <Text style={{fontFamily: 'Roboto-Regular', fontSize: wp(4)}}>
                {formatTime(time)}
              </Text>
              <Image
                style={{
                  resizeMode: 'contain',
                  height: hp(2),
                  width: wp(5),
                  tintColor: '#000000',
                }}
                source={Images.WATCH}></Image>
            </TouchableOpacity>

            <TouchableOpacity style={styles.updateBtn}>
              <Text
                style={{
                  fontFamily: 'Roboto-Regular',
                  color: '#FFFFFF',
                  fontWeight: '400',
                  fontSize: 14,
                }}>
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
            {/* Your content goes here */}
            <ScrollView
              style={{
                paddingHorizontal: hp(1),
                paddingVertical: hp(0.5),
              }}>
              <View style={{flexDirection: 'row'}}>
                {days.map(day => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => {
                      setSelectedDay(day);
                      setExpandedIndex(null); // reset on day change
                    }}
                    style={[
                      styles.dayBtn,
                      selectedDay === day && styles.selectedDayBtn,
                    ]}>
                    <Text
                      style={[
                        styles.dayText,
                        selectedDay === day && styles.selectedDayText,
                      ]}>
                      {`${day}   .   `}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <FlatList
            data={mockWorkout[selectedDay]}
            keyExtractor={(item, index) => `${item.title}-${index}`}
            renderItem={renderWorkoutItem}
            contentContainerStyle={{paddingBottom: hp(5)}}
            ListEmptyComponent={
              <Text style={{textAlign: 'center', marginTop: hp(2)}}>
                No exercises scheduled for {selectedDay}.
              </Text>
            }
          />
        </View>
      </View>
    </ScrollView>
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
    marginLeft: hp(13),
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
    // paddingHorizontal: wp(-1),
    paddingVertical: hp(0.8),
    // marginHorizontal: wp(1),
    borderRadius: 20,
    // backgroundColor: '#E0E0E0',
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
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  innerShadowContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    // overflow: 'hidden', // important to keep shadows inside
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
