import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";

const OfflineBanner = () => {
  const { isOffline, isServerDown } = useSelector((state) => state.network);

  if (!isOffline && !isServerDown) return null;

  const message = isOffline
    ? "Offline mode: No internet connection"
    : "Server unavailable: Working offline";

  return (
    <SafeAreaView style={styles.safeArea} pointerEvents="none">
      <View style={styles.banner}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  banner: {
    backgroundColor: "#B45309",
    paddingVertical: Platform.OS === "ios" ? 8 : 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  text: {
    color: "#FFF7ED",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default OfflineBanner;
