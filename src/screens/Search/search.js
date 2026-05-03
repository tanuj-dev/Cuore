import React, { useState, useEffect, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
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
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

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
  }, [debouncedQuery, dispatch]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Recipe', { recipeData: item })}
      style={[
        styles.card,
        {
          borderLeftColor:
            item?.dietPreference === 'Non-Veg' ? '#DC2626' : '#16A34A',
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item?.name}</Text>
        {/* {item.dietPreference && (
          <Text style={styles.tag}>{item?.dietPreference}</Text>
        )} */}
        {item?.dietPreference === 'Eggetarian' ? (
          <View style={styles.eggBadge}>
            <Image style={styles.eggIcon} source={Images.EGG} />
            <Text style={styles.eggText}>Egg</Text>
          </View>
        ) : (
          <Image
            style={styles.dietIcon}
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
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Prep Time</Text>
          <Text style={styles.metaValue}>
            {item?.prepTime?.replace(/\t/g, '') || 'N/A'}
          </Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Cook Time</Text>
          <Text style={styles.metaValue}>{item?.cookTime || 0}</Text>
        </View>
        {/* <View styl3e={styles.metaDivider} /> */}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Search Recipes</Text>
          <View style={styles.searchBar}>
            <Image style={styles.searchIcon} source={Images.SEARCH} />
            <TextInput
              style={styles.input}
              placeholder="Type a dish name..."
              placeholderTextColor={c.inputPlaceholder}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          {loading && (
            <ActivityIndicator
              style={styles.loader}
              size="small"
              color="#11418A"
            />
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <FlatList
          data={results}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

export default Search;
const createStyles = c => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.surface,
  },
  container: {
    flex: 1,
    padding: hp(2),
    backgroundColor: c.surface,
  },
  header: {
    paddingBottom: hp(1),
  },
  list: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    marginBottom: hp(2.5),
    color: c.text,
    letterSpacing: -0.3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    backgroundColor: c.card,
    paddingLeft: wp(3),
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: wp(2),
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: c.text,
  },
  searchIcon: {
    width: wp(4),
    height: wp(4),
    tintColor: c.icon,
    resizeMode: 'contain',
  },
  loader: {
    marginTop: hp(2),
  },
  listContent: {
    paddingTop: hp(2),
    paddingBottom: hp(3),
  },
  errorText: {
    fontFamily: 'Poppins-Medium',
    color: '#EF4444',
    marginTop: hp(1.5),
    fontSize: 14,
  },
  card: {
    backgroundColor: c.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderLeftWidth: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  cardTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: c.text,
    width: wp(65),
    letterSpacing: 0.1,
  },
  eggBadge: {
    backgroundColor: '#FEF9C3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: 8,
    justifyContent: 'center',
  },
  eggIcon: {
    height: hp(2.5),
    width: wp(3),
    resizeMode: 'contain',
    marginRight: wp(1),
  },
  eggText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: '#A16207',
  },
  dietIcon: {
    height: hp(2.5),
    width: wp(13),
    resizeMode: 'contain',
  },
  tag: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  subText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 9,
    color: c.subText,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1.5),
    paddingTop: hp(1.2),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaCol: {
    flex: 1,
    alignItems: 'center',
  },
  metaDivider: {
    width: 1,
    height: hp(4),
    backgroundColor: '#E2E8F0',
  },
  metaLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: c.tabInactive,
    marginBottom: 3,
  },
  metaValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: c.primary,
  },
});
