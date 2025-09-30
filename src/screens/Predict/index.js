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
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { wp, hp, Images } from '../../utilities';

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
};

const healthGraphs = [
  {
    title: 'Cuore Score',
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep'],
      datasets: [{ data: [60, 68, 72, 76, 80], color: () => '#1E64AC' }],
    },
  },
  {
    title: 'Blood Pressure & Heart Rate',
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep'],
      datasets: [
        { data: [140, 135, 132, 128, 125], color: () => '#ff4d4d' }, // Systolic
        { data: [90, 88, 85, 80, 78], color: () => '#00b8a9' }, // Diastolic
        { data: [75, 72, 70, 68, 65], color: () => '#40c4ff' }, // Heart Rate
      ],
    },
  },
  {
    title: 'Blood Sugar',
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep'],
      datasets: [
        { data: [110, 105, 102, 99, 95], color: () => '#f39c12' }, // Fasting
        { data: [160, 150, 145, 138, 130], color: () => '#d35400' }, // After Meal
      ],
    },
  },
  {
    title: 'A1C',
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep'],
      datasets: [
        { data: [7.5, 7.2, 6.8, 6.5, 6.2], color: () => '#9b59b6' }, // A1C
      ],
    },
  },
  {
    title: 'Weight',
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep'],
      datasets: [{ data: [85, 83, 81, 80, 78], color: () => '#34495e' }],
    },
  },
  {
    title: 'BMI & Body Fat',
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep'],
      datasets: [
        { data: [26.2, 25.7, 25.2, 24.9, 24.5], color: () => '#2ecc71' }, // BMI
        { data: [22, 21.5, 20.8, 20, 19.5], color: () => '#1abc9c' }, // Body Fat %
      ],
    },
  },
  {
    title: 'Cholesterol',
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep'],
      datasets: [
        { data: [45, 48, 50, 52, 55], color: () => '#3498db' }, // HDL
        { data: [130, 125, 120, 115, 110], color: () => '#e74c3c' }, // LDL
        { data: [160, 155, 150, 140, 135], color: () => '#e67e22' }, // Triglyceride
      ],
    },
  },
  {
    title: 'Lifestyle Metrics',
    data: {
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep'],
      datasets: [
        { data: [60, 65, 70, 75, 80], color: () => '#f1c40f' }, // Nutrition
        { data: [40, 50, 60, 70, 80], color: () => '#2ecc71' }, // Fitness
        { data: [70, 65, 60, 55, 50], color: () => '#e74c3c' }, // Stress (lower is better)
        { data: [6, 6.5, 7, 7.5, 8], color: () => '#2980b9' }, // Sleep hours
      ],
    },
  },
];

const Predict = ({ navigation }) => {
  const [showCuoreData, setShowCuoreData] = useState(false);
  const [showBPData, setShowBPData] = useState(false);
  const [showBodyData, setShowBodyData] = useState(false);
  const [activeTab, setActiveTab] = useState('Predict');

  return (
    <ScrollView style={{ backgroundColor: 'white' }}>
      <View
        style={{ padding: hp(1.5), backgroundColor: '#FFFFFF', elevation: 1 }}
      >
        <View
          style={{
            marginTop: Platform.OS == 'ios' && hp(6),

            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          <Text style={styles.header}>Predict</Text>
          <Image
            source={Images.SHARE_4}
            style={{
              width: hp(2),
              height: hp(2),
              marginLeft: hp(10),
              tintColor: '#000000',
            }}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            Entering your lifestyle and health data on time improves prediction
            accuracy.
          </Text>
        </View>

        {healthGraphs.map((item, index) => {
          return (
            <View key={`module-${index}`} style={styles.card}>
              {['Blood Pressure & Heart Rate', 'Blood Sugar'].includes(
                item.title,
              ) && (
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    onPress={() => setActiveTab('Predict')}
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
                    onPress={() => setActiveTab('history')}
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
                <Text style={styles.title}>{item.title}</Text>
                {/* <View style={styles.switchContainer}>
                <TouchableOpacity
                  onPress={() => setShowBPData(!showBPData)}
                  style={{
                    borderWidth: 0.5,
                    borderColor: '#9CA3AF',
                    height: hp(2),
                    width: wp(4),
                    borderRadius: hp(0.3),
                    marginRight: hp(1),
                  }}>
                  {showBPData && (
                    <Image
                      style={{
                        resizeMode: 'cover',
                        height: hp(2),
                        width: wp(4),
                        borderRadius: hp(0.3),
                      }}
                      source={Images.RIGHT_1}></Image>
                  )}
                </TouchableOpacity>
                <Text style={{fontFamily: 'Roboto-Regular'}}>Show Data</Text>
              </View> */}
                <TouchableOpacity
                  onPress={() => {
                    if (item.title == 'Cuore Score') {
                      const STEP = 1;
                      navigation.navigate('OnBoarding', { STEP });
                    } else if (item.title == 'Blood Pressure & Heart Rate') {
                      const STEP = 7;
                      navigation.navigate('OnBoarding', { STEP });
                    } else if (item.title == 'Weight') {
                      const STEP = 2;
                      navigation.navigate('OnBoarding', { STEP });
                    } else if (item.title == 'Blood Sugar') {
                      const STEP = 7;
                      navigation.navigate('OnBoarding', { STEP });
                    } else if (item.title == 'A1C') {
                      const STEP = 7;
                      navigation.navigate('OnBoarding', { STEP });
                    } else if (item.title == 'BMI & Body Fat') {
                      const STEP = 2;
                      navigation.navigate('OnBoarding', { STEP });
                    } else if (item.title == 'Cholesterol') {
                      const STEP = 7;
                      navigation.navigate('OnBoarding', { STEP });
                    } else if (item.title == 'Lifestyle Metrics') {
                      const STEP = 5;
                      navigation.navigate('OnBoarding', { STEP });
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
                    }}
                    source={Images.EDIT}
                  ></Image>
                  <Text style={styles.buttonText}>
                    {item?.title == 'Cuore Score' ? 'Re-assess' : 'Update'}
                  </Text>
                </TouchableOpacity>
              </View>
              <LineChart
                data={item.data}
                width={wp(87)}
                height={hp(25)}
                chartConfig={chartConfig}
                withDots
                renderDotContent={({ x, y, index, indexData }) => (
                  <Text
                    key={index}
                    style={{
                      position: 'absolute',
                      left: x - 10,
                      top: y - 15,
                      color: '#000',
                      fontSize: 10,
                    }}
                  >
                    {/* {showBPData ? indexData : ''} */}
                    {indexData}
                  </Text>
                )}
                withShadow={false} // 🚫 disables the blue area fill
                withInnerLines={false}
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  marginTop: 10,
                  // backgroundColor: 'red',
                  marginHorizontal: hp(1),
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      height: hp(2),
                      width: hp(2),
                      marginRight: hp(1),
                      borderRadius: hp(5),
                      backgroundColor: '#FF7272',
                    }}
                  ></View>
                  <Text style={styles.hintText}>BP Systolic</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      height: hp(2),
                      width: hp(2),
                      marginHorizontal: hp(1),
                      borderRadius: hp(5),
                      backgroundColor: '#68D5CD',
                    }}
                  ></View>
                  <Text style={styles.hintText}>BP Diastolic</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      height: hp(2),
                      width: hp(2),
                      marginHorizontal: hp(1),
                      borderRadius: hp(5),
                      backgroundColor: '#4DBAD2',
                    }}
                  ></View>
                  <Text style={styles.hintText}>Heart Rate</Text>
                </View>
              </View>
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
    marginLeft: hp(17),
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
