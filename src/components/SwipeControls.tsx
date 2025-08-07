import { Menu, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { memo, useMemo } from "react";
import { getDeviceInfo } from "@/utils/deviceOptimization";
import { VoiceButton } from "./VoiceButton";

interface SwipeControlsProps {
  onAction: (action: "pass") => void;
  onMenuOpen?: () => void;
  onUndo?: () => void;
  onVoiceFiltersApplied?: (filters: Array<{ filterId: string; value: any }>) => void;
  swipeDirection?: "menu" | "pass" | null;
}

const UndoButton = memo(
  ({
    swipeDirection,
    onUndo,
  }: {
    swipeDirection?: "menu" | "pass" | null;
    onUndo?: () => void;
  }) => {
    return (
      <Button
        variant="outline"
        size="sm"
        className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium shadow-md transition-all duration-300 ${
          swipeDirection
            ? "opacity-50"
            : "hover:scale-105 hover:shadow-lg hover:border-gray-400"
        }`}
        onClick={onUndo}
      >
        <RotateCcw className="w-4 h-4" />
        Undo
      </Button>
    );
  }
);

const PassButton = memo(
  ({
    swipeDirection,
    onAction,
  }: {
    swipeDirection?: "menu" | "pass" | null;
    onAction: (action: "pass") => void;
  }) => {
    return (
      <Button
        variant="destructive"
        size="lg"
        className={`flex items-center gap-3 px-10 py-4 rounded-2xl bg-red-500 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold shadow-lg transition-all duration-200 ${
          swipeDirection === "pass"
            ? "transform scale-125 shadow-2xl shadow-red-500/40 ring-4 ring-red-300/50 from-red-600 to-pink-600"
            : swipeDirection === "menu"
            ? "transform scale-90 opacity-60"
            : "hover:transform hover:scale-110 hover:shadow-xl"
        }`}
        style={{ willChange: swipeDirection ? "transform" : "auto" }}
        onClick={() => onAction("pass")}
      >
        <X
          className={`transition-all duration-200 ${
            swipeDirection === "pass" ? "w-6 h-6" : "w-5 h-5"
          }`}
        />
        Pass
      </Button>
    );
  }
);

// Dynamic button for low-end devices (with swipe direction feedback)
const MenuButton = memo(
  ({
    swipeDirection,
    onMenuOpen,
  }: {
    swipeDirection?: "menu" | "pass" | null;
    onMenuOpen?: () => void;
  }) => {
    return (
      <Button
        variant="default"
        size="lg"
        className={`flex items-center gap-3 px-10 py-4 rounded-2xl bg-blue-500 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg transition-all duration-200 ${
          swipeDirection === "menu"
            ? "transform scale-125 shadow-2xl shadow-blue-500/40 ring-4 ring-blue-300/50 from-blue-600 to-purple-600"
            : swipeDirection === "pass"
            ? "transform scale-90 opacity-60"
            : "hover:transform hover:scale-110 hover:shadow-xl"
        }`}
        style={{ willChange: swipeDirection ? "transform" : "auto" }}
        onClick={onMenuOpen}
      >
        <Menu
          className={`transition-all duration-200 ${
            swipeDirection === "menu" ? "w-6 h-6" : "w-5 h-5"
          }`}
        />
        Menu
      </Button>
    );
  }
);

function SwipeControls({
  onAction,
  onMenuOpen,
  onUndo,
  onVoiceFiltersApplied,
  swipeDirection,
}: SwipeControlsProps) {
  return (
    <div
      className="w-full px-4 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-border/30 shadow-lg
                    md:px-8 md:py-6"
    >
      <div className="flex items-center justify-center gap-8 md:max-w-md md:mx-auto">
        {/* Undo Button */}
        {onUndo && (
          <UndoButton swipeDirection={swipeDirection} onUndo={onUndo} />
        )}

        {/* Pass Button */}
        <PassButton
          swipeDirection={swipeDirection}
          onAction={onAction}
        />

        {/* Voice Button */}
        {onVoiceFiltersApplied && (
          <VoiceButton
            onFiltersApplied={onVoiceFiltersApplied}
            swipeDirection={swipeDirection}
          />
        )}

        {/* Open Menu Button */}
        <MenuButton swipeDirection={swipeDirection} onMenuOpen={onMenuOpen} />
      </div>
    </div>
  );
}

export { SwipeControls };
