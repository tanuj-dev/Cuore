import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Platform,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { hp, wp, Images } from '../../utilities';
import { useSelector, useDispatch } from 'react-redux';
import { updateFitnessTime, getFitness } from '../../redux/slices';
import ToastMessage from '../../components/Toast';
import ApiError from '../../components/ApiError';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonBox from '../../components/SkeletonBox';

const FitnessSkeleton = () => (
  <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
    {/* Header */}
    <View style={{ backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp(2), paddingVertical: hp(1.5) }}>
      <SkeletonBox width={44} height={28} borderRadius={6} />
      <SkeletonBox width={130} height={22} style={{ flex: 1, alignSelf: 'center', marginHorizontal: 8 }} />
      <SkeletonBox width={44} height={28} borderRadius={6} />
    </View>
    <View style={{ flex: 1, padding: wp(4), gap: hp(2) }}>
      {/* Time card */}
      <View style={{ backgroundColor: '#FFF', padding: wp(4), borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: hp(1.5) }}>
        <SkeletonBox width={200} height={18} />
        <SkeletonBox width={140} height={14} borderRadius={6} />
        <SkeletonBox width="100%" height={44} borderRadius={10} />
        <SkeletonBox width="100%" height={40} borderRadius={10} />
      </View>
      {/* Day tabs */}
      <View style={{ backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: hp(0.6), flexDirection: 'row', gap: 8 }}>
        {days.map(d => (
          <SkeletonBox key={d} width={36} height={32} borderRadius={20} />
        ))}
      </View>
      {/* Workout cards */}
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={{ backgroundColor: '#FFF', padding: wp(4), borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: hp(1) }}>
          <SkeletonBox width={160} height={16} />
          <View style={{ flexDirection: 'row', gap: wp(4) }}>
            <SkeletonBox width={80} height={14} borderRadius={6} />
            <SkeletonBox width={80} height={14} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  </SafeAreaView>
);

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

  useEffect(() => {
    if (!data) {
      dispatch(getFitness());
    }
  }, [dispatch, data]);
  const role = useSelector(state => state.auth.role);
  const fitnessData = data?.schedule;

  const onChangeTime = useCallback((event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setTime(selectedTime);
      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowTimePicker(false);
    }
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

  const fitnessLoading = useSelector(state => state.fitness.loading);

  if (fitnessLoading && !data) {
    return <FitnessSkeleton />;
  }

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
          <Text style={styles.title} numberOfLines={1}>Cuore Fitness</Text>
          <View style={styles.headerSpacer} />
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
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                mode="time"
                value={time}
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeTime}
                textColor="#1E293B"
                themeVariant="light"
              />
            </View>
          )}
        </View>

        {/* Day Tabs */}
        <View style={styles.innerShadowContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayTabsScrollContent}
            style={styles.dayTabsScroll}
          >
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
                  numberOfLines={1}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(2),
    paddingVertical: hp(1.5),
    ...(Platform.OS === 'android' && { elevation: 0.5 }),
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: {
    resizeMode: 'contain',
    height: hp(3.5),
    width: wp(4),
  },
  title: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 20,
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: 0.2,
    paddingHorizontal: 8,
  },
  headerSpacer: { width: 44 },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: wp(4),
  },
  timeCard: {
    backgroundColor: '#FFFFFF',
    padding: wp(4),
    borderRadius: 12,
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && { elevation: 1 }),
  },
  timeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchIcon: {
    resizeMode: 'contain',
    height: hp(2.5),
    width: wp(5),
    tintColor: '#11418A',
  },
  timeCardTitle: {
    fontFamily: 'Poppins-Medium',
    marginLeft: hp(1),
    fontSize: 18,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  timeCardSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  timeButton: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1),
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
  },
  timeText: {
    fontFamily: 'Poppins-Regular',
    fontSize: wp(4),
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  timeWatchIcon: {
    resizeMode: 'contain',
    height: hp(2),
    width: wp(5),
    tintColor: '#64748B',
  },
  updateBtn: {
    marginTop: hp(1.5),
    backgroundColor: '#11418A',
    paddingVertical: hp(1.2),
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && { elevation: 2 }),
  },
  updateBtnDisabled: {
    opacity: 0.5,
  },
  updateBtnText: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginTop: hp(1),
    padding: wp(2),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  innerShadowContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: hp(1),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...(Platform.OS === 'android' && { elevation: 0.5 }),
  },
  dayTabsScroll: {
    flexGrow: 0,
  },
  dayTabsScrollContent: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.6),
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayBtn: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(2.5),
    borderRadius: 20,
    marginRight: 8,
  },
  selectedDayBtn: {
    backgroundColor: '#E8EEF7',
  },
  dayText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#11418A',
    letterSpacing: 0.2,
  },
  selectedDayText: {
    fontFamily: 'Poppins-Medium',
    color: '#1E293B',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  card: {
    padding: wp(4),
    marginVertical: hp(0.8),
    borderLeftWidth: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && { elevation: 1 }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    resizeMode: 'contain',
    height: hp(2),
    width: wp(4),
    tintColor: '#11418A',
  },
  cardTitle: {
    fontFamily: 'Poppins-Medium',
    marginLeft: hp(1),
    fontSize: 14,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(0.7),
  },
  detailText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#64748B',
    letterSpacing: 0.2,
  },
  listContent: {
    paddingBottom: hp(8),
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginTop: hp(2),
    color: '#64748B',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});

export default Fitness;
