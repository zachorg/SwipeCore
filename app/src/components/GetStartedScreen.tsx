import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface GetStartedScreenProps {
  onComplete: () => void;
}

export function GetStartedScreen({ onComplete }: GetStartedScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          {/* App Logo/Icon */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🍕</Text>
          </View>

          {/* App Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>NomNom</Text>
            <Text style={styles.subtitle}>
              Discover amazing restaurants with a swipe
            </Text>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Get personalized restaurant recommendations based on your
              preferences and location. Start your culinary journey today!
            </Text>

            <View style={styles.phoneInfo}>
              <Ionicons name="phone-portrait" size={16} color="#6B7280" />
              <Text style={styles.phoneInfoText}>
                Quick phone verification to get started
              </Text>
            </View>
          </View>

          {/* Get Started Button */}
          <TouchableOpacity style={styles.button} onPress={onComplete}>
            <Text style={styles.buttonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
          </TouchableOpacity>

          {/* Privacy Note */}
          <Text style={styles.privacyText}>
            Your data is secure and we'll never share your personal information
          </Text>
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
  logoContainer: {
    width: 96,
    height: 96,
    backgroundColor: "#8B5CF6",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    color: "white",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#7C3AED",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#6B7280",
  },
  descriptionContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
  },
  phoneInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  phoneInfoText: {
    fontSize: 14,
    color: "#6B7280",
  },
  button: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 24,
    paddingHorizontal: 48,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  privacyText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 24,
    textAlign: "center",
  },
});
