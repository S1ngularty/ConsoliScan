import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Dimensions,
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
    dispatch(guestMode());
  }

  React.useEffect(() => {
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
          <View style={styles.loginSheetContainer}>
            <View style={styles.loginHeader}>
              <Text style={styles.appName}>ConsoliScan</Text>
              <Text style={styles.loginTitle}>Welcome Back!</Text>
              <Text style={styles.loginSubtitle}>
                Sign in to continue smart shopping
              </Text>
            </View>

            <View style={styles.form}>
              {error ? (
                <View style={styles.formErrorBanner}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={16}
                    color="#ef4444"
                  />
                  <Text style={styles.formErrorText}>{error}</Text>
                </View>
              ) : null}

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
                    color={fieldErrors.email ? "#ef4444" : COLORS.muted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="john@example.com"
                    placeholderTextColor={COLORS.muted}
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
                  />
                </View>
                {fieldErrors.email ? (
                  <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>
                ) : null}
              </View>

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
                    color={fieldErrors.password ? "#ef4444" : COLORS.muted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.muted}
                    value={password}
                    onChangeText={handlePasswordChange}
                    onBlur={() =>
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: validateField("password", password),
                      }))
                    }
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
                {fieldErrors.password ? (
                  <Text style={styles.fieldErrorText}>
                    {fieldErrors.password}
                  </Text>
                ) : null}
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
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.signupText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  formErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  formErrorText: {
    flex: 1,
    color: "#b91c1c",
    fontSize: 13,
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
  inputContainerError: {
    borderColor: "#ef4444",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  fieldErrorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 6,
    marginLeft: 4,
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
