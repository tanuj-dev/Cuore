import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { hp, wp } from '../../utilities';

const LimitExceededModal = ({ visible, onClose }) => {
  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: '#fff',
            padding: hp(3),
            borderRadius: hp(1),
            width: '80%',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#DC2626',
              marginBottom: hp(1),
            }}
          >
            Limit Exceeded
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#6B7280',
              textAlign: 'center',
              marginBottom: hp(2),
            }}
          >
            You can select a maximum of 4 items.
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: '#1E64AC',
              paddingHorizontal: wp(6),
              paddingVertical: hp(1.5),
              borderRadius: hp(1),
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '500' }}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default LimitExceededModal;
