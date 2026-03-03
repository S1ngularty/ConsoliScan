import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  FlatList,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch } from "react-redux";
import { completeOnboarding } from "../../features/slices/auth/authSlice";

const { width, height } = Dimensions.get("window");

const COLORS = {
  green: "#5C6F2B",
  orange: "#DE802B",
  sand: "#D8C9A7",
  light: "#EEEEEE",
  text: "#0f172a",
  muted: "#334155",
};

const ONBOARDING_DATA = [
  {
    id: "1",
    title: "Scan",
    description: "Effortlessly scan product barcodes with your camera.",
    icon: "barcode-scan",
    color: COLORS.green,
  },
  {
    id: "2",
    title: "Confirm",
    description: "Verify product details and prices instantly.",
    icon: "check-decagram",
    color: COLORS.orange,
  },
  {
    id: "3",
    title: "Go",
    description: "Checkout seamlessly and save time.",
    icon: "cart-arrow-right",
    color: COLORS.sand,
  },
];

const OnboardingScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const renderOnboardingItem = ({ item }) => {
    return (
      <View style={{ width, alignItems: "center", padding: 20 }}>
        <View
          style={[styles.iconContainer, { backgroundColor: item.color + "20" }]}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={100}
            color={item.color}
          />
        </View>
        <Text style={[styles.onboardingTitle, { color: COLORS.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.onboardingDesc, { color: COLORS.muted }]}>
          {item.description}
        </Text>
      </View>
    );
  };

  const renderDotIndicator = () => {
    return (
      <View style={styles.dotContainer}>
        {ONBOARDING_DATA.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 20, 10],
            extrapolate: "clamp",
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });
          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { width: dotWidth, opacity, backgroundColor: COLORS.green },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const handleFinish = () => {
    dispatch(completeOnboarding());
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />

      {/* Background Decorative Blobs */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
        <View style={[styles.blob, styles.blob3]} />
      </View>

      <View style={styles.onboardingContainer}>
        <View style={styles.onboardingHeader}>
          <Text style={styles.appName}>ConsoliScan</Text>
        </View>

        <View style={{ flex: 3 }}>
          <Animated.FlatList
            ref={flatListRef}
            data={ONBOARDING_DATA}
            renderItem={renderOnboardingItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false },
            )}
            onMomentumScrollEnd={(event) => {
              setCurrentIndex(
                Math.round(event.nativeEvent.contentOffset.x / width),
              );
            }}
          />
        </View>

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 40,
          }}
        >
          {renderDotIndicator()}

          {currentIndex === ONBOARDING_DATA.length - 1 ? (
            <TouchableOpacity
              style={styles.finishButton}
              onPress={handleFinish}
            >
              <LinearGradient
                colors={[COLORS.green, "#4a5d20"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.finishText}>Get Started</Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={24}
                  color="#fff"
                />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={() =>
                flatListRef.current?.scrollToIndex({
                  index: currentIndex + 1,
                })
              }
            >
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.4,
  },
  blob1: {
    width: 300,
    height: 300,
    backgroundColor: "#D8C9A7",
    top: -100,
    left: -100,
  },
  blob2: {
    width: 250,
    height: 250,
    backgroundColor: "#DE802B",
    top: height * 0.3,
    right: -100,
    opacity: 0.2,
  },
  blob3: {
    width: 350,
    height: 350,
    backgroundColor: "#5C6F2B",
    bottom: -150,
    left: width * 0.2,
    opacity: 0.15,
  },
  onboardingContainer: {
    flex: 1,
  },
  onboardingHeader: {
    alignItems: "center",
    paddingVertical: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.green,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  onboardingDesc: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  dotContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  finishButton: {
    width: "100%",
    paddingHorizontal: 20,
  },
  nextButton: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.green,
    borderRadius: 12,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  finishText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  nextText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.green,
  },
});

export default OnboardingScreen;
