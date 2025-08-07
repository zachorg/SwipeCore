// Speech-to-Text utility using Web Speech API
// Converts audio input to text for NLP processing

import { isMobile } from '@/lib/utils';

// Type declarations for Web Speech API
interface SpeechGrammar {
  src: string;
  weight: number;
}

interface SpeechGrammarList {
  length: number;
  item(index: number): SpeechGrammar;
  addFromURI(src: string, weight: number): void;
  addFromString(string: string, weight: number): void;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  grammars: SpeechGrammarList;
  
  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: (event: Event) => void;
  
  start(): void;
  stop(): void;
  abort(): void;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export class SpeechToTextService {
  private recognition: SpeechRecognition | null = null;
  private _isSupported: boolean = false;
  private isListening: boolean = false;

  constructor() {
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      this._isSupported = false;
      return;
    }

    // Check for browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      this._isSupported = false;
      return;
    }

    this._isSupported = true;
    this.recognition = new SpeechRecognition();
    
    // Configure recognition settings
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
  }

  /**
   * Check if speech recognition is supported
   */
  public isSupported(): boolean {
    return this._isSupported === true;
  }

  /**
   * Check if currently listening
   */
  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Start listening for speech input with fast permission handling
   */
  public async startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void,
    onEnd: () => void,
    options: SpeechRecognitionOptions = {}
  ): Promise<void> {
    if (!this.recognition || !this._isSupported) {
      onError('Speech recognition not supported');
      return;
    }

    if (this.isListening) {
      onError('Already listening');
      return;
    }

    // Fast permission check - only request if needed
    try {
      if (this.isCapacitorApp()) {
        // Import the Capacitor permissions manager
        const { capacitorPermissions } = await import('./capacitorPermissions');

        // Fast check first - returns immediately if permission already granted
        const quickCheck = await capacitorPermissions.checkMicrophonePermission();
        if (!quickCheck.granted) {
          // Only request permission if we don't have it
          console.log('🎤 Permission not granted, requesting...');
          const permissionResult = await capacitorPermissions.requestMicrophonePermission();
          if (!permissionResult.granted) {
            onError(permissionResult.error || 'Microphone permission required');
            return;
          }
        } else {
          console.log('🚀 Permission already granted, proceeding directly');
        }
      } else {
        // For web browsers, first check if permission is already granted
        const permissionStatus = await this.checkMicrophonePermission();
        console.log('🎤 Browser permission status:', permissionStatus);
        
        if (permissionStatus === 'granted') {
          console.log('🚀 Browser permission already granted, proceeding directly');
        } else {
          // Only request permission if not already granted
          console.log('🎤 Browser permission not granted, requesting...');
          const permissionResult = await this.requestMicrophonePermission();
          if (!permissionResult.granted) {
            onError(permissionResult.error || 'Microphone permission required');
            return;
          }
        }
      }
    } catch (error) {
      onError('Failed to check microphone permission');
      return;
    }

    // Apply options
    if (options.language) this.recognition.lang = options.language;
    if (options.continuous !== undefined) this.recognition.continuous = options.continuous;
    if (options.interimResults !== undefined) this.recognition.interimResults = options.interimResults;
    if (options.maxAlternatives) this.recognition.maxAlternatives = options.maxAlternatives;

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('🎤 Speech recognition started');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      console.log(`🗣️ Speech result: "${transcript}" (confidence: ${Math.round(confidence * 100)}%)`);

      onResult({
        transcript,
        confidence,
        isFinal
      });
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false;
      console.error('🚫 Speech recognition error:', event.error);
      
      let errorMessage = 'Speech recognition error';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Please check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      onError(errorMessage);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('🎤 Speech recognition ended');
      onEnd();
    };

    // Start recognition
    try {
      this.recognition.start();
    } catch (error) {
      this.isListening = false;
      onError('Failed to start speech recognition');
    }
  }

  /**
   * Stop listening
   */
  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Abort current recognition
   */
  public abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  /**
   * Get supported languages (basic list)
   */
  public getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'es-ES', name: 'Spanish' },
      { code: 'fr-FR', name: 'French' },
      { code: 'de-DE', name: 'German' },
      { code: 'it-IT', name: 'Italian' },
      { code: 'pt-BR', name: 'Portuguese' },
      { code: 'zh-CN', name: 'Chinese (Mandarin)' },
      { code: 'ja-JP', name: 'Japanese' },
      { code: 'ko-KR', name: 'Korean' }
    ];
  }

  /**
   * Detect if running in Capacitor/Cordova environment
   */
  private isCapacitorApp(): boolean {
    // return !!(window as any).Capacitor || !!(window as any).cordova;
    return isMobile();
  }

  /**
   * Request microphone permission with Capacitor/Cordova support
   */
  public async requestMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
    try {
      // Handle Capacitor/Cordova apps differently
      if (this.isCapacitorApp()) {
        return await this.requestCapacitorMicrophonePermission();
      }

      // Standard web browser permission request
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          granted: false,
          error: 'Microphone access not available in this browser'
        };
      }

      console.log('Requesting microphone permission (web browser)...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('Microphone permission granted, stream obtained');

      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Audio track stopped');
      });

      return { granted: true };
    } catch (error: any) {
      console.error('Microphone permission error:', error);

      let errorMessage = 'Microphone permission denied';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission was denied. Please allow microphone access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Microphone access is not supported in this browser.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Microphone access blocked. Please ensure you are using HTTPS.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Microphone access was aborted. Please try again.';
      }

      return { granted: false, error: errorMessage };
    }
  }

  /**
   * Handle microphone permission for Capacitor/Cordova apps
   */
  private async requestCapacitorMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
    try {
      console.log('🔌 Capacitor/Cordova app detected, using native permission handling...');

      // Import the Capacitor permissions manager
      const { capacitorPermissions } = await import('./capacitorPermissions');

      // Try Capacitor permissions manager first
      if (capacitorPermissions.isNativeApp()) {
        console.log('📱 Using Capacitor permissions manager...');
        const result = await capacitorPermissions.requestMicrophonePermission();

        if (result.granted) {
          console.log('✅ Capacitor permission granted');
          return result;
        } else {
          console.log('❌ Capacitor permission denied:', result.error);
          // Don't return here, try fallback methods
        }
      }

      // Try legacy Capacitor method
      if ((window as any).Capacitor) {
        const result = await this.requestCapacitorPermission();
        if (result.granted) {
          return result;
        }
      }

      // Fall back to Cordova
      if ((window as any).cordova) {
        const result = await this.requestCordovaPermission();
        if (result.granted) {
          return result;
        }
      }

      // Final fallback to web permissions
      console.log('⚠️ All native methods failed, trying web fallback...');
      return await this.requestWebPermissionFallback();

    } catch (error: any) {
      console.error('❌ Capacitor/Cordova permission error:', error);
      return {
        granted: false,
        error: `Native app permission error: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Request permission using Capacitor with proper Android permission handling
   */
  private async requestCapacitorPermission(): Promise<{ granted: boolean; error?: string }> {
    try {
      const { Capacitor } = (window as any);

      // Check if we're on a native platform
      if (!Capacitor.isNativePlatform()) {
        console.log('📱 Capacitor web platform, using web permission...');
        return await this.requestWebPermissionFallback();
      }

      console.log('🔌 Requesting Capacitor native permissions...');

      // Method 1: Try App plugin for general permissions (most reliable)
      if ((window as any).CapacitorApp) {
        try {
          console.log('📱 Using Capacitor App plugin for permissions...');

          // For Android, we need to request RECORD_AUDIO permission
          // This will trigger the native Android permission dialog
          const result = await this.requestAndroidAudioPermission();
          if (result.granted) {
            return result;
          }
        } catch (error) {
          console.log('⚠️ App plugin method failed, trying alternatives...');
        }
      }

      // Method 2: Try Device plugin if available
      if ((window as any).CapacitorDevice) {
        try {
          console.log('📱 Using Capacitor Device plugin...');
          const result = await this.requestDeviceAudioPermission();
          if (result.granted) {
            return result;
          }
        } catch (error) {
          console.log('⚠️ Device plugin method failed, trying alternatives...');
        }
      }

      // Method 3: Try direct native call
      try {
        console.log('📱 Attempting direct native permission call...');
        const result = await this.requestNativeAudioPermission();
        if (result.granted) {
          return result;
        }
      } catch (error) {
        console.log('⚠️ Direct native call failed, using web fallback...');
      }

      // Fallback to web permissions
      console.log('🌐 All native methods failed, using web fallback...');
      return await this.requestWebPermissionFallback();

    } catch (error: any) {
      console.error('❌ Capacitor permission request failed:', error);
      return {
        granted: false,
        error: `Permission request failed: ${error.message}`
      };
    }
  }

  /**
   * Request Android audio permission using Capacitor App plugin
   */
  private async requestAndroidAudioPermission(): Promise<{ granted: boolean; error?: string }> {
    return new Promise((resolve) => {
      try {
        // Use Capacitor's native bridge to request Android permissions
        const { Capacitor } = (window as any);

        if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
          // Call native Android permission request
          Capacitor.Plugins.CapacitorHttp = Capacitor.Plugins.CapacitorHttp || {};

          // Create a custom permission request
          const permissionRequest = {
            permissions: ['android.permission.RECORD_AUDIO', 'android.permission.MODIFY_AUDIO_SETTINGS']
          };

          // Use the native bridge to request permissions
          if ((window as any).AndroidPermissions) {
            (window as any).AndroidPermissions.requestPermissions(
              permissionRequest.permissions,
              (result: any) => {
                if (result && result.hasPermission) {
                  console.log('✅ Android audio permissions granted');
                  resolve({ granted: true });
                } else {
                  resolve({
                    granted: false,
                    error: 'Android audio permissions denied'
                  });
                }
              },
              (error: any) => {
                resolve({
                  granted: false,
                  error: `Android permission error: ${error}`
                });
              }
            );
          } else {
            // Try alternative method using Capacitor's permission system
            this.requestCapacitorNativePermission().then(resolve);
          }
        } else {
          resolve({ granted: false, error: 'Not on Android platform' });
        }
      } catch (error: any) {
        resolve({ granted: false, error: error.message });
      }
    });
  }

  /**
   * Request permission using Capacitor's native permission system
   */
  private async requestCapacitorNativePermission(): Promise<{ granted: boolean; error?: string }> {
    try {
      const { Capacitor } = (window as any);

      // Use Capacitor's built-in permission system
      if (Capacitor.Plugins && Capacitor.Plugins.Permissions) {
        const { Permissions } = Capacitor.Plugins;

        // Request microphone permission
        const result = await Permissions.query({ name: 'microphone' });

        if (result.state === 'granted') {
          return { granted: true };
        } else if (result.state === 'prompt') {
          // Request permission
          const requestResult = await Permissions.request({ permissions: ['microphone'] });
          return {
            granted: requestResult.microphone === 'granted',
            error: requestResult.microphone !== 'granted' ? 'Permission denied' : undefined
          };
        } else {
          return { granted: false, error: 'Permission previously denied' };
        }
      }

      return { granted: false, error: 'Permissions plugin not available' };
    } catch (error: any) {
      return { granted: false, error: error.message };
    }
  }

  /**
   * Request permission using Device plugin
   */
  private async requestDeviceAudioPermission(): Promise<{ granted: boolean; error?: string }> {
    try {
      // This is a fallback method that might work with some Capacitor setups
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // If we get here, permission was granted
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Device audio permission granted via getUserMedia');
      return { granted: true };

    } catch (error: any) {
      console.log('❌ Device audio permission failed:', error.message);
      return { granted: false, error: error.message };
    }
  }

  /**
   * Direct native permission request
   */
  private async requestNativeAudioPermission(): Promise<{ granted: boolean; error?: string }> {
    return new Promise((resolve) => {
      try {
        const { Capacitor } = (window as any);

        if (Capacitor.isNativePlatform()) {
          // Try to call native permission request directly
          Capacitor.toNative('CapacitorPermissions', 'requestPermissions', {
            permissions: ['microphone']
          }).then((result: any) => {
            resolve({
              granted: result.microphone === 'granted',
              error: result.microphone !== 'granted' ? 'Native permission denied' : undefined
            });
          }).catch((error: any) => {
            resolve({ granted: false, error: error.message });
          });
        } else {
          resolve({ granted: false, error: 'Not on native platform' });
        }
      } catch (error: any) {
        resolve({ granted: false, error: error.message });
      }
    });
  }

  /**
   * Request permission using Cordova
   */
  private async requestCordovaPermission(): Promise<{ granted: boolean; error?: string }> {
    return new Promise((resolve) => {
      try {
        console.log('📱 Trying Cordova permission request...');

        // Try cordova-plugin-android-permissions
        if ((window as any).cordova?.plugins?.permissions) {
          const permissions = (window as any).cordova.plugins.permissions;
          const permission = permissions.RECORD_AUDIO;

          permissions.checkPermission(permission, (status: any) => {
            if (status.hasPermission) {
              console.log('✅ Cordova permission already granted');
              resolve({ granted: true });
            } else {
              permissions.requestPermission(permission, (status: any) => {
                if (status.hasPermission) {
                  console.log('✅ Cordova permission granted after request');
                  resolve({ granted: true });
                } else {
                  resolve({
                    granted: false,
                    error: 'Microphone permission denied in Cordova app. Please enable in device settings.'
                  });
                }
              }, (error: any) => {
                resolve({
                  granted: false,
                  error: `Cordova permission request failed: ${error}`
                });
              });
            }
          }, (error: any) => {
            resolve({
              granted: false,
              error: `Cordova permission check failed: ${error}`
            });
          });
        } else {
          // No Cordova permissions plugin, try web fallback
          console.log('⚠️ No Cordova permissions plugin found, trying web fallback...');
          this.requestWebPermissionFallback().then(resolve);
        }
      } catch (error: any) {
        resolve({
          granted: false,
          error: `Cordova error: ${error.message}`
        });
      }
    });
  }

  /**
   * Web permission fallback for hybrid apps
   */
  private async requestWebPermissionFallback(): Promise<{ granted: boolean; error?: string }> {
    try {
      console.log('🌐 Using web permission fallback...');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          granted: false,
          error: 'Microphone access not available. Please add RECORD_AUDIO permission to your app manifest.'
        };
      }

      // Check if we're in Capacitor and missing permissions
      if (this.isCapacitorApp()) {
        console.log('⚠️ Capacitor app using web fallback - likely missing Android permissions');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      stream.getTracks().forEach(track => track.stop());

      console.log('✅ Web fallback permission granted');
      return { granted: true };

    } catch (error: any) {
      console.error('❌ Web fallback permission failed:', error);

      let errorMessage = 'Unable to access microphone.';

      if (this.isCapacitorApp()) {
        if (error.name === 'NotAllowedError' || error.message?.includes('RECORD_AUDIO')) {
          errorMessage = 'Missing Android permissions. Please add RECORD_AUDIO and MODIFY_AUDIO_SETTINGS to your AndroidManifest.xml file.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please check your device has a working microphone.';
        } else {
          errorMessage = 'Microphone access failed. Please check app permissions in device settings.';
        }
      } else {
        errorMessage = 'Please check your device settings and ensure microphone permissions are enabled for this app.';
      }

      return { granted: false, error: errorMessage };
    }
  }

  /**
   * Check current microphone permission status
   */
  public async checkMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
    try {
      if (!navigator.permissions) {
        return 'unknown';
      }

      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permission.state as 'granted' | 'denied' | 'prompt';
    } catch (error) {
      console.warn('Could not check microphone permission:', error);
      return 'unknown';
    }
  }

  /**
   * Force microphone permission request for mobile devices
   * Handles both web browsers and Capacitor/Cordova apps
   */
  public async forceMobilePermissionRequest(): Promise<{ granted: boolean; error?: string }> {
    try {
      console.log('🔥 Force requesting microphone permission for mobile...');

      // Handle Capacitor/Cordova apps first
      if (this.isCapacitorApp()) {
        console.log('📱 Capacitor/Cordova detected, using native permission flow...');
        return await this.requestCapacitorMicrophonePermission();
      }

      // Standard web browser flow
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          granted: false,
          error: 'Microphone access not available in this environment'
        };
      }

      // Create a more explicit permission request
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Add mobile-specific constraints
          sampleRate: 44100,
          channelCount: 1
        }
      };

      // Request permission with a timeout to handle mobile quirks
      const permissionPromise = navigator.mediaDevices.getUserMedia(constraints);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Permission request timeout')), 10000)
      );

      const stream = await Promise.race([permissionPromise, timeoutPromise]) as MediaStream;

      console.log('✅ Mobile microphone permission granted');

      // Immediately stop the stream
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Audio track stopped');
      });

      return { granted: true };

    } catch (error: any) {
      console.error('❌ Mobile microphone permission failed:', error);

      let errorMessage = 'Microphone permission denied';

      if (error.message === 'Permission request timeout') {
        errorMessage = 'Permission request timed out. Please try again and respond to the permission dialog quickly.';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access was denied. Please tap "Allow" when prompted and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please check your device settings.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error. Please ensure you are using HTTPS and try again.';
      } else if (error.message && error.message.includes('Capacitor')) {
        errorMessage = 'Please enable microphone permissions for this app in your device settings.';
      }

      return { granted: false, error: errorMessage };
    }
  }
}

// Create singleton instance
export const speechToTextService = new SpeechToTextService();

// Utility function for quick speech-to-text
export async function quickSpeechToText(
  timeout: number = 10000
): Promise<{ transcript: string; confidence: number }> {
  return new Promise((resolve, reject) => {
    if (!speechToTextService.isSupported()) {
      reject(new Error('Speech recognition not supported'));
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let finalResult: { transcript: string; confidence: number } | null = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      speechToTextService.stopListening();
    };

    // Set timeout
    timeoutId = setTimeout(() => {
      cleanup();
      if (finalResult) {
        resolve(finalResult);
      } else {
        reject(new Error('Speech recognition timeout'));
      }
    }, timeout);

    speechToTextService.startListening(
      (result) => {
        if (result.isFinal) {
          finalResult = {
            transcript: result.transcript,
            confidence: result.confidence
          };
          cleanup();
          resolve(finalResult);
        }
      },
      (error) => {
        cleanup();
        reject(new Error(error));
      },
      () => {
        if (finalResult) {
          cleanup();
          resolve(finalResult);
        }
      }
    );
  });
}

// Make testing functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testSpeech = () => {
    console.log('🎤 Testing speech recognition...');
    console.log('Service available:', !!speechToTextService);
    console.log('isSupported method available:', typeof speechToTextService?.isSupported === 'function');

    // Check environment
    const isCapacitor = !!(window as any).Capacitor;
    const isCordova = !!(window as any).cordova;
    console.log('Environment:', {
      isCapacitor,
      isCordova,
      isNative: isCapacitor || isCordova,
      userAgent: navigator.userAgent
    });

    if (speechToTextService && typeof speechToTextService.isSupported === 'function') {
      const supported = speechToTextService.isSupported();
      console.log('Speech recognition supported:', supported);
      if (supported) {
        console.log('✅ Voice search should work! Try clicking the microphone button.');
      } else {
        console.log('❌ Speech recognition not supported in this browser.');
      }
    } else {
      console.log('❌ Speech service not properly initialized!');
    }
  };

  (window as any).testMobilePermission = async () => {
    console.log('📱 Testing mobile microphone permission...');
    try {
      if ((window as any).Capacitor) {
        const { capacitorPermissions } = await import('./capacitorPermissions');

        // Test fast check first
        console.log('🚀 Testing fast permission check...');
        const quickCheck = await capacitorPermissions.checkMicrophonePermission();
        console.log('Quick check result:', quickCheck);

        if (!quickCheck.granted) {
          console.log('🎤 Testing permission request...');
          const result = await capacitorPermissions.requestMicrophonePermission();
          console.log('Permission request result:', result);
        }
      } else {
        const result = await speechToTextService.forceMobilePermissionRequest();
        console.log('Permission result:', result);
      }
    } catch (error) {
      console.error('❌ Error testing mobile permission:', error);
    }
  };

  (window as any).testRegularPermission = async () => {
    console.log('🔧 Testing regular microphone permission...');
    try {
      const result = await speechToTextService.requestMicrophonePermission();
      console.log('Permission result:', result);
      if (result.granted) {
        console.log('✅ Regular microphone permission granted!');
      } else {
        console.log('❌ Regular microphone permission denied:', result.error);
      }
    } catch (error) {
      console.error('❌ Error testing regular permission:', error);
    }
  };

  (window as any).diagnosePermissionIssues = () => {
    console.log('🔍 Diagnosing permission issues...');

    const isCapacitor = !!(window as any).Capacitor;
    const isCordova = !!(window as any).cordova;
    const hasGetUserMedia = !!(navigator.mediaDevices?.getUserMedia);

    console.log('Environment:', {
      isCapacitor,
      isCordova,
      hasGetUserMedia,
      userAgent: navigator.userAgent
    });

    if (isCapacitor) {
      console.log('📱 Capacitor app detected');
      console.log('💡 If microphone fails, you likely need to add Android permissions:');
      console.log('   1. Add to android/app/src/main/AndroidManifest.xml:');
      console.log('      <uses-permission android:name="android.permission.RECORD_AUDIO" />');
      console.log('      <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />');
      console.log('   2. Run: npx cap sync android');
      console.log('   3. Rebuild and test');
    }

    if (!hasGetUserMedia) {
      console.log('❌ getUserMedia not available - check HTTPS or browser support');
    }
  };

  (window as any).clearPermissionCache = async () => {
    console.log('🗑️ Clearing permission cache...');
    try {
      if ((window as any).Capacitor) {
        const { capacitorPermissions } = await import('./capacitorPermissions');
        capacitorPermissions.clearCache();
        console.log('✅ Capacitor permission cache cleared');
      } else {
        console.log('ℹ️ No cache to clear for web environment');
      }
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  };

  (window as any).speechToTextService = speechToTextService;
}
