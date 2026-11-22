import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { hp, wp } from '../../utilities';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
import { ChevronRight } from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { getKnowledge } from '../../redux/slices';
import ApiError from '../../components/ApiError';
import SkeletonBox from '../../components/SkeletonBox';

const KnowledgeSkeleton = ({ onBack }) => (
  <View style={{ flex: 1, backgroundColor: '#F4F7FB' }}>
    <HeroHeader title="Cuore Insight" subtitle="Recommended articles for you." onBack={onBack} />
    <ScrollView scrollEnabled={false} style={{ backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: wp(4) }}>
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={{ backgroundColor: '#FFF', borderRadius: 12, flexDirection: 'row', marginBottom: hp(2), padding: wp(3), borderWidth: 1, borderColor: '#E2E8F0' }}>
          <SkeletonBox width={wp(18)} height={wp(18)} borderRadius={10} />
          <View style={{ flex: 1, marginLeft: wp(3), justifyContent: 'center', gap: hp(1) }}>
            <SkeletonBox width="80%" height={15} borderRadius={6} />
            <SkeletonBox width="60%" height={13} borderRadius={6} />
          </View>
        </View>
      ))}
    </ScrollView>
  </View>
);

const CuoreKnowledge = ({ navigation }) => {
  useLightStatusBar();
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

  const handleGoBack = () => navigation.goBack();

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('KnowledgeDetails', {
          details: item?.details || null,
          title: item?.title || '',
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
      <ChevronRight size={18} color="#94A3B8" />
    </TouchableOpacity>
  );

  const knowledgeLoading = useSelector(state => state.knowledge.loading);

  if (knowledgeLoading && !knowledgeData) {
    return <KnowledgeSkeleton onBack={handleGoBack} />;
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
    <View style={styles.screen}>
      <HeroHeader
        title="Cuore Insight"
        subtitle="Recommended articles for you."
        onBack={handleGoBack}
      />
      {/* One list, not a FlatList inside a ScrollView: the nested list could not virtualise. */}
      <FlatList
        data={knowledgeData}
        renderItem={renderItem}
        keyExtractor={(item, index) => item?._id ?? `card-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1E64AC"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  listContent: { padding: wp(4), paddingBottom: hp(10) },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  image: { width: wp(18), height: wp(18), borderRadius: 12, backgroundColor: '#F4F7FB' },
  textContainer: { flex: 1, marginLeft: 12, marginRight: 8, justifyContent: 'center', minWidth: 0 },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#0F172A',
    letterSpacing: 0.1,
    lineHeight: 22,
  },
  description: { fontFamily: 'Poppins-Regular', fontSize: 13, marginTop: 2, color: '#64748B', lineHeight: 19 },
});

export default CuoreKnowledge;
