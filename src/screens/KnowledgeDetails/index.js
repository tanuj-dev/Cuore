import React from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Text,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { hp } from '../../utilities';
import RenderHTML from 'react-native-render-html';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';

const KnowledgeDetails = ({ navigation, route }) => {
  const { details, referenceLinks, title } = route?.params || {};
  const { width } = useWindowDimensions();
  useLightStatusBar();
  const detailsHtml =
    typeof details === 'string' ? details : '<p>No content available.</p>';

  return (
    <View style={styles.screen}>
      <HeroHeader
        title="Cuore Insight"
        subtitle={title || 'Article'}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="never"
      >
        <View style={styles.contentWrap}>
          <View style={styles.container}>
            <RenderHTML
              contentWidth={width}
              source={{ html: detailsHtml }}
              tagsStyles={{
                p: {
                  fontSize: 15,
                  color: '#475569',
                  lineHeight: 24,
                  fontFamily: 'Poppins-Regular',
                  marginTop: 0,
                  marginBottom: 12,
                },
                ul: {
                  paddingLeft: 24,
                  marginBottom: 16,
                  marginTop: 8,
                },
                ol: {
                  paddingLeft: 24,
                  marginBottom: 16,
                  marginTop: 8,
                },
                li: {
                  marginBottom: 10,
                  fontSize: 15,
                  color: '#475569',
                  lineHeight: 24,
                  fontFamily: 'Poppins-Regular',
                  paddingLeft: 4,
                },
                strong: {
                  fontFamily: 'Poppins-SemiBold',
                  color: '#0F172A',
                },
                em: {
                  fontStyle: 'italic',
                  color: '#64748B',
                  fontFamily: 'Poppins-Regular',
                },
                h1: {
                  fontSize: 24,
                  fontFamily: 'Poppins-SemiBold',
                  marginBottom: 14,
                  marginTop: 4,
                  color: '#0F172A',
                },
                h2: {
                  fontSize: 20,
                  fontFamily: 'Poppins-SemiBold',
                  marginBottom: 12,
                  marginTop: 4,
                  color: '#0F172A',
                },
                h3: {
                  fontSize: 18,
                  fontFamily: 'Poppins-Medium',
                  marginBottom: 10,
                  marginTop: 4,
                  color: '#0F172A',
                },
                h4: {
                  fontSize: 16,
                  fontFamily: 'Poppins-Medium',
                  marginBottom: 8,
                  marginTop: 4,
                  color: '#0F172A',
                },
              }}
            />

            {referenceLinks?.length > 0 && (
              <View style={styles.referencesContainer}>
                <Text style={styles.referencesLabel}>References</Text>
                {referenceLinks.map((link, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => Linking.openURL(link)}
                    style={styles.referenceRow}
                    activeOpacity={0.7}
                  >
                    <ExternalLink size={15} color="#1E64AC" />
                    <Text style={styles.referenceLink} numberOfLines={2}>
                      {link}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  scroll: { flex: 1 },
  listContent: { padding: 16, paddingBottom: hp(6) },
  contentWrap: { flex: 1 },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
  },
  referencesContainer: {
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  referencesLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 8,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
  },
  referenceLink: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13.5,
    color: '#1E64AC',
    lineHeight: 20,
  },
});

export default KnowledgeDetails;
