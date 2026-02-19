import React, { useEffect } from "react";
import { View, StyleSheet, Image, Text } from "react-native";
import * as SplashScreen from "expo-splash-screen";

// Keep native splash visible while we load
SplashScreen.preventAutoHideAsync();

export default function SplashScreenComponent({ onReady }) {
  useEffect(() => {
    const prepare = async () => {
      try {
        // Show splash for 1.5 seconds then hide
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (e) {
        console.warn(e);
      } finally {
        await SplashScreen.hideAsync();
        if (onReady) onReady();
      }
    };

    prepare();
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoWrapper}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/splash-icon-consoliscan.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* App Name */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          <Text style={styles.titleLight}>Consoli</Text>
          <Text style={styles.titleBold}>Scan</Text>
        </Text>

        {/* White accent line */}
        <View style={styles.accentLine} />

        {/* Tagline - white text */}
        <Text style={styles.tagline}>INDUSTRIAL FINTECH</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#00A86B", // EMERALD GREEN BACKGROUND
    justifyContent: "center",
    alignItems: "center",
  },
  logoWrapper: {
    marginBottom: 50,
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingLeft: 4,
    justifyContent: "center",
    alignItems: "center",
    // Shadow for depth
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  logoImage: {
    width: 1000,
    height: 150,
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 42,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  titleLight: {
    color: "#FFFFFF", // White text on green
    fontWeight: "300",
  },
  titleBold: {
    color: "#FFFFFF", // White text on green
    fontWeight: "700",
  },
  accentLine: {
    width: 40,
    height: 2,
    backgroundColor: "#FFFFFF", // White line
    marginBottom: 16,
    opacity: 0.8,
  },
  tagline: {
    fontSize: 11,
    color: "#FFFFFF", // White text
    letterSpacing: 3,
    fontWeight: "500",
    opacity: 0.8,
  },
});
