import { useState, useEffect, useCallback } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speechToTextService } from "@/utils/speechToText";
import { parseNaturalLanguageQuery } from "@/utils/nlpFilters";
import { isMobile } from "@/lib/utils";

type VoiceState = "idle" | "listening" | "processing";

interface VoiceButtonProps {
  onFiltersApplied: (filters: Array<{ filterId: string; value: any }>) => void;
  swipeDirection?: "menu" | "pass" | null;
  className?: string;
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
        return `border-red-400 bg-red-50 text-red-600 animate-pulse`;
      case "processing":
        return "border-blue-400 bg-blue-50 text-blue-600";
      default:
        return `border-purple-300 bg-white text-purple-600`;
    }
  }, [voiceState]);

  const getIcon = useCallback(() => {
    // Always ensure we have an icon - never return null or undefined
    if (voiceState === "listening") {
      return <Square className="w-4 h-4" />;
    } else if (voiceState === "processing") {
      return <Mic className="w-5 h-5 animate-pulse" />;
    } else {
      // Default to microphone icon for any other state
      console.log("Voice state:", voiceState);
      return <Mic className="w-5 h-5 color-purple" />;
    }
  }, [voiceState]);

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  // Check if we're on a mobile device to prevent hover styles
  const isMobileDevice = isMobile();

  return (
    <Button
      variant="outline"
      size="sm"
      className={`w-12 h-12 rounded-full border-2 shadow-md transition-all duration-200 ${getButtonStyle()} ${
        swipeDirection
          ? "opacity-50"
          : isMobileDevice
          ? ""
          : "hover:scale-105 hover:shadow-lg"
      }`}
      onClick={handleVoiceClick}
      disabled={voiceState === "processing"}
    >
      {getIcon()}
    </Button>
  );
}
