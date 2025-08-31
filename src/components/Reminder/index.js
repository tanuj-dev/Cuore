import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Switch,
  Platform
} from 'react-native';
import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Picker} from '@react-native-picker/picker';
import {Images, hp, wp} from '../../utilities';

const Reminder = (props) => {

  const {isVisible, setIsVisible, navigation}=props
  const [reminderText, setReminderText] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] = useState('Daily');
  const [endRepeat, setEndRepeat] = useState('Never');
  const [isMedicine, setIsMedicine] = useState(false);
  const [flagAsMedication, setFlatAsMedication] = useState(false);

  const existingEntries = [
    {name: 'Metformin 500 mg', schedule: 'Daily, 8:00 AM'},
    {name: 'Storvas 10 mg', schedule: 'Daily, 9:00 PM'},
    {name: 'Allegra 180 mg', schedule: "5Jun'24 - 12Jun'24, 6:00 PM"},
  ];

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };

  const handleTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || date;
    setShowTimePicker(false);
    setDate(currentTime);
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={() => setIsVisible(false)}
      style={styles.modal}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
          <ScrollView>
            <View style={{}}>
               <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottomWidth: 1,
                padding: hp(1),
                borderColor: '#E5E7EB',
                  // marginTop:Platform.OS == ' ios' && hp(10)
                
              
              }}>
              <Text style={styles.title}>Add/Delete Entry</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Image
                  style={{resizeMode: 'contain', height: hp(1.5)}}
                  source={Images.CROSS}
                />
              </TouchableOpacity>
            </View>
            </View>
           
            <View style={{padding: hp(0)}}>
              <Text style={[styles.subtitle]}>Existing Entries</Text>
              {existingEntries.map((entry, index) => (
                <View key={index} style={styles.entryCard}>
                  <View style={{flex: 1}}>
                    <Text style={styles.entryText}>{entry.name}</Text>
                    <Text style={styles.entrySubtext}>{entry.schedule}</Text>
                  </View>
                  <TouchableOpacity style={styles.iconButton}>
                    <Image
                      style={{
                        height: hp(3),
                        width: hp(2),
                        resizeMode: 'contain',
                        // tintColor: 'red',
                      }}
                      source={Images.EDIT}></Image>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton}>
                    <Image
                      style={{
                        height: hp(3),
                        width: hp(2),
                        resizeMode: 'contain',
                      }}
                      source={Images.DELETE}></Image>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.divider} />
              <Text style={styles.subtitle}>Add New Entry</Text>
              <View style={{paddingHorizontal: hp(3)}}>
                <View style={styles.inputGroup}>  
                  <TextInput
                    placeholderTextColor={'#6B7280'}
                    placeholder="Enter reminder"
                    value={reminderText}
                    onChangeText={setReminderText}
                    style={styles.input}
                  />
                  <View style={{flexDirection: 'row', marginVertical: hp(0.5)}}>
                    <Image
                      style={{
                        height: hp(3),
                        width: wp(3),
                        resizeMode: 'contain',
                        marginRight: hp(1),
                      }}
                      source={Images.WARNING}></Image>
                    <Text style={styles.infoText}>
                      Use '/' to separate reminders for the same time
                    </Text>
                  </View>
                </View>

                <View style={styles.dateTimeRow}>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={styles.dateTimeInput}
                    activeOpacity={0.7}>
                    <Text>
                      {date
                        ? date.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : 'DD/MM/YYYY'}
                    </Text>
                    <Image
                      style={{
                        height: hp(2),
                        width: wp(5),
                        resizeMode: 'contain',
                        marginLeft: 8,
                      }}
                      source={Images.CALANDER}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowTimePicker(true)}
                    style={styles.dateTimeInput}
                    activeOpacity={0.7}>
                    <Text>
                      {date
                        ? date.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'HH:MM'}
                    </Text>
                    <Image
                      style={{
                        height: hp(2),
                        width: wp(5),
                        resizeMode: 'contain',
                        marginLeft: 8,
                      }}
                      source={Images.CLOCK}
                    />
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
                {showTimePicker && (
                  <DateTimePicker
                    value={date}
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
                  />
                )}

                <View
                  style={{
                    // flexDirection: 'row',
                    borderWidth: 1,
                    alignItems: 'center',
                    borderColor: '#D1D5DB',
                    borderRadius: hp(1),
                    overflow: 'hidden',
                    backgroundColor: '#F9FAFB',
                    marginTop: hp(1),
                  }}>
                  {/* <Text style={{position: 'absolute,'}}>hh</Text> */}
                 <Picker
                    selectedValue={repeat}
                    onValueChange={itemValue => setRepeat(itemValue)}
                    style={{
                      width: '100%',
                    }}
                    dropdownIconColor="#4B5563" // for Android
                    mode="dropdown">
              
                    {/* Can also use 'dialog' if preferred */}
                   <Picker.Item label="Daily" value="Daily" />
                    <Picker.Item label="Weekly" value="Weekly" />
                    <Picker.Item label="Monthly" value="Monthly" />
                  </Picker> 
                </View>

                <View
                  style={{
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    borderRadius: hp(0.5),
                    marginTop: hp(2),
                    marginBottom: hp(4),
                  }}>
                  <Picker
                    selectedValue={endRepeat}
                    style={styles.picker}
                    onValueChange={itemValue => setEndRepeat(itemValue)}>
                    <Picker.Item label="Never" value="Never" />
                    <Picker.Item label="On Date" value="OnDate" />
                  </Picker>
                </View>

                <View style={styles.switchRow}>
                  <TouchableOpacity
                    onPress={() => setFlatAsMedication(!flagAsMedication)}
                    style={{
                      height: hp(3),
                      width: wp(6),
                      borderWidth: 1,
                      borderRadius: hp(0.5),
                      borderColor: '#D1D5DB',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <View
                      style={{
                        height: hp(2),
                        width: wp(4),
                        // borderWidth: 1,
                        borderRadius: hp(1),
                        backgroundColor: flagAsMedication ? '#1E64AC' : '',
                      }}></View>
                  </TouchableOpacity>
                  <Text style={styles.switchLabel}>Flag as medication</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setIsVisible(false)}
                  style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add Entry</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {justifyContent: 'flex-end', margin: 0},
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    // borderTopLeftRadius: 20,
    // borderTopRightRadius: 20,
    // padding: 20,
    height: '93%',
    marginBottom: 60,
  },
  title: {fontSize: 18, fontWeight: '400', marginBottom: 10, color: '#000000'},
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    marginVertical: 10,
    marginLeft: hp(1),
    color: '#000000',
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginVertical: 5,
    marginLeft: hp(2),
  },
  entryText: {fontSize: 14, fontWeight: '400', color: '#000000'},
  entrySubtext: {fontSize: 14, color: '#4B5563'},
  iconButton: {paddingHorizontal: 10},
  icon: {fontSize: 16},
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 15,
    marginHorizontal: hp(2),
  },
  inputGroup: {
    marginBottom: 2,
    // paddingHorizontal: hp(2.5),
    // backgroundColor: 'red',
  },
  input: {
    // paddingVertical: hp(3),
    height: hp(6),
    fontSize: hp(2),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    // padding: hp(2),
  },
  infoText: {fontSize: 14, color: '#6B7280', marginTop: 4},
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  dateTimeInput: {
    // width: hp(10),
    // backgroundColor: 'red',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    flex: 1,
    marginRight: 10,
    justifyContent: 'space-between',
  },
  pickerRow: {
    // flex: 1,
    // backgroundColor: 'red',
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    // marginBottom: 40,
    // borderWidth: 1,
    height: hp(15),
  },
  picker: {margin: 0},
  switchRow: {flexDirection: 'row', alignItems: 'center', marginTop: -hp(3)},
  switchLabel: {marginLeft: 10, fontSize: 14},
  addButton: {
    marginTop: hp(1.5),
    alignSelf: 'center',
    width: hp(12),
    // height: hp(),
    backgroundColor: '#1E64AC',
    borderRadius: 8,
    paddingVertical: hp(0.8),
    alignItems: 'center',
  },
  addButtonText: {color: '#fff', fontSize: 15, fontWeight: '400'},
});

export default Reminder;
