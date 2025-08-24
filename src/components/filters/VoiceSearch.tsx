// Voice Search Component
// Converts speech to text, then uses NLP to apply filters

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mic,
  MicOff,
  Volume2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Settings,
  RefreshCw,
} from "lucide-react";
import {
  speechToTextService,
  SpeechRecognitionResult,
} from "@/utils/speechToText";
import { parseNaturalLanguageQuery, NLPResult } from "@/utils/nlpFilters";

interface VoiceSearchProps {
  onFiltersApplied: (filters: Array<{ filterId: string; value: any }>) => void;
  className?: string;
}

type VoiceSearchState =
  | "idle"
  | "listening"
  | "processing"
  | "success"
  | "error"
  | "permission-needed";
type PermissionState = "unknown" | "granted" | "denied" | "prompt";

export function VoiceSearch({
  onFiltersApplied,
  className = "",
}: VoiceSearchProps) {
  const [state, setState] = useState<VoiceSearchState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [nlpResult, setNlpResult] = useState<NLPResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

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

      // Consider Capacitor/Cordova apps as mobile for permission handling
      setIsMobile(isMobileDevice || isCapacitorApp);

      if (isCapacitorApp) {
        console.log("📱 Capacitor/Cordova app detected");
      }
    };

    // Check if the service is properly initialized
    const initializeService = async () => {
      try {
        if (!speechToTextService) {
          setInitError("Speech service not available");
          setIsSupported(false);
          return;
        }

        const supported = await speechToTextService.isAvailable();
        setIsSupported(supported);
        setInitError(null);
      } catch (error) {
        console.error(
          "VoiceSearch: Error checking speech recognition support:",
          error
        );
        setInitError(`Initialization error: ${error}`);
        setIsSupported(false);
      }
    };

    checkMobile();
    initializeService();
  }, []);

  const startListening = async () => {
    if (!isSupported || !speechToTextService) {
      setError("Speech recognition is not supported in your browser");
      setState("error");
      return;
    }

    // Reset state
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    setNlpResult(null);

    setState("listening");

    // Start speech recognition
    try {
      await speechToTextService.startListening(
        (result: SpeechRecognitionResult) => {
          if (result.isFinal) {
            setTranscript(result.transcript);
            setInterimTranscript("");
            setState("processing");

            // Process with NLP
            setTimeout(() => {
              const nlpResult = parseNaturalLanguageQuery(result.transcript);
              setNlpResult(nlpResult);
              setState("success");
            }, 500);
          } else {
            setInterimTranscript(result.transcript);
          }
        },
        (error: string) => {
          console.error("Speech recognition error:", error);
          setError(error);
          setState("error");
          setInterimTranscript("");
        },
        () => {
          if (state === "listening") {
            setState("idle");
          }
        }
      );

      // If we get here, speech recognition started successfully
      setState("listening");
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setError("Failed to start voice recognition. Please try again.");
      setState("error");
    }
  };

  const stopListening = () => {
    speechToTextService.stopListening();
    setState("idle");
    setInterimTranscript("");
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
  };

  const openBrowserSettings = async () => {
    const isCapacitorApp =
      !!(window as any).Capacitor || !!(window as any).cordova;

    if (isCapacitorApp) {
      try {
        // Try to open device settings directly
        setError(
          "Device settings opened. Please enable microphone permissions for this app and try again."
        );
      } catch (error) {
        setError(
          "To enable microphone: Go to your device Settings → Apps → [App Name] → Permissions → Microphone → Allow"
        );
      }
    } else if (isMobile) {
      // Mobile browser instructions
      setError(
        "To enable microphone: Go to your browser settings → Site permissions → Microphone → Allow for this site"
      );
    } else {
      // Desktop browser instructions
      setError(
        "Click the microphone icon in your browser's address bar to manage permissions"
      );
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case "listening":
        return <Mic className="w-5 h-5 text-red-500 animate-pulse" />;
      case "processing":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "permission-needed":
        return <Settings className="w-5 h-5 text-orange-500 animate-pulse" />;
      default:
        return <Mic className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStateText = () => {
    switch (state) {
      case "listening":
        return "Listening...";
      case "processing":
        return "Processing...";
      case "success":
        return "Ready to apply";
      case "error":
        return "Error occurred";
      case "permission-needed":
        return "Requesting permission...";
      default:
        return "Voice Search";
    }
  };

  const getStateColor = () => {
    switch (state) {
      case "listening":
        return "bg-red-500 hover:bg-red-600";
      case "processing":
        return "bg-blue-500 hover:bg-blue-600";
      case "success":
        return "bg-green-500 hover:bg-green-600";
      case "error":
        return "bg-red-500 hover:bg-red-600";
      case "permission-needed":
        return "bg-orange-500 hover:bg-orange-600";
      default:
        return "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700";
    }
  };

  if (!isSupported) {
    return (
      <Card className={`bg-gray-50 border-gray-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-gray-500">
            <MicOff className="w-5 h-5" />
            <span className="text-sm">
              Voice search is not supported in your browser. Try Chrome, Safari,
              or Edge for the best experience.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Voice Search Button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={state === "listening" ? stopListening : startListening}
          disabled={state === "processing" || state === "permission-needed"}
          className={`${getStateColor()} text-white transition-all duration-200`}
        >
          {getStateIcon()}
          <span className="ml-2">{getStateText()}</span>
        </Button>

        {state === "listening" && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Volume2 className="w-4 h-4" />
            <span>Speak now...</span>
          </div>
        )}

        {state === "permission-needed" && isMobile && (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <Settings className="w-4 h-4 animate-pulse" />
            <span>Please allow microphone access when prompted</span>
          </div>
        )}
      </div>

      {/* Live Transcript */}
      {(transcript || interimTranscript) && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              What you said:
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-gray-800">
              {transcript}
              {interimTranscript && (
                <span className="text-gray-400 italic">
                  {interimTranscript}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && state === "error" && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NLP Results */}
      {nlpResult && state === "success" && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Voice Command Processed
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 border-green-300"
              >
                {Math.round(nlpResult.confidence * 100)}% confidence
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Interpretation */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Interpreted as:</p>
              <p className="text-gray-800 font-medium">
                {nlpResult.interpretedAs}
              </p>
            </div>

            {/* Detected Filters */}
            {nlpResult.filters.length > 0 ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">Detected filters:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {nlpResult.filters.map((filter, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-purple-100 text-purple-800 border-purple-300"
                    >
                      {filter.filterId}:{" "}
                      {Array.isArray(filter.value)
                        ? filter.value.join(", ")
                        : String(filter.value)}
                    </Badge>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={applyFilters}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    Apply Voice Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={reset}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">
                  No specific filters detected in your voice command.
                </p>
                <Button
                  variant="outline"
                  onClick={reset}
                  className="mt-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {state === "idle" && (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            {isMobile
              ? "Tap the microphone and speak your request:"
              : "Click the microphone and say something like:"}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="text-xs bg-gray-50">
              "Show me cheap Italian restaurants"
            </Badge>
            <Badge variant="outline" className="text-xs bg-gray-50">
              "Find vegetarian places with outdoor seating"
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
