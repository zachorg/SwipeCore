import React, { useState, useEffect } from "react";
import { Mic, Volume2, Sparkles, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { speechToTextService } from "@/utils/speechToText";
import { parseNaturalLanguageQuery, NLPResult } from "@/utils/nlpFilters";

type VoiceSearchState =
  | "idle"
  | "listening"
  | "processing"
  | "success"
  | "error";
type PermissionState = "unknown" | "granted" | "denied" | "prompt";

interface FloatingVoiceSearchProps {
  onFiltersApplied: (filters: Array<{ filterId: string; value: any }>) => void;
  onClose?: () => void;
  className?: string;
}

export function FloatingVoiceSearch({
  onFiltersApplied,
  onClose,
  className = "",
}: FloatingVoiceSearchProps) {
  const [state, setState] = useState<VoiceSearchState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [nlpResult, setNlpResult] = useState<NLPResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // Always expanded when modal is shown

  useEffect(() => {
    // Check if device is mobile or running in Capacitor/Cordova
    const checkMobile = () => {
      const userAgent =
        navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent.toLowerCase()
        );
      const isCapacitorApp =
        !!(window as any).Capacitor || !!(window as any).cordova;

      setIsMobile(isMobileDevice || isCapacitorApp);
    };

    // Check if the service is properly initialized
    const initializeService = async () => {
      try {
        if (!speechToTextService) {
          setIsSupported(false);
          return;
        }

        const supported = await speechToTextService.isAvailable();
        setIsSupported(supported);
      } catch (error) {
        console.error(
          "VoiceSearch: Error checking speech recognition support:",
          error
        );
        setIsSupported(false);
      }
    };

    checkMobile();
    initializeService();
  }, []);

  const startListening = async () => {
    if (!isSupported || !speechToTextService) {
      setError("Voice search is not available on this device");
      setState("error");
      setIsExpanded(true);
      return;
    }

    // Reset state and start immediately
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    setNlpResult(null);
    setState("listening");

    try {
      // Start speech recognition - it will handle permissions internally
      await speechToTextService.startListening(
        (result) => {
          if (result.isFinal) {
            setTranscript(result.transcript);
            setInterimTranscript("");
            setState("processing");

            // Process with NLP after a short delay for better UX
            setTimeout(() => {
              const nlpResult = parseNaturalLanguageQuery(result.transcript);
              setNlpResult(nlpResult);
              setState("success");
            }, 800);
          } else {
            setInterimTranscript(result.transcript);
          }
        },
        (error: string) => {
          console.error("Speech recognition error:", error);

          // Handle permission errors gracefully
          if (error.includes("permission") || error.includes("denied")) {
            setError(
              "Microphone access is needed for voice search. Please allow microphone access and try again."
            );
          } else if (error.includes("not-allowed")) {
            setError(
              "Please allow microphone access in your browser settings and try again."
            );
          } else {
            setError("Voice search failed. Please try again.");
          }

          setState("error");
          setInterimTranscript("");
        },
        () => {
          // Only reset to idle if we're still in listening state
          if (state === "listening") {
            setState("idle");
          }
        }
      );
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setError("Could not start voice search. Please try again.");
      setState("error");
    }
  };

  const stopListening = () => {
    if (speechToTextService) {
      speechToTextService.stopListening();
    }
    setState("idle");
  };

  const applyFilters = () => {
    if (nlpResult && nlpResult.filters.length > 0) {
      onFiltersApplied(nlpResult.filters);
      reset();
    }
  };

  const reset = () => {
    setState("idle");
    setTranscript("");
    setInterimTranscript("");
    setNlpResult(null);
    setError(null);
    if (onClose) {
      onClose();
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case "listening":
        return <Volume2 className="w-7 h-7 text-white animate-pulse" />;
      case "processing":
        return <Brain className="w-7 h-7 text-white animate-pulse" />;
      case "success":
        return <Sparkles className="w-7 h-7 text-white" />;
      case "error":
        return <Mic className="w-7 h-7 text-white opacity-60" />;
      default:
        return <Mic className="w-7 h-7 text-white" />;
    }
  };

  const getButtonStyle = () => {
    switch (state) {
      case "listening":
        return {
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          boxShadow:
            "0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.3)",
          transform: "scale(1.1)",
        };
      case "processing":
        return {
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          boxShadow:
            "0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3)",
          transform: "scale(1.05)",
        };
      case "success":
        return {
          background: "linear-gradient(135deg, #10b981, #059669)",
          boxShadow:
            "0 0 30px rgba(16, 185, 129, 0.6), 0 0 60px rgba(16, 185, 129, 0.3)",
          transform: "scale(1.05)",
        };
      case "error":
        return {
          background: "linear-gradient(135deg, #6b7280, #4b5563)",
          boxShadow: "0 0 20px rgba(107, 114, 128, 0.4)",
          transform: "scale(1)",
        };
      default:
        return {
          background: "linear-gradient(135deg, #8b5cf6, #7c3aed, #a855f7)",
          boxShadow:
            "0 0 25px rgba(139, 92, 246, 0.5), 0 0 50px rgba(139, 92, 246, 0.2)",
          transform: "scale(1)",
        };
    }
  };

  if (!isSupported) {
    return null; // Don't show the button if not supported
  }

  // Auto-start listening when modal opens
  useEffect(() => {
    if (isSupported) {
      startListening();
    }
  }, [isSupported]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={reset}
    >
      <Card
        className="w-full max-w-md bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-6">
          {/* Header with State */}
          <div className="text-center mb-6">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={getButtonStyle()}
            >
              {getStateIcon()}
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {state === "listening" && "🎤 Listening..."}
              {state === "processing" && "🧠 Understanding..."}
              {state === "success" && "✨ Found filters!"}
              {state === "error" && "❌ Something went wrong"}
              {state === "idle" && "🎤 Voice Search"}
            </h3>
            <p className="text-sm text-gray-600">
              {state === "listening" && "Speak your restaurant preferences"}
              {state === "processing" && "Processing your request..."}
              {state === "success" && "Ready to apply these filters"}
              {state === "error" && "Please try again"}
              {state === "idle" && "Tap to start voice search"}
            </p>
          </div>

          {/* Live Transcript with Animation */}
          {(transcript || interimTranscript) && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mt-2"></div>
                <p className="text-gray-700 leading-relaxed">
                  <span className="font-medium">{transcript}</span>
                  <span className="text-blue-600 italic animate-pulse">
                    {interimTranscript}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Beautiful Filter Results */}
          {nlpResult && state === "success" && (
            <div className="mb-6 space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  {nlpResult.filters.length} filter
                  {nlpResult.filters.length !== 1 ? "s" : ""} found
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {nlpResult.filters.map((filter, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {filter.filterId.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-purple-100 text-purple-800 border-0"
                    >
                      {String(filter.value)}
                    </Badge>
                  </div>
                ))}
              </div>

              <Button
                onClick={applyFilters}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Zap className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && state === "error" && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
                  <Mic className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-red-700 text-sm leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {state === "error" && (
              <Button
                onClick={startListening}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl"
              >
                Try Again
              </Button>
            )}
            <Button
              variant="outline"
              onClick={reset}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-xl"
            >
              {state === "listening" ? "Stop" : "Close"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
