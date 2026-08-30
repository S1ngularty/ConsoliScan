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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import useSignInHook from "../hooks/useSignIn";

const SignIn = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    handleSignIn,
    signInFetching,
    navigateToSignUp,
  } = useSignInHook();

  // const [showToastNotification, setShowToastNotification] =
  //   React.useState(false);

  // React.useEffect(() => {
  //   setShowToastNotification(true);
  // }, [errorMessage]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* {errorMessage &&
        (showToast("error", "Authentication", errorMessage) as never)} */}
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

            {/* Sign In Button */}
            <Pressable
              style={({ pressed }) => [
                styles.signInButton,
                pressed && styles.buttonPressed,
                signInFetching && styles.buttonDisabled,
              ]}
              onPress={handleSignIn}
              disabled={signInFetching}
            >
              <Text style={styles.signInButtonText}>
                {signInFetching ? "Signing In..." : "Sign In"}
              </Text>
            </Pressable>

            {/* Forgot Password Link */}
            <Pressable
              onPress={() => console.log("Forgot Password")}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.line} />
            </View>

            {/* Social Buttons */}
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

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <Pressable onPress={navigateToSignUp}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;

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
    justifyContent: "center",
    padding: 30,
    gap: 15,
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
  signInButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  signInButtonText: {
    color: "#2E9E68",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginTop: -5,
  },
  forgotPasswordText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
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
    paddingVertical: 14,
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
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 5,
  },
  signUpText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  signUpLink: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
