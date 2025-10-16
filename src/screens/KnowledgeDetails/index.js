import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';

const KnowledgeDetails = ({ navigation, route }) => {
  const { title, points = [], takeaway = '' } = route.params || {};

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* 🔹 Header */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#FFFFFF',
          paddingVertical: Platform.OS === 'ios' ? hp(4) : hp(3),
          elevation: 2,
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          style={{
            marginTop: Platform.OS === 'ios' ? hp(4) : hp(0),
            paddingHorizontal: hp(2),
          }}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={Images.BACK_BUTTON}
            style={{
              resizeMode: 'contain',
              marginLeft: Platform.OS === 'ios' ? hp(0) : hp(0.2),
              height: hp(3),
              width: wp(4),
            }}
          />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: 'Roboto-Medium',
            fontSize: 18,
            fontWeight: '500',
            color: '#1E64AC',
            marginTop: Platform.OS === 'ios' ? hp(4) : hp(0),
          }}
        >
          Knowledge Details
        </Text>
      </View>

      {/* 🔹 Scrollable Content */}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Points List */}
        {points.length > 0 ? (
          points.map((item, index) => (
            <View key={index} style={styles.pointContainer}>
              <Text style={styles.pointHeading}>{item.heading}</Text>
              <Text style={styles.pointText}>{item.text}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No details available.</Text>
        )}

        {/* Takeaway */}
        {takeaway ? (
          <View style={styles.takeawayContainer}>
            <Text style={styles.takeawayTitle}>Key Takeaway</Text>
            <Text style={styles.takeawayText}>{takeaway}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: wp(5),
    flex: 1,
  },
  title: {
    fontFamily: 'Roboto-Bold',
    fontSize: 18,
    marginBottom: hp(2),
    color: '#1E64AC',
  },
  pointContainer: {
    marginBottom: hp(2),
    backgroundColor: '#EFF6FF',
    borderRadius: wp(2),
    padding: wp(3),
    borderLeftWidth: 3,
    borderLeftColor: '#1E64AC',
  },
  pointHeading: {
    fontFamily: 'Roboto-Medium',
    fontSize: 15,
    color: '#1E64AC',
    marginBottom: hp(0.8),
  },
  pointText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  takeawayContainer: {
    borderLeftWidth: 3,
    borderLeftColor: '#166534',
    marginTop: hp(3),
    padding: wp(4),
    backgroundColor: '#DCFCE7',
    borderRadius: wp(2),
    marginBottom: hp(5),
  },
  takeawayTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 15,
    color: '#166534',
    marginBottom: hp(1),
  },
  takeawayText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#14532D',
  },
  noDataText: {
    fontFamily: 'Roboto-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: hp(2),
  },
});

export default KnowledgeDetails;
