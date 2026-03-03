import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Platform, Animated } from "react-native";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const OfflineBanner = () => {
  const { isOffline, isServerDown } = useSelector((state) => state.network);
  const isOnline = !isOffline && !isServerDown;

  const [bannerMode, setBannerMode] = useState(isOnline ? null : "offline");
  const opacity = useRef(new Animated.Value(isOnline ? 0 : 1)).current;
  const previousOnlineStatus = useRef(isOnline);
  const onlineTimerRef = useRef(null);

  useEffect(() => {
    if (onlineTimerRef.current) {
      clearTimeout(onlineTimerRef.current);
      onlineTimerRef.current = null;
    }

    if (!isOnline) {
      setBannerMode("offline");
      opacity.stopAnimation();
      opacity.setValue(1);
    } else if (!previousOnlineStatus.current && isOnline) {
      setBannerMode("online");
      opacity.stopAnimation();
      opacity.setValue(1);

      onlineTimerRef.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            setBannerMode(null);
          }
        });
      }, 2000);
    }

    previousOnlineStatus.current = isOnline;

    return () => {
      if (onlineTimerRef.current) {
        clearTimeout(onlineTimerRef.current);
        onlineTimerRef.current = null;
      }
    };
  }, [isOnline, opacity]);

  if (!bannerMode) return null;

  const isBannerOnline = bannerMode === "online";
  const iconName = isBannerOnline ? "cloud-check-outline" : "cloud-off-outline";
  const message = isBannerOnline ? "Online Mode" : "Offline Mode";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]} pointerEvents="none">
      <Animated.View
        style={[
          styles.banner,
          isBannerOnline ? styles.onlineBanner : null,
          { opacity },
        ]}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={16}
          color="#E5E7EB"
          style={styles.icon}
        />
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 999,
  },
  banner: {
    backgroundColor: "rgba(75, 85, 99, 0.85)",
    paddingVertical: Platform.OS === "ios" ? 6 : 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineBanner: {
    backgroundColor: "rgba(22, 163, 74, 0.8)",
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default OfflineBanner;
