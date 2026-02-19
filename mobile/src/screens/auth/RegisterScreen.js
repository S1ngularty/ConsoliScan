import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { API_URL } from "../../constants/config";
import { useDispatch, useSelector } from "react-redux";
import { register } from "../../features/slices/auth/authThunks";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withDelay, 
  withSpring, 
  withTiming,
  FadeInDown
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const COLORS = {
  green: "#5C6F2B",
  orange: "#DE802B",
  sand: "#D8C9A7",
  light: "#EEEEEE",
  text: "#0f172a",
  muted: "#334155",
};

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    sex: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { loading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Animation values
  const sheetY = useSharedValue(height);

  useEffect(() => {
    sheetY.value = withSpring(0, { damping: 15, stiffness: 90 });
  }, []);

  const animatedSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: sheetY.value }],
    };
  });

  const validateForm = () => {
    // ... existing validation logic ...
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (!formData.age) newErrors.age = "Age is required";
    else if (isNaN(formData.age) || formData.age < 1 || formData.age > 120)
      newErrors.age = "Enter valid age (1-120)";

    if (!formData.sex) newErrors.sex = "Please select gender";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    // ... existing register logic ...
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      age: parseInt(formData.age),
      sex: formData.sex,
      role: "user",
      status: "active",
    };

    try {
      const isSuccess = await dispatch(register(userData));
      if (register.fulfilled.match(isSuccess)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (register.rejected.match(isSuccess)) {
        throw new Error(
          "failed to create your account please try again later.",
        );
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.log(error);
      Alert.alert("Error", "Registration failed. Please try again.");
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const AnimatedInput = ({ index, children }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      {children}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />
      
      {/* Background Decorative Blobs */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.content, animatedSheetStyle]}>
            <View style={styles.sheetHandle} />
            
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <MaterialCommunityIcons
                  name="arrow-down"
                  size={24}
                  color={COLORS.text}
                />
              </TouchableOpacity>

              <View style={styles.logoContainer}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join ConsoliScan in seconds</Text>
              </View>
            </View>

            {/* Registration Form */}
            <View style={styles.form}>
              {/* Name */}
              <AnimatedInput index={1}>
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.name && styles.inputContainerError,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account-outline"
                      size={20}
                      color={errors.name ? "#ef4444" : COLORS.muted}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor={COLORS.muted}
                      value={formData.name}
                      onChangeText={(value) => updateFormData("name", value)}
                      autoCapitalize="words"
                    />
                  </View>
                  {errors.name ? (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  ) : null}
                </View>
              </AnimatedInput>

              {/* Email */}
              <AnimatedInput index={2}>
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.email && styles.inputContainerError,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={20}
                      color={errors.email ? "#ef4444" : COLORS.muted}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address"
                      placeholderTextColor={COLORS.muted}
                      value={formData.email}
                      onChangeText={(value) => updateFormData("email", value)}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  </View>
                  {errors.email ? (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  ) : null}
                </View>
              </AnimatedInput>

              {/* Age */}
              <AnimatedInput index={3}>
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.age && styles.inputContainerError,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="cake-variant-outline"
                      size={20}
                      color={errors.age ? "#ef4444" : COLORS.muted}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Age"
                      placeholderTextColor={COLORS.muted}
                      value={formData.age}
                      onChangeText={(value) => updateFormData("age", value)}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                  </View>
                  {errors.age ? (
                    <Text style={styles.errorText}>{errors.age}</Text>
                  ) : null}
                </View>
              </AnimatedInput>

              {/* Gender Selection */}
              <AnimatedInput index={4}>
                <View style={styles.inputGroup}>
                  {errors.sex ? (
                    <Text style={styles.errorText}>{errors.sex}</Text>
                  ) : null}
                  <View style={styles.genderContainer}>
                    <TouchableOpacity
                      style={[
                        styles.genderOption,
                        formData.sex === "male" && styles.genderOptionSelected,
                      ]}
                      onPress={() => updateFormData("sex", "male")}
                    >
                      <MaterialCommunityIcons
                        name="gender-male"
                        size={24}
                        color={formData.sex === "male" ? COLORS.green : COLORS.muted}
                      />
                      <Text
                        style={[
                          styles.genderText,
                          formData.sex === "male" && styles.genderTextSelected,
                        ]}
                      >
                        Male
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.genderOption,
                        formData.sex === "female" && styles.genderOptionSelected,
                      ]}
                      onPress={() => updateFormData("sex", "female")}
                    >
                      <MaterialCommunityIcons
                        name="gender-female"
                        size={24}
                        color={formData.sex === "female" ? COLORS.green : COLORS.muted}
                      />
                      <Text
                        style={[
                          styles.genderText,
                          formData.sex === "female" && styles.genderTextSelected,
                        ]}
                      >
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </AnimatedInput>

              {/* Password */}
              <AnimatedInput index={5}>
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.password && styles.inputContainerError,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={20}
                      color={errors.password ? "#ef4444" : COLORS.muted}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor={COLORS.muted}
                      value={formData.password}
                      onChangeText={(value) => updateFormData("password", value)}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                    />
                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <MaterialCommunityIcons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color={COLORS.muted}
                      />
                    </Pressable>
                  </View>
                  {errors.password ? (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  ) : null}
                </View>
              </AnimatedInput>

              {/* Confirm Password */}
              <AnimatedInput index={6}>
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.confirmPassword && styles.inputContainerError,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="lock-check-outline"
                      size={20}
                      color={errors.confirmPassword ? "#ef4444" : COLORS.muted}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor={COLORS.muted}
                      value={formData.confirmPassword}
                      onChangeText={(value) =>
                        updateFormData("confirmPassword", value)
                      }
                      secureTextEntry={!showConfirmPassword}
                      autoComplete="new-password"
                    />
                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <MaterialCommunityIcons
                        name={showConfirmPassword ? "eye-off" : "eye"}
                        size={20}
                        color={COLORS.muted}
                      />
                    </Pressable>
                  </View>
                  {errors.confirmPassword ? (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  ) : null}
                </View>
              </AnimatedInput>

              {/* Terms */}
              <AnimatedInput index={7}>
                <View style={styles.termsContainer}>
                  <Text style={styles.termsText}>
                    By creating an account, you agree to our{" "}
                    <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </View>
              </AnimatedInput>

              {/* Register Button */}
              <AnimatedInput index={8}>
                <TouchableOpacity activeOpacity={0.8} onPress={handleRegister} disabled={loading}>
                  <LinearGradient
                    colors={[COLORS.green, '#4a5d20']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                  >
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <MaterialCommunityIcons
                          name="loading"
                          size={20}
                          color="#ffffff"
                        />
                        <Text style={styles.registerText}>Creating account...</Text>
                      </View>
                    ) : (
                      <Text style={styles.registerText}>Create Account</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </AnimatedInput>

              {/* Login Link */}
              <AnimatedInput index={9}>
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Already have an account? </Text>
                  <Pressable onPress={() => navigation.navigate("Login")}>
                    <Text style={styles.loginLink}>Sign in</Text>
                  </Pressable>
                </View>
              </AnimatedInput>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 0, // Removed padding top to let the card sit properly
    backgroundColor: "transparent", // Ensure background shows through
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 20,
    minHeight: Dimensions.get("window").height * 0.9, // Ensure it covers most of the screen
    marginTop: 40, // Push it down slightly from the very top
  },
  header: {
    marginBottom: 32,
    marginTop: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: "flex-start",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
  },
  inputContainerError: {
    borderColor: "#ef4444",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
    marginLeft: 4,
  },
  eyeButton: {
    padding: 4,
  },
  genderContainer: {
    flexDirection: "row",
    height: 56,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },
  genderOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  genderOptionSelected: {
    backgroundColor: COLORS.green + "15", // 15% opacity
    borderColor: COLORS.green,
  },
  genderText: {
    fontSize: 16,
    color: COLORS.muted,
    fontWeight: "500",
  },
  genderTextSelected: {
    color: COLORS.green,
    fontWeight: "600",
  },
  termsContainer: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
  },
  termsText: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
    textAlign: "center",
  },
  termsLink: {
    color: COLORS.green,
    fontWeight: "600",
  },
  registerButton: {
    height: 56,
    backgroundColor: COLORS.green,
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
  registerButtonDisabled: {
    backgroundColor: "#a7f3d0",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  registerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  loginText: {
    fontSize: 15,
    color: COLORS.muted,
  },
  loginLink: {
    fontSize: 15,
    color: COLORS.green,
    fontWeight: "bold",
  },
});

export default RegisterScreen;
