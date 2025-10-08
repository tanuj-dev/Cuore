import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  ScrollView,
} from 'react-native';

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

const OnBoarding2 = ({ onFormChange, initialData = {} }) => {
  const [gender, setGender] = useState('');
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [form, setForm] = useState({
    age: '',
    height_cm: '',
    weight_kg: '',
    waist_cm: '',
  });

  // Prefill data
  useEffect(() => {
    if (Object.keys(initialData).length) {
      setForm({
        age: initialData.age ?? '',
        height_cm: initialData.height_cm ?? '',
        weight_kg: initialData.weight_kg ?? '',
        waist_cm: initialData.waist_cm ?? '',
      });
      setGender(initialData.gender ?? '');
    }
  }, [initialData]);

  // Handle numeric conversion
  const numericKeys = ['age', 'height_cm', 'weight_kg', 'waist_cm'];

  const handleChange = (key, value) => {
    let newValue = value;

    if (numericKeys.includes(key)) {
      // Remove any non-digit and non-dot characters
      const filtered = value.replace(/[^0-9.]/g, '');
      // If filtered is empty, store null; else convert to number
      newValue = filtered === '' ? null : Number(filtered);
    }

    const updatedForm = { ...form, [key]: newValue };
    setForm(updatedForm);

    onFormChange?.({ ...updatedForm, gender });
  };

  const handleGenderSelect = value => {
    setGender(value);
    setShowGenderModal(false);
    onFormChange?.({ ...form, gender: value });
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <SafeAreaView>
        <View style={styles.card}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            placeholder="Your age"
            placeholderTextColor="#6B7280"
            value={form.age?.toString() || ''}
            keyboardType="numeric"
            onChangeText={text => handleChange('age', text)}
            style={styles.input}
          />

          <Text style={styles.label}>Gender</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowGenderModal(true)}
          >
            <Text style={{ color: '#6B7280' }}>
              {gender
                ? gender.charAt(0).toUpperCase() + gender.slice(1)
                : 'Choose gender'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            placeholder="Your height in cm"
            placeholderTextColor="#6B7280"
            value={form.height_cm?.toString() || ''}
            keyboardType="numeric"
            onChangeText={text => handleChange('height_cm', text)}
            style={styles.input}
          />

          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            placeholder="Morning, empty stomach weight in kgs"
            placeholderTextColor="#6B7280"
            value={form.weight_kg?.toString() || ''}
            keyboardType="numeric"
            onChangeText={text => handleChange('weight_kg', text)}
            style={styles.input}
          />

          <Text style={styles.label}>Waist (in)</Text>
          <TextInput
            placeholder="Measured just above your belly button"
            placeholderTextColor="#6B7280"
            value={form.waist_cm?.toString() || ''}
            keyboardType="numeric"
            onChangeText={text => handleChange('waist_cm', text)}
            style={styles.input}
          />
        </View>

        {/* Gender Modal */}
        <Modal
          visible={showGenderModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGenderModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <FlatList
                data={genderOptions}
                keyExtractor={item => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleGenderSelect(item.value)}
                  >
                    <Text style={styles.modalItemText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowGenderModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ScrollView>
  );
};

export default OnBoarding2;

// --- Styles (unchanged)
const styles = StyleSheet.create({
  container: { padding: 2, backgroundColor: '#fff', flexGrow: 1 },
  card: {
    backgroundColor: '#FFFFFF',
    elevation: 3,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  label: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 4,
    color: '#374151',
  },
  input: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  modalItem: { paddingVertical: 12 },
  modalItemText: { fontSize: 14, color: '#000' },
  modalCancel: { marginTop: 10, alignItems: 'center' },
  modalCancelText: { color: '#007bff', fontSize: 14 },
});
