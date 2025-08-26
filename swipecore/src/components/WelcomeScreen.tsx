import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>What are you looking for today?</Text>

          <Text style={styles.subtitle}>
            Tell us what you're in the mood for and we'll find the perfect
            places for you.
          </Text>

          {showVoicePrompt ? (
            <VoicePrompt
              onFiltersApplied={onVoiceFiltersApplied}
              onCancel={() => setShowVoicePrompt(false)}
            />
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setShowVoicePrompt(true)}
              >
                <Ionicons
                  name="mic"
                  size={24}
                  color="white"
                  style={styles.buttonIcon}
                />
                <Text style={styles.primaryButtonText}>
                  Speak Your Preferences
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#6B7280"
                  style={styles.buttonIcon}
                />
                <Text style={styles.secondaryButtonText}>
                  Browse All Nearby Places
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  textContainer: {
    alignItems: "center",
    maxWidth: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  secondaryButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
});
