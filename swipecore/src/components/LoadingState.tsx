import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface LoadingStateProps {
  message?: string;
  showIcon?: boolean;
}

export function LoadingState({
  message = "Loading...",
  showIcon = true,
}: LoadingStateProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconContainer}>
            <Ionicons name="restaurant" size={48} color="#8B5CF6" />
          </View>
        )}

        <ActivityIndicator
          size="large"
          color="#8B5CF6"
          style={styles.spinner}
        />

        <Text style={styles.message}>{message}</Text>

        <Text style={styles.subtitle}>
          Please wait while we prepare your experience
        </Text>
      </View>
    </SafeAreaView>
  );
}

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
  iconContainer: {
    marginBottom: 24,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
