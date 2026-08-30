import {
  Text,
  TextInput,
  View,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import useSignUp from "../hooks/useSignUp";

const SignUp = () => {
  const {
    user,
    email,
    setEmail,
    password,
    setPassword,
    handleSignUp,
    signUpFetching,
    navigateToSignIn,
    handleFieldInput,
  } = useSignUp();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.innerContainer}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>ConsoliScan</Text>
                <Text style={styles.tagline}>Create your account</Text>
              </View>

              {/* Form */}
              <View style={styles.formContainer}>
                <View style={styles.nameRow}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="First Name"
                    placeholderTextColor="#A8D5B5"
                    value={user?.first_name}
                    onChangeText={(e) => handleFieldInput("first_name", e)}
                    autoCapitalize="words"
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="Last Name"
                    placeholderTextColor="#A8D5B5"
                    value={user?.last_name}
                    onChangeText={(e) => handleFieldInput("last_name", e)}
                    autoCapitalize="words"
                  />
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#A8D5B5"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#A8D5B5"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />

                {/* Create Account Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.createButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleSignUp}
                  disabled={signUpFetching}
                >
                  <Text style={styles.createButtonText}>
                    {signUpFetching ? "Creating Account..." : "Create Account"}
                  </Text>
                </Pressable>
              </View>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.orText}>or continue with</Text>
                <View style={styles.line} />
              </View>

              {/* Social Buttons */}
              <View style={styles.buttonContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.socialButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => console.log("Google Sign In")}
                >
                  <Text style={styles.socialButtonText}>
                    Continue with Google
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.socialButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => console.log("Phone Sign In")}
                >
                  <Text style={styles.socialButtonText}>
                    Continue with Phone
                  </Text>
                </Pressable>
              </View>

              {/* Sign In Link */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Already have an account? </Text>
                <Pressable onPress={navigateToSignIn}>
                  <Text style={styles.signUpLink}>Sign In</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#2E9E68",
  },
  container: {
    flex: 1,
    backgroundColor: "#2E9E68",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  innerContainer: {
    padding: 24,
    paddingVertical: 32,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagline: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    fontWeight: "400",
  },
  formContainer: {
    gap: 12,
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    padding: 16,
    fontSize: 16,
    color: "#FFFFFF",
  },
  halfInput: {
    flex: 1,
  },
  createButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: "#2E9E68",
    fontSize: 16,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  orText: {
    color: "rgba(255, 255, 255, 0.7)",
    marginHorizontal: 12,
    fontSize: 14,
  },
  buttonContainer: {
    gap: 12,
  },
  socialButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  socialButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  signUpText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  signUpLink: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
