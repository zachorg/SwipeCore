# Android Permissions Fix for Voice Search

Based on your error logs, you need to add the required Android permissions to your Capacitor app.

## 🚨 Required Fix

The error shows:
```
Requires MODIFY_AUDIO_SETTINGS and RECORD_AUDIO. No audio device will be available for recording
```

This means your Android app is missing the required permissions.

## 📝 Step 1: Add Permissions to AndroidManifest.xml

**File Location:** `android/app/src/main/AndroidManifest.xml`

Add these permissions inside the `<manifest>` tag, before the `<application>` tag:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Required for microphone access -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    
    <!-- Optional: For better audio quality -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    
    <application>
        <!-- Your existing app configuration -->
    </application>
</manifest>
```

## 📝 Step 2: Complete AndroidManifest.xml Example

Here's what your complete AndroidManifest.xml should look like:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Internet permission (usually already present) -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- Required for microphone access -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    
    <!-- Optional: For better audio quality -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:exported="true"
            android:launchMode="singleTask"
            android:name="com.swipecore.app.MainActivity"
            android:theme="@style/AppTheme.NoActionBarLaunch">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>

    <!-- Declare features used by the app so it will be available to install only on devices that support them -->
    <uses-feature
        android:name="android.hardware.microphone"
        android:required="false" />

</manifest>
```

## 🔧 Step 3: Rebuild and Sync

After adding the permissions:

```bash
# Sync the changes
npx cap sync android

# Clean and rebuild
npx cap build android

# Run on device
npx cap run android
```

## 🧪 Step 4: Test the Fix

After rebuilding, test the voice search:

1. **Open your app on Android device**
2. **Navigate to voice search**
3. **Tap microphone button**
4. **Should now show Android permission dialog**

## 📱 Step 5: Verify Permissions

You can verify the permissions are working by checking the logs:

```bash
# Check app permissions
adb shell dumpsys package com.swipecore.app | grep permission

# Or check in device settings
# Settings → Apps → SwipeCore → Permissions → Microphone
```

## 🔍 Additional Debugging

If it still doesn't work, run these in your browser console:

```javascript
// Test environment detection
testSpeech()

// Test permission request
testMobilePermission()

// Check available permissions
navigator.permissions.query({name: 'microphone'}).then(result => {
  console.log('Permission state:', result.state);
});
```

## ⚠️ Common Issues

### **Issue: Permission dialog doesn't appear**
- **Cause**: Permissions already denied
- **Fix**: Clear app data or reinstall app

### **Issue: Still getting RECORD_AUDIO error**
- **Cause**: Didn't sync changes properly
- **Fix**: Run `npx cap sync android` and rebuild

### **Issue: Permission granted but recording fails**
- **Cause**: Missing MODIFY_AUDIO_SETTINGS permission
- **Fix**: Ensure both permissions are in manifest

## 🎯 Expected Result

After adding the permissions, you should see:

1. **Android permission dialog** when first using voice search
2. **No more "RECORD_AUDIO" errors** in logs
3. **Successful microphone access** for voice recognition
4. **Working voice search functionality**

## 📋 Quick Checklist

- [ ] Added `RECORD_AUDIO` permission to AndroidManifest.xml
- [ ] Added `MODIFY_AUDIO_SETTINGS` permission to AndroidManifest.xml
- [ ] Ran `npx cap sync android`
- [ ] Rebuilt app with `npx cap build android`
- [ ] Tested on real Android device
- [ ] Verified permission dialog appears
- [ ] Confirmed voice search works

The permissions fix should resolve the microphone access issue in your Capacitor Android app!
