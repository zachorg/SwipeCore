// Speech-to-Text utility using React Native Voice with Web Speech API fallback
// Converts audio input to text for NLP processing

import { Platform } from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent, SpeechStartEvent } from '@react-native-community/voice';

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
  private partialResultsListener: any = null;
  private listeningStateListener: any = null;
  private webRecognizer: any = null;

  constructor() {
    this.initializeListeners();
  }

  /**
   * Initialize event listeners for speech recognition
   */
  private async initializeListeners(): Promise<void> {
    if (Platform.OS === 'web') {
      const WebSpeech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (WebSpeech) {
        this.webRecognizer = new WebSpeech();
      }
      return;
    }

    try {
      Voice.onSpeechStart = (_e: SpeechStartEvent) => {
        this.isListening = true;
      };
      Voice.onSpeechError = (_e: SpeechErrorEvent) => {
        this.isListening = false;
      };
      Voice.onSpeechResults = (_e: SpeechResultsEvent) => {
        // handled dynamically in startListening via local handlers
      };
      Voice.onSpeechPartialResults = (_e: SpeechResultsEvent) => {
        // handled dynamically in startListening via local handlers
      };
    } catch (error) {
      console.warn('Could not initialize Voice listeners:', error);
    }
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
    if (Platform.OS === 'web') {
      const WebSpeech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      return !!WebSpeech;
    }
    try {
      const available = await Voice.isAvailable();
      return !!available;
    } catch (error) {
      console.warn('Speech recognition availability check failed:', error);
      return false;
    }
  }

  /**
   * Check current speech recognition permissions
   */
  public async checkPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
    if (Platform.OS === 'web') {
      return 'prompt';
    }
    try {
      // Voice exposes check() returning boolean on some versions; fallback to try-start
      const available = await Voice.isAvailable();
      return available ? 'prompt' : 'denied';
    } catch {
      return 'prompt';
    }
  }

  /**
   * Request speech recognition permissions
   */
  public async requestPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
    if (Platform.OS === 'web') {
      return 'prompt';
    }
    try {
      // Best-effort: Voice lacks explicit permission API across versions; attempt start/stop
      await Voice.start('en-US');
      await Voice.stop();
      return 'granted';
    } catch {
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

      const language = options.language || 'en-US';
      const allowPartials = options.partialResults !== false;

      console.log('🎤 Starting speech recognition with options:', { language, allowPartials });

      if (Platform.OS === 'web') {
        const WebSpeech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!WebSpeech) {
          onError('Web Speech API not available');
          return;
        }
        const recognizer = new WebSpeech();
        this.webRecognizer = recognizer;
        recognizer.lang = language;
        recognizer.interimResults = allowPartials;
        recognizer.maxAlternatives = options.maxResults || 5;
        recognizer.onresult = (event: any) => {
          const last = event.results[event.results.length - 1];
          const transcript = last[0].transcript;
          const isFinal = last.isFinal;
          onResult({ transcript, confidence: last[0].confidence ?? 0.9, isFinal });
          if (isFinal) onEnd();
        };
        recognizer.onerror = (e: any) => {
          onError(e.error || 'Speech recognition error');
        };
        recognizer.onend = () => {
          this.isListening = false;
          onEnd();
        };
        this.isListening = true;
        recognizer.start();
        return;
      }

      // Native (iOS/Android)
      Voice.onSpeechResults = (e: SpeechResultsEvent) => {
        const values = e.value || [];
        if (values.length > 0) {
          onResult({ transcript: values[0], confidence: 0.9, isFinal: true });
        }
      };
      Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
        if (!allowPartials) return;
        const values = e.value || [];
        if (values.length > 0) {
          onResult({ transcript: values[0], confidence: 0.8, isFinal: false });
        }
      };

      this.isListening = true;
      await Voice.start(language);

    } catch (error: any) {
      console.error('❌ Failed to start speech recognition:', error);
      onError(`Failed to start speech recognition: ${error.message}`);
    }
  }

  /**
   * Handle speech recognition results and events
   */
  // Native handler consolidated into startListening for simplicity

  /**
   * Stop listening for speech input
   */
  public async stopListening(): Promise<void> {
    try {
      if (this.isListening) {
        console.log('🛑 Stopping speech recognition...');
        if (Platform.OS === 'web') {
          try {
            this.webRecognizer?.stop?.();
            this.webRecognizer = null;
          } catch { }
        } else {
          await Voice.stop();
          await Voice.destroy();
        }
        this.isListening = false;
      }
    } catch (error) {
      console.error('❌ Failed to stop speech recognition:', error);
    }
  }

  /**
   * Check if speech recognition is currently listening
   */
  public async checkListeningState(): Promise<boolean> {
    try {
      return this.isListening;
    } catch (error) {
      console.warn('Could not check listening state:', error);
      return this.isListening;
    }
  }

  /**
   * Get supported languages for speech recognition
   */
  public async getSupportedLanguages(): Promise<Array<{ code: string; name: string }>> {
    // Not universally available; return a common set

    // Fallback to common languages if plugin doesn't support language listing
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
   * Clean up resources and listeners
   */
  public async cleanup(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        try {
          await Voice.destroy();
        } catch { }
      } else {
        this.webRecognizer = null;
      }

      // Stop if listening
      if (this.isListening) {
        await this.stopListening();
      }

      console.log('🧹 Speech recognition service cleaned up');
    } catch (error) {
      console.warn('Could not clean up speech recognition service:', error);
    }
  }

  /**
   * Get current permission status
   */
  public async getPermissionStatus(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      const status = await this.checkPermissions();
      return status;
    } catch (error) {
      console.warn('Could not get permission status:', error);
      return 'prompt';
    }
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
}

// Create singleton instance
export const speechToTextService = new SpeechToTextService();

// Utility function for quick speech-to-text
export async function quickSpeechToText(
  timeout: number = 10000,
  options: SpeechRecognitionOptions = {}
): Promise<{ transcript: string; confidence: number }> {
  return new Promise(async (resolve, reject) => {
    // Check if speech recognition is available
    const available = await speechToTextService.isAvailable();
    if (!available) {
      reject(new Error('Speech recognition not supported on this device'));
      return;
    }

    // Ensure permissions
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

    // Set timeout
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

// Export the plugin for direct access if needed
// No direct plugin export in RN implementation
