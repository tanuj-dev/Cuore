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
import { getPredict } from '../../redux/slices';
import Loader from '../../components/Loader';
import { SafeAreaView } from 'react-native-safe-area-context';

// Constants
const TITLES_WITH_TABS = ['Blood Pressure & Heart Rate', 'Blood Sugar'];
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
  const [showRowData, setShowRowData] = useState([]);
  const [activeTab, setActiveTab] = useState('Predict');
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState('Predict');

  const dispatch = useDispatch();

  const userId = useSelector(state => state.auth?.userId);
  const predictData = useSelector(
    state => state?.predictData?.data?.data?.graphs,
  );
  const loading = useSelector(state => state?.predict?.loading);

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
    title => TITLE_TO_STEP_MAP[title] || 7,
    [],
  );

  // if (loading) {
  //   return <Loader />;
  // }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.headerContainer}>
        {loading && <Loader />}
        <View style={styles.headerContent}>
          <Text style={styles.header}>Trend</Text>
        </View>
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl
            title="Pull to refresh..."
            refreshing={loading || refreshing}
            onRefresh={onRefresh}
            tintColor="#11418A"
          />
        }
        style={styles.scrollView}
      >
        <View style={styles.container}>
          <View style={styles.tipBox}>
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
                  <Text style={styles.title}>
                    {getTitleDisplay(item?.title)}
                  </Text>
                  <View style={styles.switchContainer}>
                    <TouchableOpacity
                      // hitSlop={HIT_SLOP}
                      onPress={() => handleToggleShowData(item?.title)}
                      style={styles.showDataButton}
                    >
                      {isShowDataVisible && (
                        <Image
                          style={styles.showDataIcon}
                          source={Images.RIGHT_1}
                        />
                      )}
                    </TouchableOpacity>
                    <Text style={styles.showDataText}>Show Data</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      handleNavigateToReassess(getStepForTitle(item?.title))
                    }
                    style={[styles.button, styles.buttonRow]}
                  >
                    <Image style={styles.buttonIcon} source={Images.EDIT} />
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
          >
            <Image style={styles.footerIcon} source={Images.DOCTOR_PROFILE} />
            <Text style={styles.footerText}>Cuore Health</Text>
          </TouchableOpacity>
          <View style={styles.card1}>
            <Image style={styles.noticeIcon} source={Images.NOTICE} />

            <Text style={styles.disclaimerText}>
              These predictions estimate possible trends in vitals based on past
              data and lifestyle patterns, for awareness only—not for diagnosis
              or treatment
            </Text>

            {/* <Text style={styles.bold}>History: </Text>
                         
              
                          <Text style={[styles.bold, {marginTop: hp(1)}]}>Medications:</Text>
                          <Text style={{fontSize: 14, fontWeight: '400', color: '#4B5563'}}>
                            Diabetes on metformin   Hypertension (HTN) on Cardace
                          </Text>
              
                          <Text style={[styles.label, {marginTop: hp(1)}]}>
                            <Text style={styles.bold}>Labs:</Text>
                          </Text>
                          <Text style={{fontSize: 14, fontWeight: '400', color: '#4B5563'}}>
                            RBS: 230
                          </Text> */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    fontFamily: 'Poppins-Medium',
    fontSize: 22,
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  tipBox: {
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: hp(2.5),
    marginBottom: hp(2.5),
    width: wp(90),
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 2 },
    }),
  },
  tipText: {
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    color: '#1E40AF',
    fontSize: 14.5,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    marginBottom: hp(2.5),
    width: wp(90),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 4 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16.5,
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#11418A',
    paddingHorizontal: hp(1.5),
    paddingVertical: hp(0.8),
    borderRadius: 10,
    shadowColor: '#11418A',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 4 },
    }),
  },
  buttonText: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  footerButton: {
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: hp(3),
    paddingVertical: hp(1.8),
    borderRadius: 16,
    marginTop: hp(3),
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 3 },
    }),
  },
  footerText: {
    fontFamily: 'Poppins-Medium',
    color: '#11418A',
    fontSize: 16,
    letterSpacing: -0.2,
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
    height: hp(2.2),
    width: wp(4.5),
    borderRadius: 6,
    marginRight: hp(1),
    backgroundColor: '#F8FAFC',
  },
  showDataIcon: {
    resizeMode: 'cover',
    height: hp(2.2),
    width: wp(4.5),
    borderRadius: 6,
  },
  showDataText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12.5,
    color: '#475569',
    letterSpacing: 0.1,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    resizeMode: 'contain',
    width: wp(4),
    height: hp(2.2),
    marginRight: hp(0.8),
    tintColor: 'white',
  },
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
    gap: hp(2),
    marginVertical: hp(1.5),
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
    color: '#11418A',
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    letterSpacing: 0.1,
  },
  footerIcon: {
    resizeMode: 'contain',
    width: wp(5),
    height: hp(2.5),
    marginRight: hp(1.2),
    tintColor: '#11418A',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: hp(0.5),
  },
  tab: {
    paddingHorizontal: hp(3.5),
    paddingVertical: hp(1.2),
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent',
    marginHorizontal: hp(0.3),
  },
  activeTab: {
    backgroundColor: '#11418A',
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 3 },
    }),
  },
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
