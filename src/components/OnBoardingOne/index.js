import React, { useState } from 'react';
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

const OnBoarding2 = () => {
  const [gender, setGender] = useState('');
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [form, setForm] = useState({
    age: '',
    height: '',
    weight: '',
    waist: '',
  });

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleGenderSelect = value => {
    setGender(value);
    setShowGenderModal(false);
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
            value={form.age}
            keyboardType="numeric"
            onChangeText={text => handleChange('age', text)}
            style={styles.input}
          />

          <Text style={styles.label}>Gender</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowGenderModal(true)}
          >
            <Text style={{ color: gender ? '#6B7280' : '#6B7280' }}>
              {gender
                ? gender.charAt(0).toUpperCase() + gender.slice(1)
                : 'Choose gender'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            placeholder="Your height in cm"
            placeholderTextColor="#6B7280"
            value={form.height}
            keyboardType="numeric"
            onChangeText={text => handleChange('height', text)}
            style={styles.input}
          />

          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            placeholder="Morning, empty stomach weight in kgs"
            placeholderTextColor="#6B7280"
            value={form.weight}
            keyboardType="numeric"
            onChangeText={text => handleChange('weight', text)}
            style={styles.input}
          />

          <Text style={styles.label}>Waist (in)</Text>
          <TextInput
            placeholder="Measured just above your belly button"
            placeholderTextColor="#6B7280"
            value={form.waist}
            keyboardType="numeric"
            onChangeText={text => handleChange('waist', text)}
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

const styles = StyleSheet.create({
  container: {
    padding: 2,
    backgroundColor: '#fff',
    flexGrow: 1,
  },

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
    // backgroundColor:'red',

    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  pickerWrapper: {
    // color: 'red',
    justifyContent: 'center',
    height: 40,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    marginBottom: 14,
  },
  picker: {
    fontSize: 14,
    color: '#6B7280',
    height: 60,
    width: '100%',
    // marginTop:hp
  },
  pickerItem: {
    fontSize: 14, // 👈 Smaller font size
    color: '#000',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    fontFamily: 'Roboto-Regular',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  modalItem: {
    paddingVertical: 12,
  },
  modalItemText: {
    fontSize: 14,
    color: '#000',
  },
  modalCancel: {
    marginTop: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#007bff',
    fontSize: 14,
  },
});
