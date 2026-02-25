import React from "react";
import { View, Text, StyleSheet,StatusBar } from "react-native";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";

/**
 * OfflineIndicator - Shows when screen cannot load data due to network issues
 * Use this component in screens that fetch data and show loading states
 * It will display when offline or server is down, replacing loading spinners
 */
const OfflineIndicator = ({ message, style }) => {
  const { isOffline, isServerDown } = useSelector((state) => state.network);

  // Only show if offline or server is down
  if (!isOffline && !isServerDown) {
    return null;
  }

  const displayMessage =
    message || (isOffline ? "No internet connection" : "Server unavailable");

  const subtitle = isOffline
    ? "Please check your connection and try again"
    : "The server is currently down. Please try again later.";

  return (
    <View style={[styles.container, style]}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <View style={styles.iconContainer}>
        <Ionicons
          name={isOffline ? "cloud-offline" : "server-outline"}
          size={64}
          color="#9CA3AF"
        />
      </View>
      <Text style={styles.title}>{displayMessage}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F9FAFB",
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
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

export default OfflineIndicator;
