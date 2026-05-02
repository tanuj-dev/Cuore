import React, { useState, useEffect, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { getKnowledge } from '../../redux/slices';
import ApiError from '../../components/ApiError';
import Loader from '../../components/Loader';
import SkeletonBox from '../../components/SkeletonBox';

const KnowledgeSkeleton = () => {
  const { colors: c } = useAppTheme();
  return (
  <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border, paddingVertical: hp(1) }}>
      <SkeletonBox width={wp(4)} height={hp(3.5)} borderRadius={4} style={{ marginLeft: hp(2) }} />
      <View style={{ flex: 1, alignItems: 'center', marginRight: hp(4) }}>
        <SkeletonBox width={hp(6)} height={hp(6)} borderRadius={hp(3)} style={{ marginBottom: hp(1) }} />
        <SkeletonBox width={180} height={20} borderRadius={6} />
      </View>
    </View>
    <ScrollView scrollEnabled={false} style={{ backgroundColor: c.surface }} contentContainerStyle={{ padding: wp(4) }}>
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={{ backgroundColor: c.card, borderRadius: 12, flexDirection: 'row', marginBottom: hp(2), padding: wp(3), borderWidth: 1, borderColor: c.border }}>
          <SkeletonBox width={wp(18)} height={wp(18)} borderRadius={10} />
          <View style={{ flex: 1, marginLeft: wp(3), justifyContent: 'center', gap: hp(1) }}>
            <SkeletonBox width="80%" height={15} borderRadius={6} />
            <SkeletonBox width="60%" height={13} borderRadius={6} />
          </View>
        </View>
      ))}
    </ScrollView>
  </SafeAreaView>
  );
};

const CuoreKnowledge = ({ navigation }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
  const userId = useSelector(state => state.auth.userId);
  const knowledgeData = useSelector(state => state.knowledge.data?.data?.cards);

  useEffect(() => {
    if (userId && !knowledgeData) {
      dispatch(getKnowledge(userId));
    }
  }, [dispatch, userId, knowledgeData]);

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
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('KnowledgeDetails', {
          details: item?.details || null,
          referenceLinks: item?.referenceLinks || [],
        })
      }
      style={styles.card}
    >
      {item?.images?.[0]?.url && (
        <Image source={{ uri: item.images[0].url }} style={styles.image} />
      )}

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

  const knowledgeLoading = useSelector(state => state.knowledge.loading);

  if (knowledgeLoading && !knowledgeData) {
    return <KnowledgeSkeleton />;
  }

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
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.contentWrap}>
          <View style={styles.headerRow}>
            {refreshing && <Loader />}

            <TouchableOpacity
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Image source={Images.BACK_BUTTON} style={styles.backIcon} />
            </TouchableOpacity>

            <View style={styles.headerIconContainer}>
              <View style={styles.headerIconWrapper}>
                <Image
                  source={Images.DOCTOR_PROFILE}
                  style={styles.headerIcon}
                />
              </View>
              <Text style={styles.heading}>Recommended Articles</Text>
            </View>
          </View>

          <View style={styles.container}>
            <FlatList
              data={knowledgeData}
              renderItem={renderItem}
              keyExtractor={(item, index) => item?._id ?? `card-${index}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = c => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.card,
  },
  scroll: {
    flex: 1,
    backgroundColor: c.card,
  },
  contentWrap: {
    flex: 1,
    backgroundColor: c.surface,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.card,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    ...(Platform.OS === 'android' && { elevation: 0.5 }),
  },
  backButton: {
    paddingHorizontal: hp(1),
    paddingVertical: hp(1),
  },
  backIcon: {
    resizeMode: 'contain',
    height: hp(3.5),
    width: wp(4),
    marginLeft: Platform.OS === 'ios' ? hp(2) : hp(1),
  },
  headerIconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: hp(-6),
    marginBottom: hp(2),
  },
  headerIconWrapper: {
    padding: hp(0.8),
    borderWidth: 3,
    borderColor: '#11418A',
    borderRadius: hp(10),
  },
  headerIcon: {
    width: wp(10),
    height: wp(10),
    resizeMode: 'contain',
  },
  heading: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: c.primary,
    textAlign: 'center',
    marginTop: hp(1.2),
    letterSpacing: 0.3,
  },
  container: {
    padding: wp(4),
    flex: 1,
  },
  listContent: {
    paddingBottom: hp(10),
  },
  card: {
    backgroundColor: c.card,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: hp(2),
    padding: wp(3),
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && { elevation: 1 }),
  },
  image: {
    width: wp(18),
    height: wp(18),
    borderRadius: 10,
  },
  textContainer: {
    flex: 1,
    marginLeft: wp(3),
    justifyContent: 'center',
    minWidth: 0,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#0F172A',
    letterSpacing: 0.1,
    lineHeight: 22,
  },
  description: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    marginTop: hp(0.6),
    color: 'black',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
});

export default CuoreKnowledge;
