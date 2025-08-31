import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Image,
} from 'react-native';
import {hp, wp, Images} from '../../utilities';

const sampleData = [
  {id: '1', name: '1/2 bowl Rava Upma', calories: 150, tag: 'green'},
  {id: '2', name: '1/2 bowl Oats with Milk', calories: 150, tag: 'green'},
  {id: '3', name: '1/2 bowl Vegetable Dalia', calories: 150, tag: 'green'},
  {id: '4', name: '1/2 bowl Vegetable Poha', calories: 150, tag: 'green'},
  {
    id: '5',
    name: '1/2 bowl Cornflakes with Milk',
    calories: 150,
    tag: 'yellow',
  },
];

const tagColors = {
  green: '#00C853',
  yellow: '#FFD600',
};

const MealBuilder1 = ({navigation}) => {
  const [selectedItems, setSelectedItems] = useState(
    sampleData.map(item => ({...item, count: 1})),
  );

  const increment = id => {
    const updated = selectedItems.map(item =>
      item.id === id ? {...item, count: item.count + 1} : item,
    );
    setSelectedItems(updated);
  };

  const decrement = id => {
    const updated = selectedItems.map(item =>
      item.id === id && item.count > 1
        ? {...item, count: item.count - 1}
        : item,
    );
    setSelectedItems(updated);
  };

  const totalSelected = selectedItems.length;
  const totalCalories = selectedItems.reduce(
    (sum, item) => sum + item.count * item.calories,
    0,
  );
  const maxAllowed = 4;
  const extraCalories =
    totalSelected > maxAllowed ? totalCalories - maxAllowed * 150 : 0;

  return (
    <ScrollView style={{}}>
      <ImageBackground
        style={styles.backgroundImage}
        source={Images.BACKGROUND_IMAGE_NUTRITION}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerContainer}>
          <Image style={styles.backButton} source={Images.BACK_BUTTON} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Cuore MealBuilder</Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: hp(6),
            paddingHorizontal: hp(4),
          }}>
          <View>
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontSize: 14,
                fontWeight: '400',
                color: '#171615',
              }}>
              5 items selected
            </Text>
          </View>

          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Image
              style={[styles.backButton, {marginRight: hp(1)}]}
              source={Images.WARNING}
            />
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontSize: 14,
                fontWeight: '400',
                color: '#DF3938',
              }}>
              max 4 allowed
            </Text>
          </View>
        </View>
      </ImageBackground>

      <View style={{flex: 1, backgroundColor: '#F9FAFB', padding: wp(4)}}>
        <FlatList
          data={selectedItems}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View
              style={{
                marginHorizontal: hp(1),
                backgroundColor: '#FFFFFF',
                padding: hp(3),
                borderRadius: hp(1),
                // marginVertical: hp(0.5),
                // elevation: 2,
              }}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View
                  style={{
                    height: hp(2),
                    width: hp(2),
                    borderRadius: hp(1),
                    backgroundColor: tagColors[item.tag],
                    marginRight: wp(3),
                  }}
                />
                <View style={{flex: 1}}>
                  <Text
                    style={{fontSize: 14, fontWeight: '400', color: '#000000'}}>
                    {item.name}
                  </Text>
                  <Text style={{fontSize: hp(1.6), color: '#6B7280'}}>
                    {item.calories} cal
                  </Text>
                </View>
              </View>

              {/* increment decrement button */}

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: hp(2),
                  marginLeft: hp(2.5),
                }}>
                <TouchableOpacity
                  onPress={() => decrement(item.id)}
                  style={{
                    height: hp(4),
                    width: hp(4),
                    borderRadius: hp(2),
                    backgroundColor: '#eee',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={{fontSize: hp(2)}}>-</Text>
                </TouchableOpacity>
                <Text style={{marginHorizontal: wp(2), fontSize: hp(2)}}>
                  {item.count}
                </Text>
                <TouchableOpacity
                  onPress={() => increment(item.id)}
                  style={{
                    height: hp(4),
                    width: hp(4),
                    borderRadius: hp(2),
                    backgroundColor: '#eee',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={{fontSize: hp(2)}}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        <View
          style={{
            padding: hp(2),
            borderTopWidth: 1,
            borderColor: '#ddd',
            marginTop: hp(1),
            alignItems: 'flex-end',
          }}>
          <Text style={{fontSize: 14, fontWeight: '400', color: '#4B5563'}}>
            Total Calories:{' '}
            <Text style={{fontWeight: 'bold'}}>{totalCalories}</Text>
          </Text>
          {extraCalories > 0 && (
            <Text style={{fontSize: 14, fontWeight: '400', color: '#DC2626'}}>
              Extra: {extraCalories}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('MealBuilder2')}
          style={{
            backgroundColor: '#1E64AC',
            marginHorizontal: wp(20),
            marginTop: hp(2),
            padding: hp(1.5),
            alignItems: 'center',
            borderRadius: hp(1),
            marginBottom: hp(20),
          }}>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontSize: 14,
              fontWeight: '500',
              color: '#FFFFFF',
            }}>
            Adjust Portions
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    height: hp(20),
    padding: hp(2),
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerContainer: {marginTop:Platform.OS =='ios'&& hp(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    resizeMode: 'contain',
    height: hp(3.5),
    width: wp(4),
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: hp(2),
  },
  title: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'Roboto-Regular',
  },
});

export default MealBuilder1;
