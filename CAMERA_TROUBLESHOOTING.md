# Camera Troubleshooting Guide

## Common Camera Issues and Solutions

### 1. "Failed to open camera" Error

**Possible Causes:**
- Camera permission not granted
- Another app is using the camera
- Device camera hardware issues
- Incorrect camera configuration

**Solutions Implemented:**

#### Enhanced Permission Handling
- Added permission checking before requesting
- Better error handling for different permission states
- Direct link to device settings when permission is permanently denied

#### Improved Camera Configuration
- Added `maxWidth` and `maxHeight` to prevent memory issues
- Better error code handling with specific user messages
- Comprehensive logging for debugging

#### Error-Specific Handling
```javascript
// Handle specific error codes from react-native-image-picker
switch (result.errorCode) {
  case 'camera_unavailable':
    // Camera in use by another app
  case 'permission':
    // Permission denied
  case 'others':
    // Other errors
}
```

## Debugging Steps

### 1. Check Device Logs
```bash
# For Android
adb logcat | grep -i camera

# For iOS  
react-native log-ios
```

### 2. Verify Permissions
- **Android**: Check in Settings > Apps > Your App > Permissions
- **iOS**: Check in Settings > Your App > Camera

### 3. Test Camera Availability
```javascript
// Add this to test if camera is available
import { Camera } from 'react-native-image-picker';

const checkCameraAvailability = async () => {
  const isAvailable = await Camera.isCameraAvailable();
  console.log('Camera available:', isAvailable);
};
```

### 4. Common Device-Specific Issues

#### Android Issues:
- **Samsung devices**: May require additional permissions
- **Huawei devices**: May have aggressive battery optimization
- **Android 10+**: Scoped storage changes may affect file handling

#### iOS Issues:
- **Simulator**: Camera doesn't work in simulator
- **Privacy settings**: Must be enabled in Settings
- **Background app refresh**: May affect camera availability

## Testing Checklist

- [ ] App has CAMERA permission granted
- [ ] No other app is using the camera
- [ ] Device has working camera hardware
- [ ] Image picker library is properly linked
- [ ] Camera configuration options are valid
- [ ] Error handling shows specific error messages

## Alternative Solutions

If camera continues to fail:

### 1. Use Gallery Only
```javascript
// Temporarily disable camera option
const showUploadModal = false; // Hide camera option
```

### 2. Implement Fallback
```javascript
const handleCameraFallback = () => {
  Alert.alert(
    'Camera Unavailable',
    'Camera is not working. Please use the gallery option or try again later.',
    [
      { text: 'Use Gallery', onPress: pickImageFromGallery },
      { text: 'Cancel', style: 'cancel' }
    ]
  );
};
```

### 3. Add Retry Logic
```javascript
const [cameraRetryCount, setCameraRetryCount] = useState(0);

const retryCamera = async () => {
  if (cameraRetryCount < 3) {
    setCameraRetryCount(prev => prev + 1);
    await pickImageFromCamera();
  } else {
    Alert.alert('Camera Error', 'Please try the gallery option instead.');
  }
};
```

## Required Assets

Make sure these image assets exist:
- `camera.png` in `src/assets/images/`
- `eye.png` (already exists)
- `upload.png` (already exists)

## Next Steps

1. Test the enhanced camera implementation
2. Check device logs for specific error messages
3. Verify permissions are properly granted
4. Test on different devices if possible
5. Consider implementing a fallback gallery-only option

The improved implementation should provide better error messages and handling for most camera issues.