# User Verification System

This document explains how the new user verification system works in SwipeCore, which allows verified users to skip the OTP verification process on subsequent app launches.

## Overview

The verification system generates a unique verification ID when a user successfully verifies their phone number via OTP. This ID is stored in persistent storage and can be used to verify the user's identity without requiring them to go through the OTP process again.

## How It Works

### 1. Initial Verification Flow

1. User enters phone number and requests OTP
2. Backend generates OTP and sends via SMS
3. User enters OTP code
4. Backend verifies OTP and generates a unique `verificationId`
5. Frontend stores the `verificationId` in persistent storage
6. User completes profile setup and reaches welcome screen

### 2. Subsequent App Launches

1. App checks for stored `verificationId` on startup
2. If found, validates the ID with backend
3. If valid, user is automatically taken to welcome screen
4. If invalid/expired, user goes through normal auth flow

## Backend Changes

### New Endpoints

- `POST /api/otp/check-verification` - Validates stored verification IDs

### Data Storage

- `verificationStore` - Maps verification IDs to user data
- Enhanced user storage with verification ID tracking

## Frontend Changes

### New Services

- `verificationService` - Manages verification ID storage and validation
- Enhanced `otpService` - Returns verification ID from OTP verification

### Updated Components

- `AuthContext` - Tracks verification status
- `AuthFlow` - Checks for existing verification on mount
- `PhoneVerificationScreen` - Stores verification ID after successful verification

### Storage

- Uses `CrossPlatformStorage` for persistent storage across web and mobile
- Storage key: `userVerification`
- Stores: `verificationId`, `phone`, `verifiedAt`

## Security Features

### Verification ID Format

- Format: `ver_{timestamp}_{randomString}`
- Example: `ver_1703123456789_a1b2c3d4e`

### Expiration

- Default expiration: 30 days
- Automatic cleanup of expired verifications
- Backend validation on each verification check

### Data Validation

- Frontend validates stored data integrity
- Backend confirms verification ID validity
- Automatic cleanup of corrupted data

## Usage Examples

### Checking Verification Status

```typescript
import { verificationService } from "@/services/verificationService";

// Check if user has valid verification
const isValid = await verificationService.hasValidVerification();

// Get verification status details
const status = await verificationService.getVerificationStatus();
```

### Storing Verification

```typescript
// After successful OTP verification
await verificationService.storeVerification(verificationId, phoneNumber);
```

### Clearing Verification

```typescript
// On logout or verification failure
await verificationService.clearVerification();
```

## Benefits

1. **Better UX** - Verified users don't need to re-verify on each app launch
2. **Reduced SMS Costs** - Fewer OTP messages sent
3. **Faster App Startup** - Skip verification flow for returning users
4. **Persistent Across Sessions** - Works even after app restarts
5. **Cross-Platform** - Works on both web and mobile

## Configuration

### Environment Variables

- `VITE_BACKEND_URL` - Backend API endpoint
- Backend OTP expiration time (configurable in backend)

### Storage Settings

- Web: localStorage
- Mobile: Capacitor Preferences
- Automatic fallback handling

## Troubleshooting

### Common Issues

1. **Verification not persisting** - Check storage permissions and storage type
2. **Backend validation failing** - Verify backend endpoint is accessible
3. **Expired verifications** - Check expiration settings and cleanup logic

### Debug Logging

The system includes comprehensive logging with emojis for easy identification:

- 🔍 Checking verification status
- ✅ Verification successful
- ❌ Verification failed
- ⏰ Verification expired
- 📱 Retrieved stored data
- 🗑️ Data cleared

## Future Enhancements

1. **Multiple Device Support** - Allow verification across devices
2. **Biometric Verification** - Integrate with device biometrics
3. **Advanced Security** - Add encryption to stored verification data
4. **Analytics** - Track verification success rates and user behavior
