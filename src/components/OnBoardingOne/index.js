import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {images, hp, wp, Images, color} from '../../utilities'; // ensure image path is valid

const OnBoarding2 = () => {
  const [gender, setGender] = useState('');
  const [form, setForm] = useState({
    age: '',
    height: '',
    weight: '',
    waist: '',
  });

  const handleChange = (key, value) => {
    setForm(prev => ({...prev, [key]: value}));
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      <SafeAreaView>
        {/* Input Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            placeholderTextColor={'#6B7280'}
            placeholder="Your age"
            value={form.age}
            keyboardType="numeric"
            onChangeText={text => handleChange('age', text)}
            style={styles.input}
          />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              // fontSize={12}
              selectedValue={gender}
              onValueChange={itemValue => setGender(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}>
              <Picker.Item
                style={{fontSize: 14}}
                label="Choose gender"
                value=""
              />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>

          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            placeholderTextColor={'#6B7280'}
            placeholder="Your height in cm"
            value={form.height}
            keyboardType="numeric"
            onChangeText={text => handleChange('height', text)}
            style={styles.input}
          />

          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            placeholderTextColor={'#6B7280'}
            placeholder="Morning, empty stomach weight in kgs"
            value={form.weight}
            keyboardType="numeric"
            onChangeText={text => handleChange('weight', text)}
            style={styles.input}
          />

          <Text style={styles.label}>Waist (in)</Text>
          <TextInput
            placeholderTextColor={'#6B7280'}
            placeholder="Measured just above your belly button"
            value={form.waist}
            keyboardType="numeric"
            onChangeText={text => handleChange('waist', text)}
            style={styles.input}
          />
        </View>

        {/* Next Button */}
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
});
