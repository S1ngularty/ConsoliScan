import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Loader from "../../components/Loader";
import * as Haptics from "expo-haptics";
import { getUser, getEligibilityStatus } from "../../utils/authUtil";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../../features/slices/auth/authThunks";
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
  error: "#ef4444",
  success: "#10b981",
  border: "#E2E8F0",
  inputBg: "#F8FAFC",
};

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { loading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const validateField = (field, value) => {
    if (field === "email") {
      if (!value.trim()) return "Email is required";
      if (!/\S+@\S+\.\S+/.test(value)) return "Invalid email format";
    }
    if (field === "password") {
      if (!value) return "Password is required";
    }
    return "";
  };

  const validateLoginForm = () => {
    const nextErrors = {
      email: validateField("email", email),
      password: validateField("password", password),
    };
    setFieldErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!validateLoginForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      const result = await dispatch(login({ email, password }));
      if (login.fulfilled.match(result)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (login.rejected.match(result)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({
        ...prev,
        email: validateField("email", value),
      }));
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({
        ...prev,
        password: validateField("password", value),
      }));
    }
  };

  function handleGuest() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(guestMode());
  }

  useEffect(() => {
    (async () => {
      try {
        const user = await getUser();
        const eligibilityStatus = await getEligibilityStatus();
        if (user) {
          dispatch(authMode({ user, eligibilityStatus }));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />

      {/* Background Decorative Blobs - Fixed positioning */}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.loginSheetContainer}>
              {/* Sheet Handle - Fixed positioning */}
              <View style={styles.sheetHandle} />

              <View style={styles.loginHeader}>
                <Text style={styles.appName}>ConsoliScan</Text>
                <Text style={styles.loginTitle}>Welcome Back!</Text>
                <Text style={styles.loginSubtitle}>
                  Sign in to continue smart shopping
                </Text>
              </View>

              <View style={styles.form}>
                {/* Error Banner - Fixed layout */}
                {error ? (
                  <View style={styles.formErrorBanner}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={18}
                      color={COLORS.error}
                    />
                    <Text style={styles.formErrorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Email Field */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      fieldErrors.email && styles.inputContainerError,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={20}
                      color={fieldErrors.email ? COLORS.error : COLORS.muted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="john@example.com"
                      placeholderTextColor="#94A3B8"
                      value={email}
                      onChangeText={handleEmailChange}
                      onBlur={() =>
                        setFieldErrors((prev) => ({
                          ...prev,
                          email: validateField("email", email),
                        }))
                      }
                      autoCapitalize="none"
                      keyboardType="email-address"
                      returnKeyType="next"
                    />
                  </View>
                  {fieldErrors.email ? (
                    <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>
                  ) : null}
                </View>

                {/* Password Field */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      fieldErrors.password && styles.inputContainerError,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={20}
                      color={fieldErrors.password ? COLORS.error : COLORS.muted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      value={password}
                      onChangeText={handlePasswordChange}
                      onBlur={() =>
                        setFieldErrors((prev) => ({
                          ...prev,
                          password: validateField("password", password),
                        }))
                      }
                      secureTextEntry={!showPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MaterialCommunityIcons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color={COLORS.muted}
                      />
                    </TouchableOpacity>
                  </View>
                  {fieldErrors.password ? (
                    <Text style={styles.fieldErrorText}>
                      {fieldErrors.password}
                    </Text>
                  ) : null}
                </View>

                {/* Forgot Password - Fixed alignment */}
                <TouchableOpacity 
                  style={styles.forgotPassword}
                  onPress={() => {}}
                  hitSlop={{ top: 10, bottom: 10 }}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                {/* Sign In Button */}
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  onPress={handleLogin}
                  style={styles.signInButtonContainer}
                >
                  <LinearGradient
                    colors={[COLORS.green, "#4a5d20"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.signInButton}
                  >
                    <Text style={styles.signInText}>Sign In</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.line} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.line} />
                </View>

                {/* Guest Button */}
                <TouchableOpacity
                  style={styles.guestButton}
                  onPress={handleGuest}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={24}
                    color={COLORS.green}
                  />
                  <Text style={styles.guestText}>Continue as Guest</Text>
                </TouchableOpacity>
              </View>

              {/* Footer - Fixed positioning */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate("Register")}
                  hitSlop={{ top: 10, bottom: 10 }}
                >
                  <Text style={styles.signupText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  blob1: {
    width: 300,
    height: 300,
    backgroundColor: COLORS.sand,
    top: -100,
    left: -100,
    opacity: 0.4,
  },
  blob2: {
    width: 250,
    height: 250,
    backgroundColor: COLORS.orange,
    top: height * 0.3,
    right: -100,
    opacity: 0.2,
  },
  blob3: {
    width: 350,
    height: 350,
    backgroundColor: COLORS.green,
    bottom: -150,
    left: width * 0.2,
    opacity: 0.15,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    minHeight: height,
  },
  loginSheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20,
    marginTop: "auto",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  loginHeader: {
    marginBottom: 24,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.green,
    marginBottom: 8,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 6,
  },
  loginSubtitle: {
    fontSize: 15,
    color: COLORS.muted,
    lineHeight: 22,
  },
  form: {
    width: "100%",
  },
  formErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  formErrorText: {
    flex: 1,
    color: "#B91C1C",
    fontSize: 13,
    lineHeight: 18,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: COLORS.inputBg,
  },
  inputContainerError: {
    borderColor: COLORS.error,
    backgroundColor: "#FEF2F2",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    padding: 0,
  },
  fieldErrorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
    marginTop: 4,
  },
  forgotText: {
    color: COLORS.green,
    fontWeight: "600",
    fontSize: 14,
  },
  signInButtonContainer: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  signInButton: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  signInText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  orText: {
    marginHorizontal: 16,
    color: COLORS.muted,
    fontWeight: "500",
    fontSize: 13,
  },
  guestButton: {
    flexDirection: "row",
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  guestText: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  signupText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "700",
  },
});

export default LoginScreen;