# InAppBrowser Implementation

This project now uses `expo-web-browser` to provide a native in-app browsing experience that keeps users within your app when opening external URLs.

## Features

- **Native Performance**: Uses platform-native browser components (SFSafariViewController on iOS, Chrome Custom Tabs on Android)
- **User Retention**: Users never leave your app when opening links
- **Automatic Fallback**: Falls back to system browser if InAppBrowser is unavailable
- **Customizable UI**: Configurable colors, animations, and presentation styles
- **Warm-up Support**: Pre-initializes browser for faster loading

## Installation

The library is already installed:

```bash
npx expo install expo-web-browser
```

## Usage

### Basic URL Opening

```typescript
import { openUrl } from '@/utils/browser';

// Open any URL in the in-app browser
await openUrl('https://example.com');
```

### In SwipeCard Component

The SwipeCard component automatically uses the InAppBrowser for:
- **Maps links** (Google Maps, Apple Maps)
- **Website links** (restaurant websites)
- **AdChoices links** (compliance requirements)
- **Phone links** (with fallback handling)

### Customization

Expo WebBrowser provides a clean, native experience with limited customization options. You can modify the behavior in `src/utils/browser.ts`:

```typescript
await WebBrowser.openBrowserAsync(url);
```

## Configuration Options

Expo WebBrowser provides a streamlined experience with minimal configuration:

- **Cross-platform**: Works consistently on iOS and Android
- **Native appearance**: Automatically adapts to platform conventions
- **Automatic fallback**: Falls back to system browser if needed
- **No linking required**: Works out of the box with Expo

## Error Handling

The implementation includes comprehensive error handling:

1. **Primary**: Attempts to open URL in InAppBrowser
2. **Fallback**: If InAppBrowser fails, uses system browser
3. **Logging**: All errors are logged for debugging

## Performance Optimization

### Warm-up
The WebBrowser is automatically initialized when the app starts:

```typescript
// This happens automatically in useInAppBrowser hook
warmUpWebBrowser();
```

### Availability Check
Expo WebBrowser is always available and doesn't require explicit availability checks.

## Testing

Use the `InAppBrowserTest` component to test different URL types:

```typescript
import { InAppBrowserTest } from '@/components/InAppBrowserTest';

// Add to your screen for testing
<InAppBrowserTest />
```

## Troubleshooting

### Common Issues

1. **WebBrowser not opening**: Ensure expo-web-browser is properly installed
2. **URLs opening in system browser**: Check if WebBrowser.openBrowserAsync is being called
3. **Performance issues**: WebBrowser is optimized and doesn't require warmup

### Debug Logging

Enable debug logging by checking the console for:
- "WebBrowser is available and ready"
- "WebBrowser result:" followed by the result object
- Error messages for failed operations

## Platform Support

- **iOS**: Uses SFSafariViewController (iOS 9+)
- **Android**: Uses Chrome Custom Tabs (Android 5+)
- **Web**: Falls back to window.open() with new tab
- **Fallback**: System browser if WebBrowser unavailable

## Benefits

1. **User Experience**: Seamless browsing without app switching
2. **Engagement**: Higher user retention and session duration
3. **Performance**: Native browser performance and features
4. **Compliance**: AdChoices and other required links stay in-app
5. **Branding**: Consistent with your app's design and flow
