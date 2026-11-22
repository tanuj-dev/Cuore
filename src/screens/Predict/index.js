import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { wp, hp, Images } from '../../utilities';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { getPredict } from '../../redux/slices';
import Loader from '../../components/Loader';
import SkeletonBox from '../../components/SkeletonBox';
import { Info, Check, Pencil, ChevronRight } from 'lucide-react-native';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';

const PredictSkeleton = () => (
  <View style={{ flex: 1, backgroundColor: '#F4F7FB' }}>
    <HeroHeader title="Trend" subtitle="How your scores are moving over time." />
    <ScrollView
      scrollEnabled={false}
      style={{ backgroundColor: '#F4F7FB' }}
      contentContainerStyle={{ alignItems: 'center', padding: hp(2) }}
    >
      <SkeletonBox
        width={wp(92)}
        height={64}
        borderRadius={16}
        style={{ marginBottom: hp(2.5) }}
      />
      {[1, 2, 3].map(i => (
        <View
          key={i}
          style={{
            backgroundColor: '#FFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            paddingHorizontal: wp(4),
            paddingVertical: hp(2),
            marginBottom: hp(2.5),
            width: wp(92),
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: hp(1.5),
            }}
          >
            <SkeletonBox width={100} height={16} />
            <SkeletonBox width={70} height={32} borderRadius={10} />
          </View>
          <SkeletonBox
            width={wp(82)}
            height={hp(25)}
            borderRadius={8}
            style={{ marginBottom: hp(1) }}
          />
          <View style={{ flexDirection: 'row', gap: hp(2), marginTop: hp(1) }}>
            <SkeletonBox width={60} height={14} borderRadius={6} />
            <SkeletonBox width={80} height={14} borderRadius={6} />
          </View>
        </View>
      ))}
    </ScrollView>
  </View>
);

// Constants
const TITLES_WITH_TABS = ['Blood Pressure & Heart Rate', 'Blood Sugar'];
const TITLES_BELOW_GRAPH = ['Cuore Score', 'Blood Sugar', 'A1C', 'Weight'];
const TITLE_TO_STEP_MAP = {
  'Cuore Score': 1,
  'Blood Pressure & Heart Rate': 7,
  Weight: 2,
  'Blood Sugar': 7,
  A1C: 7,
  'BMI & Body Fat': 2,
  Cholesterol: 7,
  'Lifestyle Metrics': 5,
};

const chartConfig = {
  // transparent: false,
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,

  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: () => '#999',
  propsForDots: {
    r: '3',
    strokeWidth: '4',

    // stroke: 'white',
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: '#E5E7EB',
    strokeWidth: 1,
  },
};

const convertToChartData = ({ graph, history }) => {
  const { labels = [], datasets = [] } = graph.data || {};

  if (!labels.length || !datasets.length) {
    return {
      labels: [],
      datasets: [],
    };
  }

  const chartDatasets = datasets.flatMap(
    ({ actualData, predictedData, color, label }) => {
      const actual =
        Array.isArray(actualData) && actualData.length > 0 ? actualData : [0];
      const predicted = Array.isArray(predictedData) ? predictedData : [];

      const actualPadded = [...actual, ...Array(predicted.length).fill(null)];
      const predictedPadded = Array(actual.length).fill(null).concat(predicted);

      const actualDataset = {
        data: actualPadded,
        color: () => color,
        label: label ? `${label} (Actual)` : 'Actual',
      };

      const predictedDataset = {
        data: predictedPadded,
        color: () => `rgba(${hexToRgb(color)}, 0.3)`,
        label: label ? `${label} (Predicted)` : 'Predicted',
      };

      if (history === 'Predict') {
        return [actualDataset, predictedDataset];
      }
      return [actualDataset];
    },
  );

  return {
    labels,
    datasets: chartDatasets.length
      ? chartDatasets
      : [
          {
            data: Array(labels.length).fill(0),
            color: () => '#ccc',
            label: 'No Data',
          },
        ],
  };
};

const hexToRgb = hex => {
  const bigint = parseInt(hex.replace('#', ''), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
};

const Predict = ({ navigation }) => {
  useLightStatusBar();
  const [showRowData, setShowRowData] = useState([]);
  const [activeTab, setActiveTab] = useState('Predict');
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState('Predict');

  const dispatch = useDispatch();

  const userId = useSelector(state => state.auth?.userId);
  const doctorProfile = useSelector(state => state.home?.data?.doctor);
  const predictData = useSelector(
    state => state?.predictData?.data?.data?.graphs,
  );
  const loading = useSelector(state => state?.predict?.loading);

  // Refetch whenever the screen regains focus (e.g. coming back here after
  // editing readings via "Update") so the graphs reflect the latest saved data.
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        dispatch(getPredict(userId));
      }
    }, [dispatch, userId]),
  );

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      await dispatch(getPredict(userId)).unwrap();
    } catch (error) {
      // Error handling without console.log
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, userId]);

  const handleTabChange = useCallback((tab, historyValue) => {
    setHistory(historyValue);
    setActiveTab(tab);
  }, []);

  const handleToggleShowData = useCallback(title => {
    setShowRowData(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title],
    );
  }, []);

  const handleNavigateToReassess = useCallback(
    step => {
      navigation.navigate('OnBoarding', {
        STEP: step,
        screen: 'Reassess',
        navigateTo: 'Home',
      });
    },
    [navigation],
  );

  const handleNavigateToHealth = useCallback(() => {
    navigation.navigate('Health');
  }, [navigation]);

  const getTitleDisplay = useCallback(title => {
    return title === 'Blood Pressure & Heart Rate' ? 'BP & HR' : title;
  }, []);

  const getButtonText = useCallback(
    title => (title === 'Cuore Score' ? 'Re-assess' : 'Update'),
    [],
  );

  const getStepForTitle = useCallback(
    title => (title === 'Cuore Score' ? 2 : TITLE_TO_STEP_MAP[title] || 7),
    [],
  );
  const role = useSelector(state => state.auth?.role);

  if (!predictData) {
    return <PredictSkeleton />;
  }

  return (
    <View style={styles.safeArea}>
      {loading && <Loader />}
      <ScrollView
        // The hero paints under the status bar itself.
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            title="Pull to refresh..."
            refreshing={loading || refreshing}
            onRefresh={onRefresh}
            tintColor="#1E64AC"
          />
        }
        style={styles.scrollView}
      >
        <HeroHeader
          title="Trend"
          subtitle="How your scores are moving over time."
        />
        <View style={styles.container}>
          <View style={styles.tipBox}>
            <Info size={18} color="#1E64AC" style={styles.tipIcon} />
            <Text style={styles.tipText}>
              The projected line extends recent data trends for visualization
              purposes only. It is not a medical prediction.
            </Text>
          </View>

          {predictData?.map((item, index) => {
            const chartData = convertToChartData({
              graph: item,
              history,
            });
            const isShowDataVisible = showRowData.includes(item?.title);
            const hasTabs = TITLES_WITH_TABS.includes(item?.title);
            const datasetCount = item?.data?.datasets?.length || 0;

            return (
              <View key={`module-${item?.title}-${index}`} style={styles.card}>
                {hasTabs && (
                  <View style={styles.tabContainer}>
                    <TouchableOpacity
                      onPress={() => handleTabChange('Predict', 'Predict')}
                      style={[
                        styles.tab,
                        activeTab === 'Predict' && styles.activeTab,
                      ]}
                    >
                      <Text
                        style={
                          activeTab === 'Predict'
                            ? styles.activeText
                            : styles.inactiveText
                        }
                      >
                        Trend
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleTabChange('history', 'History')}
                      style={[
                        styles.tab,
                        activeTab === 'history' && styles.activeTab,
                      ]}
                    >
                      <Text
                        style={
                          activeTab === 'history'
                            ? styles.activeText
                            : styles.inactiveText
                        }
                      >
                        History
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.cardHeader}>
                  <View style={styles.showDataRow}>
                    <TouchableOpacity
                      onPress={() => handleToggleShowData(item?.title)}
                      style={[
                        styles.showDataButton,
                        isShowDataVisible && styles.showDataButtonOn,
                      ]}
                      activeOpacity={0.7}
                    >
                      {isShowDataVisible && (
                        <Check size={13} color="#FFFFFF" strokeWidth={3} />
                      )}
                    </TouchableOpacity>
                    <Text style={styles.showDataText}>Show Data</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      handleNavigateToReassess(getStepForTitle(item?.title))
                    }
                    style={[styles.button, styles.buttonRow]}
                    activeOpacity={0.8}
                    disabled={role === 'caregiver'}
                  >
                    <Pencil size={14} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>
                      {getButtonText(item?.title)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <LineChart
                  key={item?.title}
                  data={chartData}
                  width={wp(82)}
                  height={hp(25)}
                  chartConfig={chartConfig}
                  withDots
                  renderDotContent={
                    isShowDataVisible
                      ? ({ x, y, index: dotIndex, indexData }) => {
                          if (indexData === null || indexData === undefined) {
                            return null;
                          }
                          return (
                            <Text
                              key={`chart-${dotIndex}-dot-${indexData}`}
                              style={[
                                styles.dotText,
                                {
                                  left: x - 10,
                                  top: y - 15,
                                },
                              ]}
                            >
                              {Math.round(indexData)}
                            </Text>
                          );
                        }
                      : undefined
                  }
                  withShadow={false}
                  withInnerLines={false}
                />
                {TITLES_BELOW_GRAPH.includes(item?.title) && (
                  <Text style={styles.titleBelow}>
                    {getTitleDisplay(item?.title)}
                  </Text>
                )}
                {datasetCount > 1 && (
                <View style={styles.legendContainer}>
                  {item?.data?.datasets.map((ds, idx) => {
                    const colorValue =
                      typeof ds.color === 'function' ? ds.color() : ds.color;

                    return (
                      <View key={`legend-${idx}`} style={styles.legendItem}>
                        {datasetCount > 1 && (
                          <View
                            style={[
                              styles.legendDot,
                              { backgroundColor: colorValue },
                            ]}
                          />
                        )}
                        {datasetCount > 1 && (
                          <Text style={styles.hintText}>{ds.label}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
                )}
                {item.title === 'Cuore Score' && (
                  <View>
                    {/* <Text style={[styles.hintText, styles.warningText]}>
                      ⚠️ note that the predicted values are represented by
                      lighter lines.
                    </Text> */}
                  </View>
                )}
              </View>
            );
          })}

          <TouchableOpacity
            onPress={handleNavigateToHealth}
            style={styles.footerButton}
            activeOpacity={0.8}
          >
            <Image
              source={
                doctorProfile?.profileImage || doctorProfile?.photoUrl
                  ? {
                      uri:
                        doctorProfile?.profileImage || doctorProfile?.photoUrl,
                    }
                  : Images.DOCTOR_PROFILE
              }
              style={
                doctorProfile?.profileImage || doctorProfile?.photoUrl
                  ? [styles.footerIcon, styles.footerDoctorIconFull]
                  : [styles.footerIcon, styles.footerDoctorIcon]
              }
              resizeMode={
                doctorProfile?.profileImage || doctorProfile?.photoUrl
                  ? 'cover'
                  : 'contain'
              }
            />
            <View style={styles.footerTextWrap}>
              <Text style={styles.footerText}>My Health</Text>
              <Text style={styles.footerSub}>
                Your readings and doctor in one place
              </Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
          {/* <View style={styles.card1}>
            <Image style={styles.noticeIcon} source={Images.NOTICE} />

            <Text style={styles.disclaimerText}>
              These predictions estimate possible trends in vitals based on past
              data and lifestyle patterns, for awareness only—not for diagnosis
              or treatment
            </Text>

           
          </View> */}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  scrollView: {
    backgroundColor: '#F4F7FB',
  },

  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: hp(2),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    padding: hp(2),
    backgroundColor: '#F4F7FB',
  },

  header: {
    fontFamily: 'Poppins-Medium',
    fontSize: 22,
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: hp(1.8),
    marginBottom: hp(2),
    width: wp(92),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tipIcon: { marginRight: 10, marginTop: 2 },

  tipText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    marginBottom: hp(2),
    width: wp(92),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
    paddingVertical: hp(0.5),
    gap: wp(4),
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16.5,
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  titleBelow: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#1E293B',
    letterSpacing: -0.3,
    marginTop: hp(1),
    marginBottom: hp(0.5),
  },
  showDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: wp(2),
  },
  button: {
    backgroundColor: '#1E64AC',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  buttonText: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(4),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: wp(92),
    marginBottom: hp(2),
  },
  footerTextWrap: { flex: 1, minWidth: 0 },
  footerText: {
    fontFamily: 'Poppins-SemiBold',
    color: '#0F172A',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  footerSub: {
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    fontSize: 12.5,
  },
  hintText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    letterSpacing: 0.1,
  },
  showDataButton: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    height: 20,
    width: 20,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showDataButtonOn: { backgroundColor: '#1E64AC', borderColor: '#1E64AC' },
  showDataText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#475569',
    letterSpacing: 0.1,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: { marginRight: 6 },
  dotText: {
    position: 'absolute',
    color: '#1E293B',
    fontSize: 10.5,
    fontFamily: 'Poppins-Medium',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    textAlign: 'center',
    minWidth: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  legendContainer: {
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: hp(2),
    marginTop: hp(1.5),
    paddingHorizontal: hp(0.5),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  legendDot: {
    height: hp(1.8),
    width: hp(1.8),
    marginRight: hp(0.8),
    borderRadius: hp(5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 1 },
    }),
  },
  warningText: {
    textAlign: 'center',
    color: '#1E64AC',
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    letterSpacing: 0.1,
  },
  footerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: wp(3),
    backgroundColor: '#DBEAFE',
  },
  footerDoctorIcon: {},
  footerDoctorIconFull: {},
  tabContainer: {
    flexDirection: 'row',
    marginBottom: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    padding: 4,
  },
  tab: {
    paddingHorizontal: hp(3.5),
    paddingVertical: hp(1),
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'transparent',
    marginHorizontal: hp(0.3),
  },
  activeTab: { backgroundColor: '#1E64AC' },
  activeText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  inactiveText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#64748B',
    letterSpacing: 0.1,
  },
  content: {
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
  },
  card1: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: hp(2.5),
    marginVertical: hp(1),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    justifyContent: 'center',
    marginHorizontal: hp(1.5),
    flexDirection: 'row',
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 2 },
    }),
  },
  noticeIcon: {
    marginRight: hp(1.5),
    height: hp(2.2),
    width: hp(2.2),
    resizeMode: 'contain',
    tintColor: '#D97706',
    marginTop: hp(0.3),
  },
  disclaimerText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
    flex: 1,
    letterSpacing: 0.1,
  },
});

export default Predict;
