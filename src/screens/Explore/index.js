import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React from 'react';
import {hp, wp, Images, color} from '../../utilities';
import {ScrollView} from 'react-native-gesture-handler';

const modules = [
  {
    id: '1',
    title: 'Cuore Nourish',
    subtitle: 'What to Eat, Made Simple',
    image: Images.MEAL1, // Replace with correct image reference
  },
  {
    id: '2',
    title: 'Cuore MealBuilder',
    subtitle: 'Customize What Fuels You',
    image: Images.MEAL2,
  },
  {
    id: '3',
    title: 'Cuore Fitness',
    subtitle: 'Workouts Designed for You',
    image: Images.MEAL3,
  },
  {
    id: '4',
    title: 'Cuore Mind',
    subtitle: 'Calm, Clarity & Rest',
    image: Images.MEAL4,
  },
  {
    id: '5',
    title: 'Cuore Tobacco',
    subtitle: 'Reclaim your life',
    image: Images.MEAL5,
  },
  {
    id: '6',
    title: 'Cuore Knowledge',
    subtitle: 'Curated Health Insights',
    image: Images.MEAL6,
  },
];
const routeMap = {
  'Cuore Tobacco': 'Tobacco',
  'Cuore Mind': 'Mind',
  'Cuore Fitness': 'Fitness',
  'Cuore Knowledge': 'CuoreKnowledge',
  'Cuore MealBuilder': 'MealBuilder',
  'Cuore Nourish': 'Nutrition',

  // Add more mappings if needed
};

const Explore = ({navigation}) => {
  const renderItem = ({item}) => (
    <TouchableOpacity
      onPress={() => {
        const route = routeMap[item.title]; // Corrected here

        if (route) {
          // Alert.alert(route);
          navigation.navigate(route);
        } else {
          Alert.alert('Route not found');
        }
      }}
      style={styles.card}>
      <Image source={item.image} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView>
      <View style={{   padding: hp(1.5),
          backgroundColor: 'white',
         paddingVertical:hp(1)}}>
          <View
        style={{
          justifyContent: 'space-between',
          flexDirection: 'row',
       
            marginTop:Platform.OS =='ios'&& hp(6),
        }}>
        <Image source={Images.APP_LOGO} style={styles.logo} />
        <Image
          source={Images.UNCLE}
          style={[styles.logo, {marginLeft: hp(25)}]}
        />
      </View>
      </View>
    
      <View style={styles.container}>
        <View style={{flex: 1}}>
          <View
            style={[
              styles.header,
              {
                position: 'absolute',
                left: 0,
                right: 0,
                zIndex: 10,
                bottom: hp(3),
              },
            ]}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Health')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                padding: hp(1),
                borderRadius: hp(3),
                paddingHorizontal: hp(1.5),
                borderWidth: 1,
                borderColor: '#D1D5DB',
                elevation: 4,
                // alignSelf: 'flex-start', // keeps button from stretching full width
                marginLeft: wp(4), // keeps it aligned from the left like before
              }}>
              <Image
                style={{
                  resizeMode: 'contain',
                  height: hp(2.5),
                  width: wp(6),
                }}
                source={Images.DOCTOR_PROFILE}
              />
              <Text style={styles.heading}> Cuore Health</Text>
            </TouchableOpacity>

            <Text
              style={[
                styles.subheading,
                {marginLeft: wp(4), marginTop: hp(1)},
              ]}>
              Your health journey, summarized and shareable
            </Text>
          </View>

          {/* Add some padding to prevent content being overlapped */}
          <View style={{paddingTop: hp(10)}}>
            {/* Your other content here */}
          </View>
        </View>

        <FlatList
          data={modules}
          numColumns={2}
          columnWrapperStyle={styles.row}
          keyExtractor={(item, index) =>
            item.id?.toString() ?? index.toString()
          }
          renderItem={renderItem}
          contentContainerStyle={styles.grid}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    marginVertical: hp(2),
  },
  logo: {
    width: wp(20),
    height: hp(4),
    resizeMode: 'contain',
    marginBottom: hp(1),
  },
  heading: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    fontWeight: '400',
    color: '#4B5563',
  },
  subheading: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#6B7280',
    fontWeight: 14,
    textAlign: 'center',
    marginTop: hp(0.5),
  },
  grid: {
    paddingBottom: hp(4),
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  card: {
    width: wp(42),
    backgroundColor: '#FFFFFF',
    borderRadius: wp(3),
    padding: wp(4),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 1,
  },
  image: {
    width: wp(38),
    height: hp(12),
    resizeMode: 'contain',
    marginBottom: hp(1.2),
  },
  title: {
    fontFamily: 'Roboto-Regular',
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '400',
    textAlign: 'center',
    marginTop: hp(0.5),
  },
});

export default Explore;
