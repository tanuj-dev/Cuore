import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  refreshControl,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { getKnowledge } from '../../redux/slices';
import ApiError from '../../components/ApiError';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import Loader from '../../components/Loader';
// import Icon from 'react-native-vector-icons/Ionicons';

const CuoreKnowledge = ({ navigation }) => {
  const [search, setSearch] = useState('');

  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
  const userId = useSelector(state => state.auth.userId);
  const knowledgeData = useSelector(state => state.knowledge.data?.data.cards);
  // const knowledgeData = data?.cards;
  console.log('Knowledge Data from Redux:', knowledgeData);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (userId) {
      dispatch(getKnowledge(userId));
    }
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, [dispatch, userId]);

  const renderItem = ({ item }) => (
    // console.log('Rendering item:', item),
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('KnowledgeDetails', {
          details: item?.details || null,
        })
      }
      style={styles.card}
    >
      <Image source={Images.KNOWLEDGE_5} style={styles.image} />
      <View style={styles.textContainer}>
        <Text numberOfLines={2} style={styles.title}>
          {item.title}
        </Text>
        <Text numberOfLines={2} style={styles.description}>
          {item.subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!knowledgeData) {
    return (
      <ApiError
        message="No articles available at the moment."
        onRetry={() => {
          if (userId) {
            dispatch(getKnowledge(userId));
          }
        }}
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={{ flex: 1, backgroundColor: 'white' }}
      >
        <View style={{ flex: 1, backgroundColor: '#EFF6FF' }}>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#FFFFFF',
              // paddingTop: hp(2),
              elevation: 1,
            }}
          >
            {refreshing && <Loader />}

            <TouchableOpacity
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              style={{ paddingHorizontal: hp(1) }}
              onPress={() => navigation.goBack()}
            >
              <Image
                source={Images.BACK_BUTTON} // Replace with actual key in your `images` object
                style={{
                  // marginTop: Platform.OS == 'ios' ? hp(5) : hp(1),
                  resizeMode: 'contain',
                  height: hp(3.5),
                  width: wp(4),
                  marginLeft: Platform.OS == 'ios' ? hp(2) : hp(1),
                }}
              />
            </TouchableOpacity>

            {/* Header Icon */}
            <View style={styles.headerIconContainer}>
              <View
                style={{
                  padding: hp(0.8),
                  borderWidth: 3,
                  borderRadius: hp(10),
                }}
              >
                <Image
                  source={Images.DOCTOR_PROFILE}
                  style={styles.headerIcon}
                />
              </View>
              <Text style={styles.heading}>Recommended Articles</Text>
            </View>

            {/* Heading */}
          </View>

          <View style={styles.container}>
            <FlatList
              data={knowledgeData}
              renderItem={renderItem}
              keyExtractor={item => item._id}
              contentContainerStyle={{ paddingBottom: hp(10) }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: wp(4),
    // backgroundColor: '#f6f9ff',
    flex: 1,
  },
  backArrow: {
    position: 'absolute',
    top: hp(3),
    left: wp(4),
    zIndex: 1,
  },
  headerIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    // marginTop: hp(5),
    marginLeft: hp(-6),
    marginBottom: hp(2),
    // backgroundColor: 'red',
    width: '100%',
  },
  headerIcon: {
    width: wp(10),
    height: wp(10),
    resizeMode: 'contain',
  },
  heading: {
    fontFamily: 'Roboto-Regular',
    fontSize: 20,
    fontWeight: '400',
    color: '#1E64AC',
    textAlign: 'center',
    marginTop: hp(2),
  },
  searchContainer: {
    marginTop: hp(2),
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: hp(0.5),
    paddingHorizontal: wp(4),
    height: hp(5.5),
    // elevation: 2,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    fontFamily: 'Roboto-Regular',
    flex: 1,
    fontSize: hp(1.8),
    color: '#000',
  },
  infoText: {
    fontFamily: 'Roboto-Regular',
    color: '#1E64AC',
    marginVertical: hp(2),
    fontWeight: '400',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: hp(0.8),
    flexDirection: 'row',
    marginBottom: hp(2),
    padding: wp(2),

    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 1, // Android
  },
  image: {
    width: wp(18),
    height: wp(18),
    borderRadius: hp(0.3),
  },
  textContainer: {
    flex: 1,
    marginLeft: wp(3),
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    color: '#000000',
  },
  description: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    marginTop: hp(1),
    color: '#6B7280',
    marginTop: hp(0.5),
    fontWeight: '400',
  },
});

export default CuoreKnowledge;
