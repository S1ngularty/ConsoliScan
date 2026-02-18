import React, { useState } from "react";
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

const { width } = Dimensions.get("window");

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

  const validateForm = () => {
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Prepare registration data
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
      // Simulate API call
      const isSuccess = await dispatch(register(userData));
      if (register.fulfilled.match(isSuccess)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // navigation.navigate("Customer", {
        //   screen: "HomeTabs",
        //   params: {
        //     screen: "Home",
        //   },
        // });
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Background */}
      <View style={styles.background}>
        <View style={[styles.bgShape, styles.bgShape1]} />
        <View style={[styles.bgShape, styles.bgShape2]} />
        <View style={[styles.bgShape, styles.bgShape3]} />
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
          <Pressable style={styles.content} onPress={() => setErrors({})}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color="#00A86B"
                />
              </TouchableOpacity>

              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <MaterialCommunityIcons
                    name="account-plus"
                    size={32}
                    color="#00A86B"
                  />
                </View>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join ConsoliScan in seconds</Text>
              </View>
            </View>

            {/* Registration Form */}
            <View style={styles.form}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.name && styles.inputContainerError,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={20}
                    color={errors.name ? "#ef4444" : "#94a3b8"}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor="#94a3b8"
                    value={formData.name}
                    onChangeText={(value) => updateFormData("name", value)}
                    autoCapitalize="words"
                  />
                </View>
                {errors.name ? (
                  <Text style={styles.errorText}>{errors.name}</Text>
                ) : null}
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.email && styles.inputContainerError,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={20}
                    color={errors.email ? "#ef4444" : "#94a3b8"}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="john@example.com"
                    placeholderTextColor="#94a3b8"
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

              {/* Age - Full width on top */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>AGE</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.age && styles.inputContainerError,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="cake-variant-outline"
                    size={20}
                    color={errors.age ? "#ef4444" : "#94a3b8"}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="25"
                    placeholderTextColor="#94a3b8"
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

              {/* Gender Selection - Separated row */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>GENDER</Text>
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
                      color={formData.sex === "male" ? "#00A86B" : "#94a3b8"}
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
                      color={formData.sex === "female" ? "#00A86B" : "#94a3b8"}
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

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.password && styles.inputContainerError,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color={errors.password ? "#ef4444" : "#94a3b8"}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
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
                      color="#64748b"
                    />
                  </Pressable>
                </View>
                {errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : null}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.confirmPassword && styles.inputContainerError,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-check-outline"
                    size={20}
                    color={errors.confirmPassword ? "#ef4444" : "#94a3b8"}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
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
                      color="#64748b"
                    />
                  </Pressable>
                </View>
                {errors.confirmPassword ? (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                ) : null}
              </View>

              {/* Terms */}
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By creating an account, you agree to our{" "}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>

              {/* Register Button */}
              <Pressable
                style={[
                  styles.registerButton,
                  loading && styles.registerButtonDisabled,
                ]}
                onPress={handleRegister}
                disabled={loading}
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
              </Pressable>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <Pressable onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.loginLink}>Sign in</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  bgShape: {
    position: "absolute",
    backgroundColor: "#00A86B15",
    borderRadius: 500,
  },
  bgShape1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.4,
    right: -width * 0.2,
  },
  bgShape2: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  bgShape3: {
    width: width * 0.4,
    height: width * 0.4,
    top: "40%",
    right: -width * 0.1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00A86B10",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#00A86B10",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#00A86B30",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
  },
  inputContainerError: {
    borderColor: "#ef4444",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#0f172a",
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
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    marginTop: 8, // Added margin to separate from label
  },
  genderOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  genderOptionSelected: {
    backgroundColor: "#00A86B10",
  },
  genderText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  genderTextSelected: {
    color: "#00A86B",
    fontWeight: "600",
  },
  termsContainer: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  termsText: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
    textAlign: "center",
  },
  termsLink: {
    color: "#00A86B",
    fontWeight: "600",
  },
  registerButton: {
    height: 56,
    backgroundColor: "#00A86B",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#00A86B",
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
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    color: "#64748b",
  },
  loginLink: {
    fontSize: 14,
    color: "#00A86B",
    fontWeight: "600",
  },
});

export default RegisterScreen;
