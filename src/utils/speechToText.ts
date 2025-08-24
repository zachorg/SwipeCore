// Speech-to-Text utility using Capacitor Community Speech Recognition Plugin
// Converts audio input to text for NLP processing

import { SpeechRecognition as SpeechRecognitionPlugin, UtteranceOptions, PermissionStatus } from '@capacitor-community/speech-recognition';

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

  constructor() {
    this.initializeListeners();
  }

  /**
   * Initialize event listeners for speech recognition
   */
  private async initializeListeners(): Promise<void> {
    try {
      // Set up partial results listener
      this.partialResultsListener = await SpeechRecognitionPlugin.addListener('partialResults', (event) => {
        console.log('🗣️ Partial result received:', event.matches);
      });

      // Set up listening state listener
      this.listeningStateListener = await SpeechRecognitionPlugin.addListener('listeningState', (event) => {
        this.isListening = event.status === 'started';
        console.log('🎤 Listening state changed:', event.status);
      });
    } catch (error) {
      console.warn('Could not initialize speech recognition listeners:', error);
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
    try {
      const result = await SpeechRecognitionPlugin.available();
      return result.available;
    } catch (error) {
      console.warn('Speech recognition availability check failed:', error);
      return false;
    }
  }

  /**
   * Check current speech recognition permissions
   */
  public async checkPermissions(): Promise<PermissionStatus> {
    try {
      return await SpeechRecognitionPlugin.checkPermissions();
    } catch (error) {
      console.warn('Permission check failed:', error);
      throw error;
    }
  }

  /**
   * Request speech recognition permissions
   */
  public async requestPermissions(): Promise<PermissionStatus> {
    try {
      return await SpeechRecognitionPlugin.requestPermissions();
    } catch (error) {
      console.warn('Permission request failed:', error);
      throw error;
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
      let permissionStatus = await this.requestPermissions();
      if (permissionStatus.speechRecognition === 'denied') {
        onError('Speech recognition permission denied');
        return;
      }

      // Prepare utterance options
      const utteranceOptions: UtteranceOptions = {
        language: options.language || 'en-US',
        maxResults: options.maxResults || 5,
        partialResults: options.partialResults !== false, // Default to true
        popup: options.popup || false,
        prompt: options.prompt
      };

      console.log('🎤 Starting speech recognition with options:', utteranceOptions);

      // Start listening
      await SpeechRecognitionPlugin.start(utteranceOptions);

      // Set up result handling
      this.handleSpeechResults(onResult, onError, onEnd);

    } catch (error: any) {
      console.error('❌ Failed to start speech recognition:', error);
      onError(`Failed to start speech recognition: ${error.message}`);
    }
  }

  /**
   * Handle speech recognition results and events
   */
  private async handleSpeechResults(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): Promise<void> {
    try {
      // Set up partial results listener for this session
      const partialResultsListener = await SpeechRecognitionPlugin.addListener('partialResults', (event) => {
        if (event.matches && event.matches.length > 0) {
          const transcript = event.matches[0];
          console.log(`🗣️ Partial result: "${transcript}"`);

          onResult({
            transcript,
            confidence: 0.8, // Partial results don't have confidence
            isFinal: false
          });
        }
      });

      // Set up listening state listener for this session
      const listeningStateListener = await SpeechRecognitionPlugin.addListener('listeningState', (event) => {
        if (event.status === 'stopped') {
          console.log('🎤 Speech recognition stopped');
          this.isListening = false;

          // Clean up listeners
          partialResultsListener.remove();
          listeningStateListener.remove();

          onEnd();
        }
      });

      // Wait for final results
      try {
        const result = await SpeechRecognitionPlugin.start();
        if (result.matches && result.matches.length > 0) {
          const transcript = result.matches[0];
          console.log(`✅ Final result: "${transcript}"`);

          onResult({
            transcript,
            confidence: 0.9, // Final results have high confidence
            isFinal: true
          });
        }
      } catch (error: any) {
        console.error('❌ Speech recognition error:', error);
        onError(`Speech recognition error: ${error.message}`);
      }

    } catch (error: any) {
      console.error('❌ Failed to handle speech results:', error);
      onError(`Failed to handle speech results: ${error.message}`);
    }
  }

  /**
   * Stop listening for speech input
   */
  public async stopListening(): Promise<void> {
    try {
      if (this.isListening) {
        console.log('🛑 Stopping speech recognition...');
        await SpeechRecognitionPlugin.stop();
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
      const result = await SpeechRecognitionPlugin.isListening();
      return result.listening;
    } catch (error) {
      console.warn('Could not check listening state:', error);
      return this.isListening;
    }
  }

  /**
   * Get supported languages for speech recognition
   */
  public async getSupportedLanguages(): Promise<Array<{ code: string; name: string }>> {
    try {
      const result = await SpeechRecognitionPlugin.getSupportedLanguages();

      if (result.languages && result.languages.length > 0) {
        // Convert the plugin's language format to our format
        return result.languages.map((lang: any) => ({
          code: lang.code || lang,
          name: lang.name || lang
        }));
      }
    } catch (error) {
      console.warn('Could not get supported languages from plugin:', error);
    }

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
      // Remove all listeners
      await SpeechRecognitionPlugin.removeAllListeners();

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
      const permissionState = status.speechRecognition;

      // Convert PermissionState to our expected types
      if (permissionState === 'granted') return 'granted';
      if (permissionState === 'denied') return 'denied';
      // Handle 'prompt' and 'prompt-with-rationale' as 'prompt'
      return 'prompt';
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
        return newStatus.speechRecognition === 'granted';
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
export { SpeechRecognitionPlugin };
