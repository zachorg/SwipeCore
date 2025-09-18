import { useState, useEffect, useCallback, memo, useRef } from "react";
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

export const VoiceButton = memo(function VoiceButton({
  onFiltersApplied,
  swipeDirection,
}: VoiceButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [listeningTimeoutId, setListeningTimeoutId] =
    useState<NodeJS.Timeout | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const lastTranscriptRef = useRef<string>("");

  // Debug state changes
  useEffect(() => {
    console.log("🎤 Voice state changed to:", voiceState);
  }, [voiceState]);
  const [useFallback, setUseFallback] = useState(false);

  // Helper function to clear listening timeout
  const clearListeningTimeout = () => {
    if (listeningTimeoutId) {
      clearTimeout(listeningTimeoutId);
      setListeningTimeoutId(null);
    }
  };

  useEffect(() => {
    // Check if speech recognition is supported
    const checkSupport = async () => {
      try {
        const supported = await speechToTextService.isAvailable();
        setIsSupported(supported);

        // Run comprehensive test
        if (supported) {
          const testResult = await speechToTextService.testSpeechRecognition();

          // If test fails, use fallback
          if (!testResult) {
            setUseFallback(true);
          }
        }
      } catch (error) {
        setIsSupported(false);
        setUseFallback(true);
      }
    };

    checkSupport();
  }, []);

  const startListening = async () => {
    // Prevent starting if not in idle state
    if (voiceState !== "idle") {
      console.log("🎤 Cannot start listening - not in idle state:", voiceState);
      return;
    }

    // Always ensure any previous session is stopped before starting new one
    try {
      console.log("🎤 Ensuring previous session is stopped...");
      await speechToTextService.stopListening();
      // Give it a moment to fully clean up
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (e) {
      console.log("🎤 No previous session to stop (this is normal):", e);
    }

    setVoiceState("listening");
    setLastTranscript(""); // Clear any previous transcript
    lastTranscriptRef.current = ""; // Clear ref as well

    // Set a timeout to prevent infinite listening
    const timeoutId = setTimeout(() => {
      console.log("🎤 Voice listening timeout - stopping automatically");

      // Check if we have a transcript to process before timing out
      const currentTranscript = lastTranscriptRef.current;
      if (currentTranscript && currentTranscript.trim().length > 0) {
        console.log(
          "🎤 Processing last transcript before timeout:",
          currentTranscript
        );
        setVoiceState("processing");

        // Process the last transcript we received
        const nlpResult = parseNaturalLanguageQuery(currentTranscript);
        console.log("🎤 NLP Result (timeout processing):", nlpResult);

        if (nlpResult.filters.length > 0) {
          console.log(
            "🎤 Applying filters (timeout processing):",
            nlpResult.filters
          );
          onFiltersApplied(nlpResult.filters);
        } else {
          console.log("🎤 No filters found in timeout processing");
        }
      }

      setVoiceState("idle");
      try {
        speechToTextService.stopListening();
      } catch (e) {
        console.log("🎤 Error stopping on timeout:", e);
      }
    }, 15000); // 15 second timeout

    setListeningTimeoutId(timeoutId);

    try {
      if (useFallback) {
        // Use fallback simulation
        await speechToTextService.simulateSpeechRecognition(
          (result) => {
            console.log("🎤 Speech result received (fallback):", {
              transcript: result.transcript,
              isFinal: result.isFinal,
              confidence: result.confidence,
            });

            // Store the latest transcript in both state and ref
            setLastTranscript(result.transcript);
            lastTranscriptRef.current = result.transcript;

            if (result.isFinal) {
              // Final result - process with NLP
              console.log(
                "🎤 Processing final speech result:",
                result.transcript
              );
              clearListeningTimeout(); // Clear timeout since we got a result
              lastTranscriptRef.current = ""; // Clear ref to prevent timeout processing
              setVoiceState("processing");

              // Process the transcript with our NLP system immediately
              // (removed setTimeout to prevent race conditions)
              const nlpResult = parseNaturalLanguageQuery(result.transcript);
              console.log("🎤 NLP Result (fallback):", nlpResult);

              if (nlpResult.filters.length > 0) {
                // Apply the filters
                console.log(
                  "🎤 Applying filters (fallback):",
                  nlpResult.filters
                );
                console.log(
                  "🎤 Calling onFiltersApplied with:",
                  nlpResult.filters
                );
                onFiltersApplied(nlpResult.filters);
                console.log("🎤 onFiltersApplied called successfully");
              } else {
                console.log("🎤 No filters found (fallback)");
                console.log("🎤 Original query was:", result.transcript);
                console.log("🎤 Parsed filters:", nlpResult.filters);
                console.log("🎤 Confidence:", nlpResult.confidence);
                console.log("🎤 Interpreted as:", nlpResult.interpretedAs);
              }

              // Always reset to idle state after processing
              setVoiceState("idle");
            }
          },
          (error: string) => {
            console.log("🎤 Voice error (fallback):", error);
            clearListeningTimeout(); // Clear timeout on error

            // Check if we have a meaningful transcript to process before giving up
            const currentTranscript = lastTranscriptRef.current;
            if (
              error.includes("No speech detected") &&
              currentTranscript &&
              currentTranscript.trim().length > 3
            ) {
              console.log(
                "🎤 Processing transcript despite 'No speech detected' error (fallback):",
                currentTranscript
              );
              setVoiceState("processing");

              // Process the transcript we have
              const nlpResult = parseNaturalLanguageQuery(currentTranscript);
              console.log(
                "🎤 NLP Result (fallback error recovery):",
                nlpResult
              );

              if (nlpResult.filters.length > 0) {
                console.log(
                  "🎤 Applying filters (fallback error recovery):",
                  nlpResult.filters
                );
                console.log(
                  "🎤 Calling onFiltersApplied with (error recovery):",
                  nlpResult.filters
                );
                onFiltersApplied(nlpResult.filters);
                console.log(
                  "🎤 onFiltersApplied called successfully (error recovery)"
                );
              } else {
                console.log("🎤 No filters found in fallback error recovery");
              }
            }

            setVoiceState("idle");

            // Don't show alerts for common "no speech" errors in fallback mode
            if (!error.includes("No speech detected")) {
              alert("Voice recognition failed. Please try again.");
            }
          },
          () => {
            // Speech recognition ended - use state updater function to avoid stale closure
            console.log("🎤 Speech ended (fallback)");
            // Don't immediately reset to idle - let the result callback handle state transitions
            // Only reset if we're still in listening state after a delay (no speech detected)
            setTimeout(() => {
              setVoiceState((currentState) => {
                console.log(
                  "🎤 Checking state after speech ended (fallback):",
                  currentState
                );
                // Only reset to idle if we're still in listening state (no result was processed)
                return currentState === "listening" ? "idle" : currentState;
              });
            }, 100);
          }
        );
      } else {
        // Use native speech recognition
        await speechToTextService.startListening(
          (result) => {
            console.log("🎤 Speech result received (native):", {
              transcript: result.transcript,
              isFinal: result.isFinal,
              confidence: result.confidence,
            });

            // Store the latest transcript in both state and ref
            setLastTranscript(result.transcript);
            lastTranscriptRef.current = result.transcript;

            if (result.isFinal) {
              // Final result - process with NLP
              console.log(
                "🎤 Processing final speech result:",
                result.transcript
              );
              clearListeningTimeout(); // Clear timeout since we got a result
              lastTranscriptRef.current = ""; // Clear ref to prevent timeout processing
              setVoiceState("processing");

              // Process the transcript with our NLP system immediately
              // (removed setTimeout to prevent race conditions)
              const nlpResult = parseNaturalLanguageQuery(result.transcript);
              console.log("🎤 NLP Result (native):", nlpResult);

              if (nlpResult.filters.length > 0) {
                // Apply the filters
                console.log("🎤 Applying filters (native):", nlpResult.filters);
                onFiltersApplied(nlpResult.filters);
              } else {
                console.log("🎤 No filters found (native)");
                console.log("🎤 Original query was:", result.transcript);
                console.log("🎤 Parsed filters:", nlpResult.filters);
                console.log("🎤 Confidence:", nlpResult.confidence);
                console.log("🎤 Interpreted as:", nlpResult.interpretedAs);
              }

              // Always reset to idle state after processing
              setVoiceState("idle");
            }
          },
          (error: string) => {
            console.log("🎤 Voice error (native):", error);
            clearListeningTimeout(); // Clear timeout on error

            // Check if we have a meaningful transcript to process before giving up
            const currentTranscript = lastTranscriptRef.current;
            if (
              error.includes("No speech detected") &&
              currentTranscript &&
              currentTranscript.trim().length > 3
            ) {
              console.log(
                "🎤 Processing transcript despite 'No speech detected' error:",
                currentTranscript
              );
              setVoiceState("processing");

              // Process the transcript we have
              const nlpResult = parseNaturalLanguageQuery(currentTranscript);
              console.log("🎤 NLP Result (error recovery):", nlpResult);

              if (nlpResult.filters.length > 0) {
                console.log(
                  "🎤 Applying filters (error recovery):",
                  nlpResult.filters
                );
                onFiltersApplied(nlpResult.filters);
              } else {
                console.log("🎤 No filters found in error recovery");
              }
            }

            setVoiceState("idle");

            // Ignore "No speech detected" errors if we're already switching to fallback
            if (error.includes("No speech detected") && useFallback) {
              console.log(
                "🎤 Ignoring 'No speech detected' error in fallback mode"
              );
              return;
            }

            // Only try fallback for specific errors, not for "Already listening"
            if (!useFallback && !error.includes("Already listening")) {
              setUseFallback(true);
              // Don't automatically retry - let user click again
              console.log(
                "🎤 Switching to fallback mode, user needs to click again"
              );
            } else if (error.includes("Already listening")) {
              console.log(
                "🎤 Speech recognition already active, stopping current session"
              );
              // Force stop any existing session
              try {
                speechToTextService.stopListening();
              } catch (e) {
                console.log("🎤 Error stopping existing session:", e);
              }
            } else if (!error.includes("No speech detected")) {
              // Only show alert for serious errors, not for common "no speech" errors
              alert("Voice recognition failed. Please try again.");
            }
          },
          () => {
            // Speech recognition ended - use state updater function to avoid stale closure
            console.log("🎤 Speech ended (native)");
            // Don't immediately reset to idle - let the result callback handle state transitions
            // Only reset if we're still in listening state after a delay (no speech detected)
            setTimeout(() => {
              setVoiceState((currentState) => {
                console.log(
                  "🎤 Checking state after speech ended (native):",
                  currentState
                );
                // Only reset to idle if we're still in listening state (no result was processed)
                return currentState === "listening" ? "idle" : currentState;
              });
            }, 100);
          }
        );
      }
    } catch (error) {
      clearListeningTimeout(); // Clear timeout on catch error
      setVoiceState("idle");
      console.log("🎤 Catch block error:", error);

      // Only try fallback for initialization errors, not for active session conflicts
      if (!useFallback && !String(error).includes("Already listening")) {
        setUseFallback(true);
        console.log(
          "🎤 Switching to fallback mode due to initialization error"
        );
      } else {
        console.log("🎤 Could not start voice search, user needs to try again");
      }
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
    console.log("🎤 Voice button clicked, current state:", voiceState);
    if (voiceState === "idle") {
      console.log("🎤 Starting listening...");
      startListening();
    } else {
      console.log(
        "🎤 Button clicked but cannot be stopped manually - will stop automatically when NLP processing ends"
      );
    }
    // Voice button cannot be stopped manually - only stops automatically when NLP processing ends
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
      return <Ionicons name="mic" size={20} color="#7C3AED" />;
    }
  }, [voiceState]);

  // Don't render if not supported
  if (!isSupported && !useFallback) {
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
});

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
