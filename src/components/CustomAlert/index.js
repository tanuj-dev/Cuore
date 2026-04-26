import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const CustomAlert = ({ visible, title, message, buttons, onDismiss }) => {
  const buttonList = buttons && buttons.length > 0 ? buttons : null;
  const useVerticalActions = buttonList && buttonList.length > 2;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Title */}
          {title && <Text style={styles.title}>{title}</Text>}

          {/* Message */}
          {message && <Text style={styles.message}>{message}</Text>}

          {/* Buttons */}
          <View
            style={[
              styles.buttonContainer,
              useVerticalActions && styles.buttonContainerStacked,
            ]}
          >
            {buttonList ? (
              buttonList.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    useVerticalActions && styles.buttonStacked,
                    !useVerticalActions && styles.buttonRow,
                    button.style === 'cancel' && styles.cancelButton,
                    button.style === 'destructive' && styles.destructiveButton,
                    buttonList.length === 1 && styles.singleButton,
                  ]}
                  onPress={() => {
                    if (button.onPress) button.onPress();
                    if (onDismiss) onDismiss();
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'cancel' && styles.cancelButtonText,
                      button.style === 'destructive' &&
                        styles.destructiveButtonText,
                    ]}
                    numberOfLines={2}
                  >
                    {button.text || 'OK'}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.singleButton]}
                onPress={onDismiss}
              >
                <Text style={styles.buttonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  alertContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: width * 0.8,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10000,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  buttonContainerStacked: {
    flexDirection: 'column',
    gap: 10,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#11418A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flex: 1,
    minWidth: 0,
  },
  buttonStacked: {
    alignSelf: 'stretch',
    width: '100%',
  },
  singleButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  destructiveButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  cancelButtonText: {
    color: '#475569',
    fontFamily: 'Poppins-Medium',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
  },
});

export default CustomAlert;
