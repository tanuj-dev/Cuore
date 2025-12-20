# How to Start the App After File Upload Setup

## ✅ Setup Complete!

The file and photo upload functionality has been successfully configured for both iOS and Android using `react-native-image-picker`.

## 🚀 Starting the App

### Quick Start

**For Android:**

```bash
cd /Users/apple/Cuore
npx react-native run-android
```

**For iOS:**

```bash
cd /Users/apple/Cuore
npx react-native run-ios
```

## 📱 Testing the Upload Feature

1. Navigate to **Profile** → **Health Records**
2. Tap the **"Upload Record"** box
3. You should see a modal with 3 options:
   - 📷 **Take Photo** - Opens Camera to capture documents
   - 🖼️ **Choose from Gallery** - Select existing photos
   - 📁 **Browse Files** - Opens photo library/file browser

## 🔐 Runtime Permissions

The app will automatically request the following permissions when needed:

- **Camera** (when taking photos)
- **Photo Library** (when selecting from gallery)
- **File Storage** (when browsing files)

## 📦 What Was Installed

- ✅ `react-native-image-picker@8.2.1` - Camera, Gallery & File Selection
- ✅ `react-native-blob-util@0.22.2` - Already installed for file handling

## 🔧 Configuration Added

### iOS (Info.plist):

- `NSCameraUsageDescription` - Permission to use camera
- `NSPhotoLibraryUsageDescription` - Permission to access photo library
- `NSPhotoLibraryAddUsageDescription` - Permission to save photos

### Android (AndroidManifest.xml):

- `CAMERA` permission
- `READ_EXTERNAL_STORAGE` permission
- `WRITE_EXTERNAL_STORAGE` permission
- `READ_MEDIA_IMAGES` permission

## ⚠️ Troubleshooting

If you encounter any build issues:

### Clear Everything and Rebuild:

```bash
cd /Users/apple/Cuore

# Clean all caches
rm -rf android/app/build android/app/.cxx android/build
rm -rf ios/build
watchman watch-del-all

# Rebuild
npx react-native run-android
# or
npx react-native run-ios
```

## 💡 Important Notes

- The "Browse Files" option opens the photo library (same as Gallery)
- For PDF support, you would need a compatible document picker for RN 0.81+
- All file types (images) are currently supported through the image picker
- Files are validated and stored in the component state

## 🎯 Supported File Types

Currently supported through image picker:

- 📷 Photos from camera (JPG, PNG)
- 🖼️ Images from gallery (JPG, PNG, GIF, HEIC)
- 📄 Other image formats supported by the device

---

**App is ready to use!** 🎉
