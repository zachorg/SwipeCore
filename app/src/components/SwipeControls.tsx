import { memo, useCallback } from "react";
import { VoiceButton } from "./VoiceButton";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SwipeControlsProps {
  onAction: (action: "pass") => void;
  onMenuOpen?: () => void;
  onUndo?: () => void;
  onVoiceFiltersApplied?: (
    filters: Array<{ filterId: string; value: any }>
  ) => void;
  swipeDirection?: "menu" | "pass" | null;
}

const PassButton = memo(
  ({
    onAction,
  }: {
    swipeDirection?: "menu" | "pass" | null;
    onAction: (action: "pass") => void;
  }) => {
    return (
      <TouchableOpacity
        style={[styles.passButton, styles.passButtonDefault]}
        onPress={() => onAction("pass")}
      >
        <Ionicons name="close" size={20} color="#FFFFFF" />
        <Text style={styles.passButtonText}>Pass</Text>
      </TouchableOpacity>
    );
  }
);

// Dynamic button for low-end devices (with swipe direction feedback)
const MenuButton = memo(
  ({
    onMenuOpen,
  }: {
    swipeDirection?: "menu" | "pass" | null;
    onMenuOpen?: () => void;
  }) => {
    return (
      <TouchableOpacity
        style={[styles.menuButton, styles.menuButtonDefault]}
        onPress={onMenuOpen}
      >
        <Ionicons name="menu" size={20} color="#FFFFFF" />
        <Text style={styles.menuButtonText}>Menu</Text>
      </TouchableOpacity>
    );
  }
);

const SwipeControls = memo(function SwipeControls({
  onAction,
  onMenuOpen,
  onUndo,
  onVoiceFiltersApplied,
  swipeDirection,
}: SwipeControlsProps) {
  const handleFiltersApplied = useCallback(
    (filters: Array<{ filterId: string; value: any }>) => {
      console.log(
        "🎛️ SwipeControls - Received filters from VoiceButton:",
        filters
      );
      onVoiceFiltersApplied?.(filters);
      console.log("🎛️ SwipeControls - Passed filters to SwipeDeck");
    },
    [onVoiceFiltersApplied]
  );

  return (
    <View style={styles.buttonContainer}>
      {/* Pass Button */}
      <PassButton onAction={onAction} />

      {/* Voice Button */}
      {onVoiceFiltersApplied && (
        <VoiceButton
          onFiltersApplied={handleFiltersApplied}
          swipeDirection={swipeDirection}
        />
      )}

      {/* Open Menu Button */}
      <MenuButton onMenuOpen={onMenuOpen} />
    </View>
  );
});

export { SwipeControls };

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingVertical: 16,
    paddingBottom: 36,
  },
  buttonGap: {
    width: 12,
  },
  undoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonActive: {
    opacity: 1,
    transform: [{ scale: 1.01 }],
    borderColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
    transform: [{ scale: 1 }],
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  passButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  passButtonActive: {
    transform: [{ scale: 1.01 }],
    shadowColor: "#FCA5A5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  passButtonInactive: {
    transform: [{ scale: 0.9 }],
    opacity: 0.6,
  },
  passButtonDefault: {
    transform: [{ scale: 1 }],
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  passButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  menuButtonActive: {
    transform: [{ scale: 1.01 }],
    shadowColor: "#93C5FD",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  menuButtonInactive: {
    transform: [{ scale: 0.9 }],
    opacity: 0.6,
  },
  menuButtonDefault: {
    transform: [{ scale: 1 }],
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
