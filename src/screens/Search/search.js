import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { searchBuilderThunk } from '../../redux/slices';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hp, wp, Images } from '../../utilities';

const Search = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  // Debounce input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 500);
    return () => clearTimeout(timeout);
  }, [query]);

  // Trigger search when debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery) return;
    const fetchResults = async () => {
      setLoading(true);
      setError('');
      setResults([]);
      try {
        const res = await dispatch(searchBuilderThunk(debouncedQuery)).unwrap();
        if (res.status === 200) {
          setResults(res?.data?.recipes || []);
        } else {
          setError('Unexpected response');
        }
      } catch (err) {
        setError(err?.data?.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [debouncedQuery]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Recipe', { recipeData: item })}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item?.name}</Text>
        {/* {item.dietPreference && (
          <Text style={styles.tag}>{item?.dietPreference}</Text>
        )} */}
        {item?.dietPreference == 'Eggetarian' ? (
          <View
            style={{
              backgroundColor: '#fff8c3',
              flexDirection: 'row',
              alignItems: 'center',
              // marginRight: hp(2),
              paddingHorizontal: wp(2),
              borderRadius: hp(1),
              justifyContent: 'center',
            }}
          >
            <Image
              style={{
                height: hp(2.5),
                width: wp(3),
                resizeMode: 'contain',
                marginRight: hp(0),
              }}
              source={Images.EGG}
            />
            <Text style={{ fontSize: hp(1.8), color: '#c68a40', fontSize: 10 }}>
              Egg
            </Text>
          </View>
        ) : (
          <Image
            style={{
              height: hp(2.5),
              width: wp(13),
              resizeMode: 'contain',
            }}
            source={
              item?.dietPreference === 'Non-Veg' ? Images.NON_VEG : Images.VEG
            }
          />
        )}
      </View>

      {/* <Text style={styles.subText}>
        {item.cuisine} • {item.mealTime}
      </Text> */}

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          Prep: {item?.prepTime?.replace(/\t/g, '') || 'N/A'}
        </Text>
        <Text style={styles.metaText}>
          Ingredients: {item?.ingredients?.length || 0}
        </Text>
        <Text style={styles.metaText}>
          Steps: {item?.instructions?.length || 0}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Search Recipes</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: hp(1),
            backgroundColor: '#FFFFFF',
          }}
        >
          <Image style={styles.searchIcon} source={Images.SEARCH} />
          <TextInput
            style={styles.input}
            placeholder="Type a dish name..."
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <FlatList
          data={results}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ marginTop: 20 }}
        />
      </View>
    </SafeAreaView>
  );
};

export default Search;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: hp(2),
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: '#9CA3AF',
  },
  input: {
    // flex: 1,
    left: wp(3),
    // height: hp(5.5),
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#9CA3AF',
    // backgroundColor: 'red',
    flex: 1,
  },
  errorText: {
    color: '#EF4444',
    marginTop: 10,
    fontSize: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#17AD8D',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    // backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    // width: wp(70),
  },
  cardTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    // backgroundColor: '#F3F4F6',
    width: wp(70),
  },
  tag: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  subText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: hp(0.5),
  },
  metaText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 11,
    color: '#374151',
  },
  searchIcon: {
    width: wp(4),
    height: wp(4),
    tintColor: '#9CA3AF',
    // position: 'absolute',
    // top: hp(2),
    left: wp(3),
    resizeMode: 'contain',
    zIndex: 1,
  },
});
