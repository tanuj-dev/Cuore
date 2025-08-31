import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import FilePickerManager from 'react-native-file-picker';
import {hp, wp, Images, color} from '../../utilities';
import images from '../../utilities/Images';

const HealthRecords = ({navigation}) => {
  const [recordName, setRecordName] = useState('');
  const [recordDate, setRecordDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPrescription, setIsPrescription] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Prescriptions');

  const [records, setRecords] = useState([
    {
      id: 1,
      name: 'Prescription',
      date: '02-Jan-2024',
      type: 'Prescriptions',
    },
    {
      id: 2,
      name: 'X-Ray Report',
      date: '15-Aug-2023',
      type: 'Diagnostics',
    },
    {
      id: 3,
      name: 'Blood Test Report',
      date: '18-Feb-2023',
      type: 'Diagnostics',
    },
  ]);

  const pickDocument = async () => {
    try {
      const options = {
        title: 'Select File',
        chooseFileButtonTitle: 'Select',
        storageOptions: {
          skipBackup: true,
          path: 'downloads',
        },
      };

      FilePickerManager.showFilePicker(options, response => {
        console.log('Response:', response);

        if (response.error) {
          console.log('Error:', response.error);
          Alert.alert('Error', response.error);
        } else if (response.didCancel) {
          console.log('User cancelled');
        } else {
          // For Android - response.uri contains the file path
          // For iOS - response.uri is the file identifier
          const fileUri = response.uri || response.path;
          const fileName = response.fileName || response.name;

          setSelectedFile({
            uri: fileUri,
            name: fileName,
            type: response.type,
            size: response.size,
          });
        }
      });
    } catch (err) {
      console.log('Document picker error:', err);
      Alert.alert('Error', 'Failed to open file picker');
    }
  };

  const handleSubmit = () => {
    if (!recordName || !recordDate || !selectedFile) {
      Alert.alert('Incomplete', 'Please fill all fields and upload a file');
      return;
    }

    const newRecord = {
      id: Date.now(),
      name: recordName,
      date: recordDate,
      type: isPrescription ? 'Prescriptions' : 'Diagnostics',
    };

    setRecords([newRecord, ...records]);
    setRecordName('');
    setRecordDate('');
    setSelectedFile(null);
    setIsPrescription(false);
  };

  const handleDelete = id => {
    setRecords(records.filter(item => item.id !== id));
  };

  const filteredRecords = records.filter(record => record.type === selectedTab);

  return (
    <ScrollView>
      <View style={{flex: 1}}>
         <View style={{
          backgroundColor: '#FFFFFF',
          elevation: 1,
      }}>
 <View
        style={{
       
        
          alignItems: 'center',
          padding: hp(2),
          flexDirection: 'row',
           marginTop:Platform.OS =='ios'&& hp(5),
        }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={Images.BACK_BUTTON}
            style={{
              height: hp(3),
              width: wp(4),
              resizeMode: 'contain',
              tintColor: '#000000',
            }}
          />
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: 'Roboto-Regular',
            fontSize: 20,
            fontWeight: '400',
            color: '#000000',
       marginLeft: hp(2),
          }}>
         Health Records
        </Text>
      </View>
      </View>
        <View style={styles.container}>
          <Text style={styles.header}>Upload Records</Text>
          <View
            style={{padding: hp(1), backgroundColor: '#FFFFFF', elevation: 2}}>
            <Text style={styles.upperInputText}>Record Name</Text>
            <TextInput
              placeholderTextColor={'#6B7280'}
              style={styles.input}
              placeholder="Enter record name"
              value={recordName}
              onChangeText={setRecordName}
            />
            <Text style={styles.upperInputText}>Record Date</Text>

            <TextInput
              placeholderTextColor={'#6B7280'}
              style={styles.input}
              placeholder="DD/MMM/YYYY"
              value={recordDate}
              onChangeText={setRecordDate}
            />

            <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
              <Image
                source={Images.UPLOAD}
                style={{
                  height: hp(4),
                  width: wp(7),
                  resizeMode: 'contain',
                  // tintColor: '#000000',
                }}
              />
              <Text style={{fontSize: 14, fontWeight: '400', color: '#6B7280'}}>
                Upload Record
              </Text>
              <Text style={styles.fileText}>
                {selectedFile
                  ? selectedFile.fileName || selectedFile.name
                  : 'PNG, JPG, PDF up to 10MB'}
              </Text>

              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: '400',
                  color: '#374151',
                  marginTop: hp(1),
                }}>
                Make sure the uploaded health record belongs to you
              </Text>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: hp(1),
              }}>
              <TouchableOpacity
                onPress={() => setIsPrescription(!isPrescription)}>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: '#9CA3AF',
                    backgroundColor: isPrescription ? 'white' : '#1E64AC',
                    height: hp(3),
                    width: wp(6),
                    borderRadius: hp(0.9),
                  }}></View>
              </TouchableOpacity>
              <View style={styles.checkboxRow}>
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    color: '#4B5563',
                    fontWeight: '400',
                  }}>
                  Mark as Prescription or Doctor’s Note
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={{color: 'white', fontWeight: '600'}}>Submit</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <Text
            style={{
              marginTop: hp(2),
              color: '#000',
              fontfamily: 'Roboto-Regular',
              fontSize: 18,
              fontStyle: 'normal',
              fontWeight: '400',
            }}>
            View Records
          </Text>
          <View style={styles.tabs}>
            {['Prescriptions', 'Diagnostics'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, selectedTab === tab && styles.activeTab]}
                onPress={() => setSelectedTab(tab)}>
                <Text
                  style={
                    selectedTab === tab ? styles.activeText : styles.tabText
                  }>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Record List */}
          <FlatList
            data={records}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => (
              <View style={styles.recordItem}>
                <View style={{flex: 1}}>
                  <Text style={styles.recordTitle}>{item.name}</Text>
                  <Text style={styles.recordDate}>{item.date}</Text>
                </View>
                <View style={{flexDirection: 'row'}}>
                  <TouchableOpacity

                  // onPress={() => handleDelete(item.id)}
                  >
                    <Image
                      style={{
                        width: wp(4),
                        height: hp(3),
                        resizeMode: 'contain',
                      }}
                      source={Images.EDIT}></Image>
                  </TouchableOpacity>
                  <TouchableOpacity
                  // onPress={

                  // () => handleDelete(item.id)}
                  >
                    <Image
                      style={{
                        width: wp(13),
                        height: hp(3),
                        resizeMode: 'contain',
                        marginLeft: hp(3),
                      }}
                      source={Images.EYE}></Image>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Image
                      style={{
                        width: wp(4),
                        height: hp(3),
                        resizeMode: 'contain',
                      }}
                      source={Images.DELETE}></Image>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default HealthRecords;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    flex: 1,
  },
  header: {
    fontFamily: 'Roboto-Regular',
    fontSize: 18,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 12,
  },
  input: {
    fontFamily: 'Roboto-Regular',
    borderWidth: 1,
    fontSize: 16,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  fileText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
    fontWeight: '400',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#1E64AC',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  tabs: {
    marginTop: hp(2),
    flexDirection: 'row',
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: 6,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTab: {fontFamily: 'Roboto-Regular', backgroundColor: '#1E64AC'},
  tabText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontWeight: '400',
    color: '#FFFFFF',
  },
  activeText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontWeight: '400',
    fontWeight: 14,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(2),
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    marginBottom: 8,
  },
  recordTitle: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    fontSize: 14,
    color: '#000000',
  },
  recordDate: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#6B7280',
    fontWeight: 400,
  },
  upperInputText: {
    fontFamily: 'Roboto-Regular',
    marginBottom: hp(1),
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
  },
});
