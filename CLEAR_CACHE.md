# Clear Cache Instructions

The `RNBootSplash` error is likely due to cached Metro bundler. Follow these steps:

## Step 1: Stop Metro Bundler
If Metro is running, stop it (Ctrl+C in the terminal where it's running)

## Step 2: Clear All Caches

### Clear Metro Cache:
```bash
npx react-native start --reset-cache
```

### Clear Android Build Cache:
```bash
cd android
./gradlew clean
cd ..
```

### Clear Node Modules Cache (if needed):
```bash
rm -rf node_modules
npm install
```

## Step 3: Rebuild the App

### For Android:
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## Step 4: If Still Not Working

1. **In Android Studio:**
   - File → Invalidate Caches / Restart
   - Build → Clean Project
   - Build → Rebuild Project

2. **Clear watchman (if installed):**
   ```bash
   watchman watch-del-all
   ```

3. **Reset Metro bundler:**
   ```bash
   rm -rf /tmp/metro-*
   rm -rf /tmp/react-*
   npx react-native start --reset-cache
   ```

## Alternative: Check for Hidden Imports

If the error persists, search for any hidden imports:
```bash
grep -r "BootSplash\|bootsplash" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" .
```

If you find any, remove those imports.


