import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface FilterTestProps {
  onTestFilter: (filterId: string, value: any) => void;
}

export function FilterTest({ onTestFilter }: FilterTestProps) {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  const testCuisineFilter = () => {
    addTestResult("Testing cuisine filter: italian");
    onTestFilter("cuisine", ["italian"]);
  };

  const testPriceFilter = () => {
    addTestResult("Testing price filter: 2 (moderate)");
    onTestFilter("priceLevel", 2);
  };

  const testRatingFilter = () => {
    addTestResult("Testing rating filter: 4.0+");
    onTestFilter("minRating", 4.0);
  };

  const testOpenNowFilter = () => {
    addTestResult("Testing open now filter: true");
    onTestFilter("openNow", true);
  };

  const testMultipleFilters = () => {
    addTestResult("Testing multiple filters: italian + moderate + 4.0+");
    onTestFilter("cuisine", ["italian"]);
    onTestFilter("priceLevel", 2);
    onTestFilter("minRating", 4.0);
  };

  const testVoiceFilter = () => {
    addTestResult("Testing voice filter simulation: american restaurants");
    // Simulate voice filter for American cuisine
    onTestFilter("cuisine", ["american"]);
  };

  const testVoiceFilterFlow = () => {
    addTestResult("Testing complete voice filter flow: italian + 4.0+ rating");
    // Simulate the exact flow that VoiceButton would use
    console.log("🧪 Testing complete voice filter flow");

    // First clear filters (like the new implementation does)
    onTestFilter("clear", null);

    // Then add filters after a delay
    setTimeout(() => {
      onTestFilter("cuisine", ["italian"]);
      onTestFilter("minRating", 4.0);
    }, 100);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filter Test Panel</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testCuisineFilter}>
          <Text style={styles.buttonText}>Test Cuisine</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testPriceFilter}>
          <Text style={styles.buttonText}>Test Price</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testRatingFilter}>
          <Text style={styles.buttonText}>Test Rating</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testOpenNowFilter}>
          <Text style={styles.buttonText}>Test Open Now</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testMultipleFilters}>
          <Text style={styles.buttonText}>Test Multiple</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testVoiceFilter}>
          <Text style={styles.buttonText}>Test Voice</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testVoiceFilterFlow}>
          <Text style={styles.buttonText}>Test Flow</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
  },
  buttonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  resultsContainer: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  resultText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
});
