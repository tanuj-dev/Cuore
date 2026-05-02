import React, { useState, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { hp, wp, Images } from '../../utilities'; // adjust path as needed

const ApiErrorFallback = ({ message = 'Unable to load data', onRetry }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    setLoading(true);
    try {
      await onRetry(); // assumes onRetry returns a promise
    } catch (e) {
      console.log('Retry failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={Images.ERROR_ICON} // use a gentle icon like a cloud or warning
        style={styles.icon}
      />
      <Text style={styles.title}>Oops!</Text>
      <Text style={styles.message}>{message}</Text>

      {loading ? (
        <ActivityIndicator
          size="small"
          color="#3B82F6"
          style={{ marginTop: hp(2) }}
        />
      ) : (
        onRetry && (
          <TouchableOpacity style={styles.button} onPress={handleRetry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
};

export default ApiErrorFallback;

const createStyles = c => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: hp(2),
  },
  icon: {
    width: wp(15),
    height: wp(15),
    resizeMode: 'contain',
    marginBottom: hp(2),
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp(1),
  },
  message: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: hp(2),
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: hp(1),
    paddingHorizontal: wp(5),
    borderRadius: hp(0.5),
  },
  buttonText: {
    color: c.card,
    fontWeight: '500',
    fontSize: 14,
  },
});
