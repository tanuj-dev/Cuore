import React, { useState, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
} from 'react-native';
import { hp, wp, color, Images } from '../../utilities';
import { SafeAreaView } from 'react-native-safe-area-context';
// import {Ionicons} from '@expo/vector-icons'; // Optional icon pack

const Chat = () => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const [messages, setMessages] = useState([
    {
      type: 'info',
      text: 'Cuore Assist offers personalized responses based on your Health Records and Assessments. It does not provide a medical diagnosis or recommend any medication',
    },
    { type: 'queriesLeft', count: 9 },
    {
      type: 'bot',
      text: 'Hello Mike! How can I help you today?',
      time: '10:30 AM',
    },
    { type: 'user', text: 'How is my overall health?', time: '10:30 AM' },
    {
      type: 'bot',
      text: `You have Diabetes for the last 8 years, you are taking metformin twice daily which has kept your sugar levels well controlled.\nYour nutrition is good, but you need to increase your exercise - daily 30 min walk is recommended ......`,
      time: '10:31 AM',
    },
  ]);

  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setMessages(prev => [
      ...prev,
      { type: 'user', text: input.trim(), time },
      {
        type: 'bot',
        text: 'This is a placeholder response. You can implement backend logic here.',
        time,
      },
    ]);
    setInput('');
  };

  const renderItem = ({ item }) => {
    if (item.type === 'user') {
      return (
        <View style={styles.userMsgContainer}>
          <Text style={styles.userMsg}>{item.text}</Text>
          <Text style={styles.timestamp}>{item.time}</Text>
        </View>
      );
    }

    if (item.type === 'bot') {
      return (
        <View style={styles.botMsgContainer}>
          <Text style={styles.botMsg}>{item.text}</Text>
          <Text style={styles.timestamp}>{item.time}</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >
      <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
        <View style={{ backgroundColor: '#FFFFFF' }}>
          <View
            style={{
              flexDirection: 'row',

              paddingTop: hp(2),
              elevation: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={styles.title}>Cuore Assist</Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: '#FFFFFF',
            marginTop: hp(2),
            marginHorizontal: wp(5),
            alignItems: 'center',
            padding: hp(1),
            borderRadius: hp(1),
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '400',
              color: '#1E64AC',
              alignSelf: 'center',
              fontFamily: 'Roboto-Regular',
            }}
          >
            Cuore Assist offers personalized responses based on your Health
            Records and Assessments. It does not provide a medical diagnosis or
            recommend any medication
          </Text>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              marginTop: hp(3),
              fontSize: 14,
              fontWeight: '400',
              color: '#374151',
            }}
          >
            9 of 10 queries remaining
          </Text>
        </View>

        <View style={styles.container}>
          <FlatList
            data={messages}
            renderItem={renderItem}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={{ padding: 16 }}
          />
        </View>
        <View style={styles.inputBar}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              value={input}
              onChangeText={setInput}
            />
            <Image
              source={Images.MIKE} // or Images.SHARE
              style={styles.icon}
            />
          </View>

          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Image
              style={{
                resizeMode: 'contain',
                height: hp(2.5),
                width: wp(4),
                marginRight: hp(1),
                tintColor: '#FFFFFF',
              }}
              source={Images.SHARE}
            ></Image>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Chat;
const createStyles = c => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.card,
    marginHorizontal: wp(5),
    marginVertical: hp(2),
    borderRadius: hp(1),
  },

  title: {
    fontFamily: 'Roboto-Regular',

    fontSize: 20,
    fontWeight: '400',
    marginBottom: hp(2),
    alignSelf: 'center',
    color: '#000000',
  },

  botMsgContainer: {
    alignSelf: 'flex-start',
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    maxWidth: '80%',
  },
  botMsg: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: c.text,
    fontWeight: '400',
  },
  userMsgContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#CCCCCC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userMsg: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#000000',
    fontWeight: '400',
  },
  timestamp: {
    fontFamily: 'Roboto-Regular',
    fontSize: 11,
    color: '#777',
    marginTop: 4,
    textAlign: 'right',
  },
  inputBar: {
    backgroundColor: c.card,
    marginBottom: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopColor: '#E5E7EB',
    borderTopWidth: 1,
  },
  input: {
    fontFamily: 'Roboto-Regular',
    flex: 1,
    height: hp(5),
    // borderWidth: 1,

    paddingHorizontal: 24,
  },
  inputContainer: {
    backgroundColor: c.surface,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 8,
    // height: 40,
    flex: 1,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 8,
    resizeMode: 'contain',
    tintColor: c.primary,
  },
  sendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: hp(1),
    paddingHorizontal: hp(0.4),
    paddingVertical: hp(1),
    marginLeft: 8,
  },
});
