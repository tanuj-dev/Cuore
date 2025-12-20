import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Platform,
  StyleSheet,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { hp, wp, Images } from '../../utilities';
import { useSelector, useDispatch } from 'react-redux';
import { updateFitnessTime } from '../../redux/slices';
import ToastMessage from '../../components/Toast';
import ApiError from '../../components/ApiError';
import { SafeAreaView } from 'react-native-safe-area-context';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Pure function - moved outside component
const formatTime = date => {
  const hours = date.getHours();
  const mins = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHour = hours % 12 || 12;
  const formattedMin = mins < 10 ? `0${mins}` : mins;
  return `${formattedHour}:${formattedMin} ${ampm}`;
};

const WorkoutCard = React.memo(({ item, navigation }) => {
  const handlePress = useCallback(() => {
    navigation.navigate('FitnessDetails', {
      instruction: item?.instructions,
      data: item,
    });
  }, [navigation, item]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.card, { borderLeftColor: item?.color }]}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Image style={styles.coinIcon} source={Images.COIN} />
        <Text style={styles.cardTitle}>{item?.title}</Text>
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.detailText}>Reps: {item?.reps}</Text>
        <Text style={styles.detailText}>Sets: {item?.sets}</Text>
      </View>
    </TouchableOpacity>
  );
});

const Fitness = ({ navigation, route }) => {
  const todayWorkoutDay = route?.params?.initialTab;
  const [selectedDay, setSelectedDay] = useState(todayWorkoutDay || days[0]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [toast, setToast] = useState(null);

  const dispatch = useDispatch();
  const data = useSelector(state => state.fitness.data);
  const role = useSelector(state => state.auth.role);
  const fitnessData = data?.schedule;

  const onChangeTime = useCallback((event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) setTime(selectedTime);
  }, []);

  const handleUpdateTime = useCallback(async () => {
    const formattedTime = formatTime(time);
    const formData = { preferred_ex_time: formattedTime };
    const res = await dispatch(updateFitnessTime(formData));

    if (res?.payload?.status) {
      setToast('Preferred exercise time updated successfully!');
    } else {
      setToast('Failed to update preferred exercise time. Please try again.');
    }
  }, [time, dispatch]);

  const handleDaySelect = useCallback(day => {
    setSelectedDay(day);
  }, []);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleShowTimePicker = useCallback(() => {
    setShowTimePicker(true);
  }, []);

  const handleHideToast = useCallback(() => {
    setToast(null);
  }, []);

  const formattedTime = useMemo(() => formatTime(time), [time]);

  const workoutData = useMemo(
    () => fitnessData?.[selectedDay] || [],
    [fitnessData, selectedDay],
  );

  const keyExtractor = useCallback(
    (item, index) => `${item.title}-${index}`,
    [],
  );

  const renderWorkoutCard = useCallback(
    ({ item }) => <WorkoutCard item={item} navigation={navigation} />,
    [navigation],
  );

  useEffect(() => {
    if (data?.preferredTime) {
      setTime(new Date(data.preferredTime));
    }
  }, [data?.preferredTime]);

  if (!fitnessData) {
    return (
      <ApiError
        message="No fitness data available at the moment."
        onRetry={() => {}}
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {toast && (
        <ToastMessage
          top={hp(8)}
          message={toast}
          type="success"
          onHide={handleHideToast}
        />
      )}

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Image source={Images.BACK_BUTTON} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.title}>Cuore Fitness</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Time Update Card */}
        <View style={styles.timeCard}>
          <View style={styles.timeCardHeader}>
            <Image style={styles.watchIcon} source={Images.WATCH} />
            <Text style={styles.timeCardTitle}>
              Update Preferred Exercise Time
            </Text>
          </View>

          <Text style={styles.timeCardSubtitle}>
            Ideal between 6:00 AM – 7:00 PM
          </Text>

          <TouchableOpacity
            style={styles.timeButton}
            onPress={handleShowTimePicker}
          >
            <Text style={styles.timeText}>{formattedTime}</Text>
            <Image style={styles.timeWatchIcon} source={Images.WATCH} />
          </TouchableOpacity>

          <TouchableOpacity
            disabled={role === 'caregiver'}
            onPress={handleUpdateTime}
            style={[
              styles.updateBtn,
              role === 'caregiver' && styles.updateBtnDisabled,
            ]}
          >
            <Text style={styles.updateBtnText}>✓ Update Time</Text>
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

        {/* Day Tabs */}
        <View style={styles.innerShadowContainer}>
          <View style={styles.dayTabsContainer}>
            <View style={styles.dayTabsRow}>
              {days.map(day => (
                <TouchableOpacity
                  key={day}
                  onPress={() => handleDaySelect(day)}
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

        {/* Workout List */}
        <FlatList
          data={workoutData}
          keyExtractor={keyExtractor}
          renderItem={renderWorkoutCard}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No exercises scheduled for {selectedDay}.
            </Text>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  backButton: {
    paddingHorizontal: hp(1),
  },
  backIcon: {
    marginLeft: wp(1),
    resizeMode: 'contain',
    height: hp(3.5),
    width: wp(4),
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
  content: {
    flex: 1,
    backgroundColor: '#F6F5FF',
    padding: wp(4),
  },
  timeCard: {
    backgroundColor: '#FFFFFF',
    padding: wp(4),
    borderRadius: 12,
    marginBottom: hp(2),
    elevation: 2,
  },
  timeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchIcon: {
    resizeMode: 'contain',
    height: hp(2.5),
    width: wp(5),
    tintColor: '#17AD8D',
  },
  timeCardTitle: {
    fontFamily: 'Roboto-Regular',
    marginLeft: hp(1),
    fontSize: 18,
    fontWeight: '400',
    color: '#000000',
  },
  timeCardSubtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: '#4B5563',
    marginTop: 4,
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
  },
  timeText: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(4),
  },
  timeWatchIcon: {
    resizeMode: 'contain',
    height: hp(2),
    width: wp(5),
    tintColor: '#8F8F8F',
  },
  updateBtn: {
    marginTop: hp(1.5),
    backgroundColor: '#0057D9',
    paddingVertical: hp(1),
    alignItems: 'center',
    borderRadius: 4,
  },
  updateBtnDisabled: {
    opacity: 0.5,
  },
  updateBtnText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontWeight: '400',
    fontSize: 14,
  },
  innerShadowContainer: {
    backgroundColor: '#fff',
    marginBottom: hp(1),
  },
  dayTabsContainer: {
    paddingHorizontal: hp(1),
    paddingVertical: hp(0.5),
  },
  dayTabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayBtn: {
    alignItems: 'center',
    paddingVertical: hp(0.8),
    borderRadius: 20,
    paddingHorizontal: wp(3),
  },
  selectedDayBtn: {
    // Add any selected state styles if needed
  },
  dayText: {
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
  card: {
    padding: wp(4),
    marginVertical: hp(0.8),
    borderLeftWidth: 4,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    resizeMode: 'contain',
    height: hp(2),
    width: wp(4),
    tintColor: '#000000',
  },
  cardTitle: {
    fontFamily: 'Roboto-Regular',
    marginLeft: hp(1),
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(0.7),
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  listContent: {
    paddingBottom: hp(8),
  },
  emptyText: {
    textAlign: 'center',
    marginTop: hp(2),
  },
});

export default Fitness;
