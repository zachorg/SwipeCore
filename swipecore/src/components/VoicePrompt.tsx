import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import {
  speechToTextService,
  SpeechRecognitionResult,
} from "../utils/speechToText";
import { parseNaturalLanguageQuery } from "../utils/nlpFilters";

interface VoicePromptProps {
  onFiltersApplied: (filters: Array<{ filterId: string; value: any }>) => void;
  onCancel: () => void;
}

export function VoicePrompt({ onFiltersApplied, onCancel }: VoicePromptProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      speechToTextService.cleanup();
    };
  }, []);

  const startListening = async () => {
    try {
      console.log("🎤 VoicePrompt - Starting listening...");
      setError(null);
      setTranscript("");
      setIsListening(true);
      setIsProcessing(false);

      await speechToTextService.startListening(
        (result: SpeechRecognitionResult) => {
          console.log(
            "🎤 VoicePrompt - Speech result received:",
            JSON.stringify(result, null, 2)
          );
          console.log("🎤 VoicePrompt - Transcript:", result.transcript);
          console.log("🎤 VoicePrompt - Is Final:", result.isFinal);
          console.log("🎤 VoicePrompt - Confidence:", result.confidence);

          setTranscript(result.transcript);

          if (result.isFinal) {
            console.log("🎤 VoicePrompt - Final result, processing transcript");
            setIsListening(false);
            processTranscript(result.transcript);
          }
        },
        (error: string) => {
          console.error("❌ VoicePrompt - Speech recognition error:", error);
          setError(error);
          setIsListening(false);
        },
        () => {
          console.log("🛑 VoicePrompt - Speech recognition ended");
          setIsListening(false);
        }
      );
    } catch (error) {
      console.error("❌ Failed to start listening:", error);
      setError("Failed to start voice recognition");
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await speechToTextService.stopListening();
      setIsListening(false);
    } catch (error) {
      console.error("❌ Failed to stop listening:", error);
    }
  };

  const processTranscript = async (text: string) => {
    if (!text.trim()) {
      setError("No speech detected. Please try again.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log("🔍 Processing transcript:", text);

      // Parse filters from the speech
      const nlpResult = await parseNaturalLanguageQuery(text);
      const filters = nlpResult.filters;

      if (filters.length === 0) {
        setError(
          "No filters found in your speech. Try saying something like 'show me Italian restaurants' or 'find places near me'"
        );
        setIsProcessing(false);
        return;
      }

      console.log("✅ Parsed filters:", filters);

      // Apply the filters
      onFiltersApplied(filters);
    } catch (error) {
      console.error("❌ Error processing transcript:", error);
      setError("Failed to process your request. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleMicPress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleCancel = () => {
    if (isListening) {
      stopListening();
    }
    onCancel();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Search</Text>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Microphone Button */}
        <TouchableOpacity
          onPress={handleMicPress}
          style={[
            styles.micButton,
            isListening && styles.micButtonListening,
            isProcessing && styles.micButtonProcessing,
          ]}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <Text style={styles.micIcon}>{isListening ? "🔴" : "🎤"}</Text>
          )}
        </TouchableOpacity>

        {/* Status Text */}
        <Text style={styles.statusText}>
          {isProcessing
            ? "Processing your request..."
            : isListening
            ? "Listening... Speak now!"
            : "Tap the microphone to start"}
        </Text>

        {/* Transcript Display */}
        {transcript && (
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptLabel}>You said:</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Try saying:</Text>
          <Text style={styles.instruction}>
            • "Show me Italian restaurants"
          </Text>
          <Text style={styles.instruction}>• "Find places near me"</Text>
          <Text style={styles.instruction}>• "Restaurants with 4+ stars"</Text>
          <Text style={styles.instruction}>• "Open now"</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 14,
    color: "#6B7280",
  },
  content: {
    alignItems: "center",
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  micButtonListening: {
    backgroundColor: "#EF4444",
    transform: [{ scale: 1.05 }],
  },
  micButtonProcessing: {
    backgroundColor: "#10B981",
  },
  micIcon: {
    fontSize: 32,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 16,
  },
  transcriptContainer: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: "100%",
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 14,
    color: "#111827",
    fontStyle: "italic",
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: "100%",
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    textAlign: "center",
  },
  instructionsContainer: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 8,
    width: "100%",
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  instruction: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
});
