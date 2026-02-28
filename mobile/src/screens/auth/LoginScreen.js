import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Animated,
  FlatList,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Loader from "../../components/Loader";
import * as Haptics from "expo-haptics";
import { getToken, getUser, getEligibilityStatus } from "../../utils/authUtil";
import { useDispatch, useSelector } from "react-redux";
import { login, verifyToken } from "../../features/slices/auth/authThunks";
import { guestMode, authMode } from "../../features/slices/auth/authSlice";
import { LinearGradient } from "expo-linear-gradient";

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

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { loading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Onboarding State
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLogin, setShowLogin] = useState(false);

  // Animations
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(height)).current;

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const result = await dispatch(login({ email, password }));
      if (login.fulfilled.match(result)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  function handleGuest() {
    dispatch(guestMode());
  }

  const handleGetStarted = () => {
    setShowLogin(true);
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(formTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBackToOnboarding = () => {
    Animated.timing(formTranslateY, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowLogin(false);
      formOpacity.setValue(0);
    });
  };

  React.useEffect(() => {
    (async () => {
      try {
        const user = await getUser();
        const eligibilityStatus = await getEligibilityStatus();
        if (user) {
          dispatch(authMode({ user, eligibilityStatus }));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return;
        } else {
          // const token = await getToken();
          // if (!token) return;
          // const result = await dispatch(verifyToken(token));
          // if (verifyToken.fulfilled.match(result))
          //   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />

      {/* Background Decorative Blobs */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
        <View style={[styles.blob, styles.blob3]} />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <Loader />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
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
                  style={styles.getStartedButton}
                  onPress={handleGetStarted}
                >
                  <LinearGradient
                    colors={[COLORS.green, "#4a5d20"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.getStartedText}>Get Started</Text>
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

          {/* Login Sheet Overlay */}
          {showLogin && (
            <Animated.View
              style={[
                styles.loginSheetContainer,
                {
                  opacity: formOpacity,
                  transform: [{ translateY: formTranslateY }],
                },
              ]}
            >
              <View style={styles.sheetHandle} />

              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackToOnboarding}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color={COLORS.text}
                />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
              >
                <View style={styles.loginHeader}>
                  <Text style={styles.loginTitle}>Welcome Back!</Text>
                  <Text style={styles.loginSubtitle}>
                    Sign in to continue smart shopping
                  </Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <View style={styles.inputContainer}>
                      <MaterialCommunityIcons
                        name="email-outline"
                        size={20}
                        color={COLORS.muted}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="john@example.com"
                        placeholderTextColor={COLORS.muted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputContainer}>
                      <MaterialCommunityIcons
                        name="lock-outline"
                        size={20}
                        color={COLORS.muted}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor={COLORS.muted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <MaterialCommunityIcons
                          name={showPassword ? "eye-off" : "eye"}
                          size={20}
                          color={COLORS.muted}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.forgotPassword}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.8} onPress={handleLogin}>
                    <LinearGradient
                      colors={[COLORS.green, "#4a5d20"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.signInButton}
                    >
                      <Text style={styles.signInText}>Sign In</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={styles.line} />
                    <Text style={styles.orText}>OR</Text>
                    <View style={styles.line} />
                  </View>

                  <TouchableOpacity
                    style={styles.guestButton}
                    onPress={handleGuest}
                  >
                    <MaterialCommunityIcons
                      name="account-outline"
                      size={24}
                      color={COLORS.green}
                    />
                    <Text style={styles.guestText}>Continue as Guest</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Register")}
                  >
                    <Text style={styles.signupText}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </Animated.View>
          )}
        </View>
      )}
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Onboarding Styles
  onboardingContainer: {
    flex: 1,
  },
  onboardingHeader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.green,
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  iconContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  onboardingTitle: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  onboardingDesc: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    height: 20,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  getStartedButton: {
    borderRadius: 30,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientButton: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: "center",
  },
  getStartedText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  nextText: {
    color: COLORS.green,
    fontSize: 18,
    fontWeight: "600",
  },

  // Login Sheet Styles
  loginSheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.88,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 25,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  backText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  loginHeader: {
    marginBottom: 32,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: COLORS.muted,
  },
  form: {
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#F8FAFC",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    color: COLORS.green,
    fontWeight: "600",
  },
  signInButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signInText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  orText: {
    marginHorizontal: 16,
    color: COLORS.muted,
    fontWeight: "500",
  },
  guestButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  guestText: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
    paddingBottom: 20,
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 15,
  },
  signupText: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default LoginScreen;
