import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useSelector } from 'react-redux';

/**
 * Redux Debugger Component
 * Shows the entire Redux store state in a modal
 * Usage: Add <ReduxDebugger /> anywhere in your app
 */
const ReduxDebugger = () => {
  const [visible, setVisible] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  // Get all store slices
  const auth = useSelector(state => state.auth);
  const createAccount = useSelector(state => state.createAccount);
  const onboarding = useSelector(state => state.onboarding);
  const profile = useSelector(state => state.profile);
  const onboardingdata = useSelector(state => state.onboardingdata);
  const reassessment = useSelector(state => state.reassessment);
  const home = useSelector(state => state.home);
  const cuoreScore = useSelector(state => state.cuoreScore);
  const nourish = useSelector(state => state.nourish);
  const builder = useSelector(state => state.builder);
  const fitness = useSelector(state => state.fitness);
  const knowledge = useSelector(state => state.knowledge);
  const mind = useSelector(state => state.mind);
  const tobacco = useSelector(state => state.tobacco);
  const predictData = useSelector(state => state.predictData);
  const health = useSelector(state => state.health);
  const doctors = useSelector(state => state.doctors);

  const storeData = {
    auth,
    createAccount,
    onboarding,
    profile,
    onboardingdata,
    reassessment,
    home,
    cuoreScore,
    nourish,
    builder,
    fitness,
    knowledge,
    mind,
    tobacco,
    predictData,
    health,
    doctors,
  };

  const toggleSection = section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderSection = (title, data) => {
    const isExpanded = expandedSections[title];
    return (
      <View key={title} style={styles.section}>
        <TouchableOpacity
          onPress={() => toggleSection(title)}
          style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isExpanded ? '▼' : '▶'} {title}
          </Text>
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.sectionContent}>
            <Text style={styles.jsonText}>
              {JSON.stringify(data, null, 2)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      {/* Floating Debug Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setVisible(true)}>
        <Text style={styles.floatingButtonText}>🐛</Text>
      </TouchableOpacity>

      {/* Debug Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Redux Store Debugger</Text>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {Object.entries(storeData).map(([key, value]) =>
              renderSection(key, value),
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => {
                console.log('📦 Full Redux Store:', storeData);
                alert('Store logged to console!');
              }}
              style={styles.logButton}>
              <Text style={styles.logButtonText}>Log to Console</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  floatingButtonText: {
    fontSize: 30,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2D2D2D',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionHeader: {
    padding: 12,
    backgroundColor: '#2D2D2D',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  sectionContent: {
    padding: 12,
    backgroundColor: '#1E1E1E',
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#E0E0E0',
  },
  footer: {
    padding: 16,
    backgroundColor: '#2D2D2D',
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  logButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReduxDebugger;

