import { useState, useEffect, useCallback } from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { speechToTextService } from "@/utils/speechToText";
import { parseNaturalLanguageQuery } from "@/utils/nlpFilters";
import { isMobile } from "@/lib/utils";

type VoiceState = "idle" | "listening" | "processing";

interface VoiceButtonProps {
  onFiltersApplied: (filters: Array<{ filterId: string; value: any }>) => void;
  swipeDirection?: "menu" | "pass" | null;
}

export function VoiceButton({
  onFiltersApplied,
  swipeDirection,
}: VoiceButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");

  useEffect(() => {
    // Check if speech recognition is supported
    const checkSupport = async () => {
      try {
        const supported = await speechToTextService.isAvailable();
        setIsSupported(supported);
      } catch (error) {
        console.error("Error checking speech recognition support:", error);
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  const startListening = async () => {
    setVoiceState("listening");

    try {
      await speechToTextService.startListening(
        (result) => {
          if (result.isFinal) {
            // Final result - process with NLP
            setVoiceState("processing");

            // Process the transcript with our NLP system
            setTimeout(() => {
              const nlpResult = parseNaturalLanguageQuery(result.transcript);

              if (nlpResult.filters.length > 0) {
                // Apply the filters
                onFiltersApplied(nlpResult.filters);
                console.log("Applied filters:", nlpResult.filters);
              } else {
                console.log("No filters found in:", result.transcript);
              }

              // Always reset to idle state after processing
              setVoiceState("idle");
            }, 800);
          }
        },
        (error: string) => {
          console.error("Speech recognition error:", error);
          setVoiceState("idle");

          // This should rarely happen now since we check permissions first
          alert("Voice recognition failed. Please try again.");
        },
        () => {
          // Speech recognition ended - only reset if we're not already processing
          if (voiceState !== "processing") {
            setVoiceState("idle");
          }
        }
      );
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setVoiceState("idle");
      alert("Could not start voice search. Please try again.");
    }
  };

  const stopListening = () => {
    if (speechToTextService && voiceState === "listening") {
      speechToTextService.stopListening();
      // Set to processing state to show we're working on the speech
      setVoiceState("processing");
    }
  };

  const handleVoiceClick = () => {
    if (voiceState === "listening") {
      stopListening();
    } else if (voiceState === "idle") {
      startListening();
    }
    // Do nothing if processing
  };

  const getButtonStyle = useCallback(() => {
    switch (voiceState) {
      case "listening":
        return [styles.voiceButton, styles.listeningState];
      case "processing":
        return [styles.voiceButton, styles.processingState];
      default:
        return [styles.voiceButton, styles.idleState];
    }
  }, [voiceState]);

  const getIcon = useCallback(() => {
    // Always ensure we have an icon - never return null or undefined
    if (voiceState === "listening") {
      return <Ionicons name="square" size={16} color="#DC2626" />;
    } else if (voiceState === "processing") {
      return <Ionicons name="mic" size={20} color="#2563EB" />;
    } else {
      // Default to microphone icon for any other state
      console.log("Voice state:", voiceState);
      return <Ionicons name="mic" size={20} color="#7C3AED" />;
    }
  }, [voiceState]);

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  // Check if we're on a mobile device to prevent hover styles
  const isMobileDevice = isMobile();

  return (
    <TouchableOpacity
      style={[
        ...getButtonStyle(),
        swipeDirection ? styles.buttonDisabled : null,
      ]}
      onPress={handleVoiceClick}
      disabled={voiceState === "processing"}
    >
      {getIcon()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  idleState: {
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
  },
  listeningState: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
    borderRadius: 24,
  },
  processingState: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
    borderRadius: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
