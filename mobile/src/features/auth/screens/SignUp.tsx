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
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect } from "react";
import useSignUp from "../hooks/useSignUp";

const SignUp = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    handleSignUp,
    signUpFetching,
  } = useSignUp();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>ConsoliScan</Text>
            </View>

            {/* Inputs */}
            <View style={styles.inputContainer}>
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
            </View>

            {/* Create Account Button */}
            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSignUp}
              disabled={signUpFetching}
            >
              <Text style={styles.createButtonText}>Create Account</Text>
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.line} />
            </View>

            {/* Social & Phone Buttons */}
            <View style={styles.buttonContainer}>
              {/* Google Button */}
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

              {/* Phone Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.socialButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => console.log("Phone Sign In")}
              >
                <Text style={styles.socialButtonText}>Continue with Phone</Text>
              </Pressable>
            </View>
          </View>
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
  innerContainer: {
    flex: 1,
    justifyContent: "center", // Centers everything vertically
    padding: 30,
    gap: 15, // Reduced gap slightly to fit the new button
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "300",
    letterSpacing: 1,
  },
  inputContainer: {
    gap: 15,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    padding: 18,
    fontSize: 16,
    color: "#FFFFFF",
  },
  createButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14, // Made smaller (was 18)
    alignItems: "center",
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: "#2E9E68",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  orText: {
    color: "rgba(255, 255, 255, 0.7)",
    marginHorizontal: 10,
    fontSize: 14,
  },
  buttonContainer: {
    gap: 15,
  },
  socialButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14, // Made smaller to match Create Account button
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  socialButtonText: {
    color: "#2E9E68",
    fontSize: 16,
    fontWeight: "600",
  },
});
