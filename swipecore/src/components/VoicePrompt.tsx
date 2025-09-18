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
import { useFilterContext } from "../contexts/FilterContext";

interface VoicePromptProps {
  onFiltersApplied: (filters: Array<{ filterId: string; value: any }>) => void;
  onCancel: () => void;
  // Add a callback to trigger re-filtering when cards are available
  onTriggerRefilter?: () => void;
}

export function VoicePrompt({
  onFiltersApplied,
  onCancel,
  onTriggerRefilter,
}: VoicePromptProps) {
  console.log(
    "🎤 VoicePrompt - Component initialized with onFiltersApplied:",
    typeof onFiltersApplied
  );

  // Use FilterProvider as the single source of truth
  const { applyVoiceFilters } = useFilterContext();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAppliedFilters, setLastAppliedFilters] = useState<Array<{
    filterId: string;
    value: any;
  }> | null>(null);

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
    console.log("🎤 VoicePrompt - processTranscript called with:", text);

    if (!text.trim()) {
      console.log("🎤 VoicePrompt - No speech detected");
      setError("No speech detected. Please try again.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log("🔍 VoicePrompt - Processing transcript:", text);

      // Parse filters from the speech
      console.log(
        "🔍 VoicePrompt - Calling parseNaturalLanguageQuery with:",
        text
      );
      const nlpResult = await parseNaturalLanguageQuery(text);
      console.log(
        "🔍 VoicePrompt - NLP result:",
        JSON.stringify(nlpResult, null, 2)
      );
      const filters = nlpResult.filters;

      if (filters.length === 0) {
        console.log("🎤 VoicePrompt - No filters found in speech");
        setError(
          "No filters found in your speech. Try saying something like 'show me Italian restaurants' or 'find places near me'"
        );
        setIsProcessing(false);
        return;
      }

      console.log("✅ VoicePrompt - Parsed filters:", filters);
      console.log(
        "✅ VoicePrompt - Applying filters via FilterProvider:",
        JSON.stringify(filters, null, 2)
      );

      // Store the filters for potential re-application
      setLastAppliedFilters(filters);
      console.log(
        "💾 VoicePrompt - Stored filters for re-application:",
        filters
      );

      // Apply the filters directly through FilterProvider (add to existing filters)
      try {
        applyVoiceFilters(filters);
        console.log(
          "✅ VoicePrompt - Filters added via FilterProvider successfully"
        );

        // Call the callback for any additional handling (like closing the modal)
        if (typeof onFiltersApplied === "function") {
          onFiltersApplied(filters);
        }

        // Trigger re-filtering to ensure filters are applied to current cards
        if (typeof onTriggerRefilter === "function") {
          console.log(
            "🔄 VoicePrompt - Triggering re-filtering for current cards"
          );
          // Use setTimeout to ensure the filters are applied first
          setTimeout(() => {
            onTriggerRefilter();
          }, 100);
        } else {
          console.log(
            "⚠️ VoicePrompt - onTriggerRefilter not provided, filters may not be applied to current cards"
          );
        }
      } catch (error) {
        console.error(
          "❌ VoicePrompt - Error applying filters via FilterProvider:",
          error
        );
        setError("Failed to apply filters. Please try again.");
        setIsProcessing(false);
        return;
      }

      // Set processing to false after applying filters
      setIsProcessing(false);
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

  // Method to re-apply the last applied filters
  const reapplyLastFilters = () => {
    if (lastAppliedFilters && lastAppliedFilters.length > 0) {
      console.log(
        "🔄 VoicePrompt - Re-applying last filters via FilterProvider:",
        lastAppliedFilters
      );
      try {
        applyVoiceFilters(lastAppliedFilters);
        console.log(
          "✅ VoicePrompt - Last filters re-added via FilterProvider successfully"
        );

        // Call the callback for any additional handling
        if (typeof onFiltersApplied === "function") {
          onFiltersApplied(lastAppliedFilters);
        }

        // Trigger re-filtering
        if (typeof onTriggerRefilter === "function") {
          setTimeout(() => {
            onTriggerRefilter();
          }, 100);
        }
      } catch (error) {
        console.error(
          "❌ VoicePrompt - Error re-applying last filters via FilterProvider:",
          error
        );
      }
    } else {
      console.log("⚠️ VoicePrompt - No last filters to re-apply");
    }
  };

  // Expose the reapply method through a ref or callback
  useEffect(() => {
    // This could be used by parent components to trigger re-filtering
    if (typeof onTriggerRefilter === "function") {
      // Store the reapply function globally or pass it to parent
      (window as any).voicePromptReapply = reapplyLastFilters;
    }
  }, [lastAppliedFilters, onTriggerRefilter]);

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
