import { useState } from "react";
import { Button } from "./ui/button";
import { Mic, Search } from "lucide-react";
import { VoicePrompt } from "./VoicePrompt";

interface WelcomeScreenProps {
  onVoiceFiltersApplied: (
    filters: Array<{ filterId: string; value: any }>
  ) => void;
  onSkip: () => void;
}

export function WelcomeScreen({
  onVoiceFiltersApplied,
  onSkip,
}: WelcomeScreenProps) {
  const [showVoicePrompt, setShowVoicePrompt] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-b from-purple-50 to-blue-50">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-3xl font-bold text-gray-800">
          What are you looking for today?
        </h1>

        <p className="text-gray-600">
          Tell us what you're in the mood for and we'll find the perfect places
          for you.
        </p>

        {showVoicePrompt ? (
          <VoicePrompt
            onFiltersApplied={onVoiceFiltersApplied}
            onCancel={() => setShowVoicePrompt(false)}
          />
        ) : (
          <div className="flex flex-col space-y-4">
            <Button
              onClick={() => setShowVoicePrompt(true)}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <Mic className="w-6 h-6 mr-2" />
              Speak Your Preferences
            </Button>

            <Button
              variant="outline"
              onClick={onSkip}
              className="text-gray-600"
            >
              <Search className="w-4 h-4 mr-2" />
              Browse All Nearby Places
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
