import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { openUrl } from '@/utils/browser';

export const InAppBrowserTest = () => {
  const testUrls = [
    { name: 'Google Maps', url: 'https://maps.google.com' },
    { name: 'Restaurant Website', url: 'https://www.yelp.com' },
    { name: 'AdChoices', url: 'https://www.aboutads.info/choices/' },
    { name: 'Phone Number', url: 'tel:+1234567890' },
  ];

  const handleOpenUrl = async (url: string) => {
    try {
      await openUrl(url);
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>InAppBrowser Test</Text>
      <Text style={styles.subtitle}>Tap to test different URL types</Text>
      
      {testUrls.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.button}
          onPress={() => handleOpenUrl(item.url)}
        >
          <Text style={styles.buttonText}>{item.name}</Text>
          <Text style={styles.urlText}>{item.url}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  urlText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
});
