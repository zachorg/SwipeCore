# Authentication Setup Guide

This guide will help you set up the phone number OTP verification system for SwipeCore.

## Prerequisites

- Node.js 18+
- Firebase project
- Supabase project

## Step 1: Firebase Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Enable Google Analytics (optional but recommended)

### 1.2 Enable Phone Authentication
1. In your Firebase project, go to "Authentication" → "Sign-in method"
2. Enable "Phone" as a sign-in provider
3. Add your test phone numbers if you're in development

### 1.3 Get Firebase Config
1. Go to Project Settings (gear icon) → "General"
2. Scroll down to "Your apps" section
3. Click the web app icon (</>) to add a web app
4. Copy the Firebase configuration object

### 1.4 Update Environment Variables
Copy the values from your Firebase config to your `.env` file:

```env
VITE_FIREBASE_API_KEY=your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

## Step 2: Supabase Setup

### 2.1 Create Supabase Project
1. Go to [Supabase](https://supabase.com/) and sign in
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be created

### 2.2 Create User Profiles Table
Run this SQL in your Supabase SQL Editor:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY, -- This will store Firebase UID
  age INTEGER NOT NULL CHECK (age >= 13 AND age <= 120),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other', 'prefer-not-to-say')),
  phone_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read/write their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create index for better performance
CREATE INDEX idx_user_profiles_id ON user_profiles(id);
```

### 2.3 Get Supabase Credentials
1. Go to Project Settings → API
2. Copy the "Project URL" and "anon public" key

### 2.4 Update Environment Variables
Add these to your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

## Step 3: Mobile Configuration

### 3.1 Android Setup
1. Download `google-services.json` from Firebase Console
2. Place it in `android/app/`
3. Update `android/build.gradle` to include Google Services plugin
4. Sync your project: `npx cap sync android`

### 3.2 iOS Setup
1. Download `GoogleService-Info.plist` from Firebase Console
2. Add it to your iOS project via Xcode
3. Sync your project: `npx cap sync ios`

## Step 4: Test the System

1. Start your development server: `npm run dev`
2. The app should now show the "Get Started" screen
3. Enter a phone number and test the OTP flow
4. Complete the profile setup
5. You should be redirected to the main app

## Troubleshooting

### Common Issues

1. **"Firebase: Error (auth/invalid-phone-number)"**
   - Ensure phone number is in international format (+1XXXXXXXXXX)
   - Check if phone authentication is enabled in Firebase

2. **"Supabase: Error (PGRST116)"**
   - Verify your Supabase credentials
   - Check if the user_profiles table exists and has correct structure

3. **reCAPTCHA not working on web**
   - Ensure you're using the correct Firebase project
   - Check browser console for errors

4. **Mobile OTP not working**
   - Verify `google-services.json` is in the correct location
   - Check if the app is properly synced with Capacitor

### Development Tips

- Use test phone numbers in Firebase Console during development
- Check browser console and mobile logs for detailed error messages
- Verify environment variables are loaded correctly
- Test on both web and mobile platforms

## Security Notes

- Never commit your `.env` file to version control
- Use appropriate Firebase security rules
- Implement proper Supabase RLS policies
- Consider adding rate limiting for OTP requests
- Validate phone numbers on the server side in production

## Next Steps

After setting up authentication:

1. Add user preferences and settings
2. Implement user data persistence
3. Add logout functionality
4. Consider adding email verification as an alternative
5. Implement account deletion
6. Add user profile editing

For production deployment, ensure:
- All environment variables are properly set
- Firebase project is configured for production
- Supabase project has appropriate security policies
- Mobile apps are properly signed and distributed
