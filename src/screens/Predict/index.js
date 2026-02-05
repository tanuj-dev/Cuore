import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
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
const HIT_SLOP = { top: 50, bottom: 50, left: 50, right: 50 };

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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            title="Pull to refresh..."
            refreshing={loading || refreshing}
            onRefresh={onRefresh}
          />
        }
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <View
          style={{ padding: hp(1.5), backgroundColor: '#FFFFFF', elevation: 1 }}
        >
          {loading && <Loader />}
          <View
            style={{
              // marginTop: Platform.OS == 'ios' ? hp(6) : hp(3),

              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={styles.header}>Predict</Text>
            {/* <Image
              source={Images.SHARE_4}
              style={{
                width: hp(2),
                height: hp(2),
                marginLeft: hp(10),
                tintColor: '#000000',
              }}
              resizeMode="contain"
            /> */}
          </View>
        </View>

        <View style={styles.container}>
          <View style={styles.tipBox}>
            <Text style={styles.tipText}>
              Entering your lifestyle and health data on time improves
              prediction accuracy.
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
                        Predict
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
                  width={wp(87)}
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
                    <Text style={[styles.hintText, styles.warningText]}>
                      ⚠️ note that the predicted values are represented by
                      lighter lines.
                    </Text>
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
          <View style={[styles.card1, { flexDirection: 'row' }]}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center' }}
              ></View>
            </View>

            <Image
              style={{
                marginRight: hp(1),
                height: hp(1.5),
                width: hp(2),
                resizeMode: 'contain',
                marginHorizontal: hp(1),
              }}
              source={Images.NOTICE}
            />

            <Text>
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
  container: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  header: {
    fontFamily: 'Roboto-Regular',
    fontSize: 20,
    fontWeight: '400',
    // marginLeft: hp(17),
    color: '#000000',
    // marginBottom: 16,
  },
  tipBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: hp(0.5),
    padding: hp(2.3),
    marginBottom: 20,
    width: wp(90),
    elevation: 2,
  },
  tipText: {
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    color: '#1E64AC',
    fontWeight: '400',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: hp(1),
    padding: 10,
    marginBottom: 20,
    width: wp(90),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    fontWeight: '500',
    color: '#1E64AC',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#1E64AC',
    paddingHorizontal: 10,
    paddingVertical: hp(0.3),
    borderRadius: hp(0.5),
    shadowColor: 'rgba(130, 121, 121, 1)',
    shadowOpacity: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    elevation: 14,
  },
  buttonText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontWeight: '400',
    fontSize: 14,
  },
  footerButton: {
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: hp(3),
    paddingVertical: hp(1.5),
    // padding: 12,
    borderRadius: hp(3),
    marginTop: hp(3),
    elevation: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  footerText: {
    fontFamily: 'Roboto-Regular',
    color: '#4B5563',
    fontWeight: '400',
    fontSize: 16,
  },
  hintText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Roboto-Regular',
    color: '#4B5563',
  },
  showDataButton: {
    borderWidth: 0.5,
    borderColor: '#9CA3AF',
    height: hp(2),
    width: wp(4),
    borderRadius: hp(0.3),
    marginRight: hp(1),
  },
  showDataIcon: {
    resizeMode: 'cover',
    height: hp(2.2),
    width: wp(4),
    borderRadius: hp(0.3),
  },
  showDataText: {
    fontFamily: 'Roboto-Regular',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    resizeMode: 'contain',
    width: wp(4),
    height: hp(2.2),
    marginRight: hp(1),
    tintColor: 'white',
  },
  dotText: {
    position: 'absolute',
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
    // backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    textAlign: 'center',
    minWidth: 30,
  },
  legendContainer: {
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    gap: hp(2),
    marginVertical: hp(1),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  legendDot: {
    height: hp(1.5),
    width: hp(1.5),
    marginRight: hp(1),
    borderRadius: hp(5),
  },
  warningText: {
    textAlign: 'center',
    color: '#1E64AC',
  },
  footerIcon: {
    resizeMode: 'contain',
    width: wp(4),
    height: hp(2),
    marginRight: hp(1),
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    // flex: 1,
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    backgroundColor: '#9CA3AF',
    borderColor: 'transparent',
    paddingHorizontal: hp(3.5),
    paddingVertical: hp(0.3),
    marginRight: 10,
  },
  activeTab: {
    backgroundColor: '#1E64AC',
    borderColor: '#007AFF', // Blue underline
    borderRadius: hp(0.5),
  },
  activeText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  inactiveText: {
    fontSize: 14,
    color: 'white',
  },
  content: {
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
  },
  card1: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: hp(2),
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'center',
    marginHorizontal: hp(1.5),
  },
});

export default Predict;
