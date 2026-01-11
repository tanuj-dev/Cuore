import { useState, useCallback } from 'react';

/**
 * Custom hook to show alerts using CustomAlert component
 *
 * Usage:
 * const { alert, AlertComponent } = useCustomAlert();
 *
 * // In JSX
 * return (
 *   <>
 *     {AlertComponent}
 *     <Button onPress={() => alert('Title', 'Message')} />
 *   </>
 * );
 *
 * // With buttons
 * alert('Confirm', 'Are you sure?', [
 *   { text: 'Cancel', style: 'cancel' },
 *   { text: 'OK', onPress: () => console.log('OK') }
 * ]);
 */
export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const alert = useCallback((title, message, buttons = [{ text: 'OK' }]) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  }, []);

  const AlertComponent = (
    <CustomAlert
      visible={alertConfig.visible}
      title={alertConfig.title}
      message={alertConfig.message}
      buttons={alertConfig.buttons}
      onDismiss={hideAlert}
    />
  );

  return { alert, AlertComponent, hideAlert };
};

// Import the CustomAlert component
import CustomAlert from '../components/CustomAlert';
