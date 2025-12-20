import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { wp, hp, Images } from '../../utilities';
import { useDispatch, useSelector } from 'react-redux';
import { getPredict } from '../../redux/slices';
import Loader from '../../components/Loader';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const healthGraphs = [
  {
    title: 'Cuore Score',
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov', 'Dec', 'Jan'],
      datasets: [
        {
          actualData: [10, 30, 40, 55, 65],
          predictedData: [122, 80, 122],
          color: '#1E64AC',
        },
      ],
    },
  },
  {
    title: 'Blood Pressure & Heart Rate',
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov', 'Dec', 'Jan'],
      datasets: [
        {
          actualData: [140, 135, 132, 128, 125],
          predictedData: [122, 120, 118],
          color: '#ff4d4d',
        },
        {
          actualData: [90, 88, 85, 80, 78],
          predictedData: [76, 74, 72],
          color: '#00b8a9',
        },
        {
          actualData: [75, 72, 70, 68, 65],
          predictedData: [63, 62, 60],
          color: '#40c4ff',
        },
      ],
    },
  },
  {
    title: 'Blood Sugar',
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov', 'Dec', 'Jan'],
      datasets: [
        {
          actualData: [110, 105, 102, 99, 95],
          predictedData: [92, 90, 88],
          color: '#f39c12',
        },
        {
          actualData: [160, 150, 145, 138, 130],
          predictedData: [125, 120, 115],
          color: '#d35400',
        },
      ],
    },
  },
  {
    title: 'A1C',
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov', 'Dec', 'Jan'],
      datasets: [
        {
          actualData: [7.5, 7.2, 6.8, 6.5, 6.2],
          predictedData: [6.0, 5.8, 5.6],
          color: '#9b59b6',
        },
      ],
    },
  },
  {
    title: 'Weight',
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov', 'Dec', 'Jan'],
      datasets: [
        {
          actualData: [85, 83, 81, 80, 78],
          predictedData: [77, 76, 75],
          color: '#34495e',
        },
      ],
    },
  },
  {
    title: 'BMI & Body Fat',
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov', 'Dec', 'Jan'],
      datasets: [
        {
          actualData: [26.2, 25.7, 25.2, 24.9, 24.5],
          predictedData: [24.2, 24.0, 23.8],
          color: '#2ecc71',
        },
        {
          actualData: [22, 21.5, 20.8, 20, 19.5],
          predictedData: [19.0, 18.8, 18.5],
          color: '#1abc9c',
        },
      ],
    },
  },
  {
    title: 'Cholesterol',
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov', 'Dec', 'Jan'],
      datasets: [
        {
          actualData: [45, 48, 50, 52, 55],
          predictedData: [57, 58, 60],
          color: '#3498db',
        },
        {
          actualData: [130, 125, 120, 115, 110],
          predictedData: [108, 106, 104],
          color: '#e74c3c',
        },
        {
          actualData: [160, 155, 150, 140, 135],
          predictedData: [130, 125, 120],
          color: '#e67e22',
        },
      ],
    },
  },
  {
    title: 'Lifestyle Metrics',
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov', 'Dec', 'Jan'],
      datasets: [
        {
          actualData: [60, 65, 70, 75, 80],
          predictedData: [82, 84, 86],
          color: '#f1c40f',
        },
        {
          actualData: [40, 50, 60, 70, 80],
          predictedData: [82, 84, 86],
          color: '#2ecc71',
        },
        {
          actualData: [70, 65, 60, 55, 50],
          predictedData: [48, 46, 44],
          color: '#e74c3c',
        },
        {
          actualData: [6, 6.5, 7, 7.5, 8],
          predictedData: [8.2, 8.4, 8.5],
          color: '#2980b9',
        },
      ],
    },
  },
];

const convertToChartData = ({ graph, history, historyData }) => {
  console.log(historyData, '========>');
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
      } else if (history === 'History') {
        return [actualDataset];
      } else {
        return [actualDataset]; // default fallback
      }
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
  const historyData = useSelector(
    state => state?.predictData?.data?.data?.history,
  );
  const loading = useSelector(state => state?.predict?.loading);
  console.log('predictData', predictData);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(getPredict(userId)).unwrap();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, userId]);

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
            console.log('Predict Item:', item);
            return (
              <View key={`module-${item?.title}-${index}`} style={styles.card}>
                {['Blood Pressure & Heart Rate', 'Blood Sugar'].includes(
                  item?.title,
                ) && (
                  <View style={styles.tabContainer}>
                    <TouchableOpacity
                      onPress={() => {
                        setHistory('Predict');
                        setActiveTab('Predict');
                      }}
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
                      onPress={() => {
                        setHistory('history');
                        setActiveTab('history');
                      }}
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
                  <Text style={[styles.title]}>
                    {item?.title == 'Blood Pressure & Heart Rate'
                      ? 'BP & HR'
                      : item?.title}
                  </Text>
                  <View style={styles.switchContainer}>
                    <TouchableOpacity
                      style={{
                        hitSlop: { top: 50, bottom: 50, left: 50, right: 50 },
                      }}
                      onPress={() => {
                        if (showRowData.includes(item?.title)) {
                          setShowRowData(
                            showRowData.filter(title => title !== item?.title),
                          );
                        } else {
                          setShowRowData([...showRowData, item?.title]);
                        }
                      }}
                      style={{
                        borderWidth: 0.5,
                        borderColor: '#9CA3AF',
                        height: hp(2),
                        width: wp(4),
                        borderRadius: hp(0.3),
                        marginRight: hp(1),
                        // padding: hp(0.5),
                      }}
                    >
                      {showRowData.includes(item?.title) && (
                        <Image
                          style={{
                            resizeMode: 'cover',
                            height: hp(2.2),
                            width: wp(4),
                            borderRadius: hp(0.3),
                          }}
                          source={Images.RIGHT_1}
                        ></Image>
                      )}
                    </TouchableOpacity>
                    <Text style={{ fontFamily: 'Roboto-Regular' }}>
                      Show Data
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      if (item?.title == 'Cuore Score') {
                        const STEP = 1;
                        navigation.navigate('OnBoarding', {
                          STEP,
                          screen: 'Reassess',
                          navigateTo: 'Home',
                        });
                      } else if (item?.title == 'Blood Pressure & Heart Rate') {
                        const STEP = 7;
                        navigation.navigate('OnBoarding', {
                          STEP,
                          screen: 'Reassess',
                          navigateTo: 'Home',
                        });
                      } else if (item?.title == 'Weight') {
                        const STEP = 2;
                        navigation.navigate('OnBoarding', {
                          STEP,
                          screen: 'Reassess',
                          navigateTo: 'Home',
                        });
                      } else if (item?.title == 'Blood Sugar') {
                        const STEP = 7;
                        navigation.navigate('OnBoarding', {
                          STEP,
                          screen: 'Reassess',
                          navigateTo: 'Home',
                        });
                      } else if (item?.title == 'A1C') {
                        const STEP = 7;
                        navigation.navigate('OnBoarding', {
                          STEP,
                          screen: 'Reassess',
                          navigateTo: 'Home',
                        });
                      } else if (item?.title == 'BMI & Body Fat') {
                        const STEP = 2;
                        navigation.navigate('OnBoarding', {
                          STEP,
                          screen: 'Reassess',
                          navigateTo: 'Home',
                        });
                      } else if (item?.title == 'Cholesterol') {
                        const STEP = 7;
                        navigation.navigate('OnBoarding', {
                          STEP,
                          screen: 'Reassess',
                          navigateTo: 'Home',
                        });
                      } else if (item?.title == 'Lifestyle Metrics') {
                        const STEP = 5;
                        navigation.navigate('OnBoarding', {
                          STEP,
                          screen: 'Reassess',
                          navigateTo: 'Home',
                        });
                      }
                    }}
                    style={[
                      styles.button,
                      { flexDirection: 'row', alignItems: 'center' },
                    ]}
                  >
                    <Image
                      style={{
                        resizeMode: 'contain',
                        width: wp(4),
                        height: hp(2.2),
                        marginRight: hp(1),
                        tintColor: 'white',
                      }}
                      source={Images.EDIT}
                    ></Image>
                    <Text style={styles.buttonText}>
                      {item?.title == 'Cuore Score' ? 'Re-assess' : 'Update'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {/* {item.datasets.every(ds =>
                ds.actualData.every(val => val === null),
              ) ? (
                <Text style={{ textAlign: 'center', marginTop: 20 }}>
                  No data available
                </Text>
              ) : ( */}
                <LineChart
                  key={item?.title}
                  data={convertToChartData({
                    graph: item,
                    history,
                    historyData: historyData,
                  })}
                  width={wp(87)}
                  height={hp(25)}
                  chartConfig={chartConfig}
                  withDots
                  renderDotContent={
                    showRowData.includes(item.title)
                      ? ({ x, y, index, indexData }) => (
                          <Text
                            key={`chart-${index}-dot-${index}-${indexData}`}
                            style={{
                              position: 'absolute',
                              left: x - 10,
                              top: y - 15,
                              color: '#000',
                              fontSize: 10,
                            }}
                          >
                            {Math.round(indexData)}
                          </Text>
                        )
                      : undefined
                  }
                  withShadow={false}
                  withInnerLines={false}
                />
                // {/* )} */}
                {/* <View style={{ flexDirection: 'row', alignItems: 'center' }}> */}
                <View
                  style={{
                    width: '100%',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    flexDirection: 'row',
                    gap: hp(2),
                    marginVertical: hp(1),
                  }}
                >
                  {item?.data?.datasets.map((ds, idx) => {
                    const datasetCount = item?.data?.datasets?.length || 0;
                    console.log('Dataset Count:', datasetCount);

                    return (
                      <View
                        key={`legend-${idx}`}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: hp(1),
                        }}
                      >
                        <View
                          style={{
                            height: hp(1.5),
                            width: hp(1.5),
                            marginRight: hp(1),
                            borderRadius: hp(5),
                            backgroundColor:
                              typeof ds.color === 'function'
                                ? datasetCount > 1
                                  ? ds.color()
                                  : ''
                                : datasetCount > 1
                                ? ds.color
                                : '',
                          }}
                        />
                        {datasetCount > 1 && (
                          <Text style={styles.hintText}>{ds.label}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
                {item.title === 'Cuore Score' && (
                  <View>
                    <Text
                      style={[
                        styles.hintText,
                        { textAlign: 'center', color: '#1E64AC' },
                      ]}
                    >
                      ⚠️ note that the predicted values are represented by
                      lighter lines.
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          <TouchableOpacity
            onPress={() => navigation.navigate('Health')}
            style={styles.footerButton}
          >
            <Image
              style={{
                resizeMode: 'contain',
                width: wp(4),
                height: hp(2),
                marginRight: hp(1),
              }}
              source={Images.DOCTOR_PROFILE}
            ></Image>
            <Text style={styles.footerText}>Cuore Health</Text>
          </TouchableOpacity>
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
    fontFamily: 'Roboto-Regulat',
    color: '#4B5563',
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
});

export default Predict;
