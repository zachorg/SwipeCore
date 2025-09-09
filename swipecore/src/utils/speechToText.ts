// Speech-to-Text utility using expo-speech-recognition
// Converts audio input to text for NLP processing

import { Platform, Alert } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognitionOptions {
  language?: string;
  maxResults?: number;
  partialResults?: boolean;
  popup?: boolean;
  prompt?: string;
}

export class SpeechToTextService {
  private isListening: boolean = false;
  private listeners: any[] = [];
  private currentCallbacks: {
    onResult?: (result: SpeechRecognitionResult) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
  } = {};
  private timeoutId: NodeJS.Timeout | null = null;

  constructor() {
  }

  /**
   * Check if currently listening
   */
  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Check if speech recognition is available on this device
   */
  public async isAvailable(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return false;
      }

      // Check if the module is available
      const available = ExpoSpeechRecognitionModule !== undefined;
      return available;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check current speech recognition permissions
   */
  public async checkPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      if (Platform.OS === 'web') {
        return 'denied';
      }

      const result = await ExpoSpeechRecognitionModule.getPermissionsAsync();

      switch (result.status) {
        case 'granted':
          return 'granted';
        case 'denied':
          return 'denied';
        default:
          return 'prompt';
      }
    } catch (error) {
      console.warn('Could not check permissions:', error);
      return 'prompt';
    }
  }

  /**
   * Request speech recognition permissions
   */
  public async requestPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      if (Platform.OS === 'web') {
        return 'denied';
      }

      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      switch (result.status) {
        case 'granted':
          return 'granted';
        case 'denied':
          return 'denied';
        default:
          return 'prompt';
      }
    } catch (error) {
      return 'denied';
    }
  }

  /**
   * Start listening for speech input
   */
  public async startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void,
    onEnd: () => void,
    options: SpeechRecognitionOptions = {}
  ): Promise<void> {
    try {

      // Check if speech recognition is available
      const available = await this.isAvailable();
      if (!available) {
        onError('Speech recognition not supported on this device');
        return;
      }

      // Check if already listening
      if (this.isListening) {
        onError('Already listening for speech input');
        return;
      }

      // Check and request permissions
      const permission = await this.requestPermissions();
      if (permission === 'denied') {
        onError('Speech recognition permission denied');
        return;
      }

      // Store callbacks
      this.currentCallbacks = { onResult, onError, onEnd };

      // Clear any existing listeners and timeouts
      this.cleanupListeners();
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      // Set up event listeners BEFORE starting
      this.setupEventListeners();

      // Start recognition with proper options
      const startOptions = {
        lang: options.language || 'en-US',
        interimResults: options.partialResults !== false,
        continuous: false,
        maxAlternatives: 1
      };
      this.isListening = true;

      // Start the recognition using the correct API
      await ExpoSpeechRecognitionModule.start(startOptions);

      // Add a timeout to detect if no events are received
      this.timeoutId = setTimeout(() => {
        if (this.isListening) {
          this.stopListening();
          onError('No speech detected. Please try again.');
        }
      }, 5000);

    } catch (error: any) {
      this.isListening = false;
      onError(`Failed to start speech recognition: ${error.message}`);
    }
  }

  /**
   * Set up event listeners for speech recognition
   */
  private setupEventListeners(): void {
    try {

      // Add event listeners using the correct API
      const startListener = ExpoSpeechRecognitionModule.addListener('start', () => {
      });

      const resultListener = ExpoSpeechRecognitionModule.addListener('result', (event: any) => {
        this.handleResultEvent(event);
      });

      const errorListener = ExpoSpeechRecognitionModule.addListener('error', (event: any) => {
        this.handleErrorEvent(event);
      });

      const endListener = ExpoSpeechRecognitionModule.addListener('end', () => {
        this.handleEndEvent();
      });

      // Store listeners for cleanup
      this.listeners = [startListener, resultListener, errorListener, endListener];

    } catch (error) {
    }
  }

  /**
   * Handle result events
   */
  private handleResultEvent(event: any): void {
    // According to docs: event.results is an array of results
    if (event.results && event.results.length > 0) {
      const result = event.results[0];
      const transcript = result.transcript || '';
      const confidence = result.confidence || 0.9;
      const isFinal = event.isFinal || false;

      if (transcript && this.currentCallbacks.onResult) {
        this.currentCallbacks.onResult({
          transcript,
          confidence,
          isFinal
        });
      }

      if (isFinal && this.currentCallbacks.onEnd) {
        this.currentCallbacks.onEnd();
      }
    }
  }

  /**
   * Handle error events
   */
  private handleErrorEvent(event: any): void {
    const errorMessage = event.message || event.error || 'Speech recognition error';
    if (this.currentCallbacks.onError) {
      this.currentCallbacks.onError(errorMessage);
    }
    if (this.currentCallbacks.onEnd) {
      this.currentCallbacks.onEnd();
    }
  }

  /**
   * Handle end events
   */
  private handleEndEvent(): void {
    this.isListening = false;
    if (this.currentCallbacks.onEnd) {
      this.currentCallbacks.onEnd();
    }
  }

  /**
   * Stop listening for speech input
   */
  public async stopListening(): Promise<void> {
    try {
      if (this.isListening) {

        // Clear timeout
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }

        await ExpoSpeechRecognitionModule.stop();
        this.isListening = false;
        this.cleanupListeners();
        this.currentCallbacks = {};
      }
    } catch (error) {
    }
  }

  /**
   * Clean up event listeners
   */
  private cleanupListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener?.remove?.();
      } catch (error) {
      }
    });
    this.listeners = [];
  }

  /**
   * Check if speech recognition is currently listening
   */
  public async checkListeningState(): Promise<boolean> {
    return this.isListening;
  }

  /**
   * Get supported languages for speech recognition
   */
  public async getSupportedLanguages(): Promise<Array<{ code: string; name: string }>> {
    try {
      if (Platform.OS === 'web') {
        return [];
      }

      // Note: expo-speech-recognition doesn't have getSupportedLocales
      // Return common languages as fallback
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
    } catch (error) {
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
  }

  /**
   * Clean up resources and listeners
   */
  public async cleanup(): Promise<void> {
    try {
      if (this.isListening) {
        await this.stopListening();
      }
      this.cleanupListeners();
      this.currentCallbacks = {};
    } catch (error) {
    }
  }

  /**
   * Get current permission status
   */
  public async getPermissionStatus(): Promise<'granted' | 'denied' | 'prompt'> {
    return this.checkPermissions();
  }

  /**
   * Request permissions if needed
   */
  public async ensurePermissions(): Promise<boolean> {
    try {
      const status = await this.getPermissionStatus();

      if (status === 'granted') {
        return true;
      }

      if (status === 'prompt') {
        const newStatus = await this.requestPermissions();
        return newStatus === 'granted';
      }

      return false;
    } catch (error) {
      console.warn('Could not ensure permissions:', error);
      return false;
    }
  }

  /**
   * Test speech recognition functionality
   */
  public async testSpeechRecognition(): Promise<boolean> {
    try {
      // Test 1: Check availability
      const available = await this.isAvailable();

      if (!available) {
        return false;
      }

      // Test 2: Check permissions
      const permission = await this.checkPermissions();

      if (permission === 'denied') {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Simulate speech recognition for testing (fallback)
   */
  public async simulateSpeechRecognition(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): Promise<void> {
    // Show a prompt to the user
    Alert.prompt(
      'Voice Input',
      'Please enter your voice command:',
      [
        {
          text: 'Cancel',
          onPress: () => {
            onError('Voice input cancelled');
            onEnd();
          },
          style: 'cancel',
        },
        {
          text: 'Submit',
          onPress: (text) => {
            if (text && text.trim()) {
              onResult({
                transcript: text.trim(),
                confidence: 0.9,
                isFinal: true
              });
              onEnd();
            } else {
              onError('No text entered');
              onEnd();
            }
          },
        },
      ],
      'plain-text'
    );
  }
}

// Create singleton instance
export const speechToTextService = new SpeechToTextService();

// Utility function for quick speech-to-text
export async function quickSpeechToText(
  timeout: number = 10000,
  options: SpeechRecognitionOptions = {}
): Promise<{ transcript: string; confidence: number }> {
  return new Promise(async (resolve, reject) => {
    const available = await speechToTextService.isAvailable();
    if (!available) {
      reject(new Error('Speech recognition not supported on this device'));
      return;
    }

    const hasPermissions = await speechToTextService.ensurePermissions();
    if (!hasPermissions) {
      reject(new Error('Speech recognition permissions not granted'));
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let finalResult: { transcript: string; confidence: number } | null = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      speechToTextService.stopListening();
    };

    timeoutId = setTimeout(() => {
      cleanup();
      if (finalResult) {
        resolve(finalResult);
      } else {
        reject(new Error('Speech recognition timeout'));
      }
    }, timeout);

    try {
      await speechToTextService.startListening(
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
        },
        options
      );
    } catch (error: any) {
      cleanup();
      reject(error);
    }
  });
}
