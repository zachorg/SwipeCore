import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface VoicePromptProps {
  onFiltersApplied: (filters: Array<{ filterId: string; value: any }>) => void;
  onCancel: () => void;
}

export function VoicePrompt({ onFiltersApplied, onCancel }: VoicePromptProps) {
  // This is a placeholder component
  // In a real app, you would implement voice recognition here

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Voice recognition coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
});
