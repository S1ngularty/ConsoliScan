import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useRef } from "react";
import useAuth from "../hooks/useAuth";

const VerifyEmailScreen = () => {
  const {
    verificationCode,
    setVerificationCode,
    handleVerifyEmail,
    handleResendCode,
    signUpFetching,
  } = useAuth();

  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleCodeChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);

    const codeArray = verificationCode.split("");

    codeArray[index] = digit;

    const newCode = codeArray.join("").slice(0, 6);

    setVerificationCode(newCode);

    // Move to the next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (event: any, index: number) => {
    if (
      event.nativeEvent.key === "Backspace" &&
      !verificationCode[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

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

            {/* Title */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>Verify your email</Text>

              <Text style={styles.description}>
                We sent a verification code to your email address.
              </Text>
            </View>

            {/* Verification Code */}
            <View style={styles.codeContainer}>
              {Array.from({ length: 6 }).map((_, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={styles.codeInput}
                  value={verificationCode[index] ?? ""}
                  onChangeText={(value) => handleCodeChange(value, index)}
                  onKeyPress={(event) => handleKeyPress(event, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  autoFocus={index === 0}
                />
              ))}
            </View>

            {/* Verify */}
            <Pressable
              style={({ pressed }) => [
                styles.verifyButton,
                (!verificationCode ||
                  verificationCode.length !== 6 ||
                  signUpFetching) &&
                  styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleVerifyEmail}
              disabled={verificationCode.length !== 6 || signUpFetching}
            >
              <Text style={styles.verifyButtonText}>Verify Email</Text>
            </Pressable>

            {/* Resend */}
            <Pressable
              style={({ pressed }) => [
                styles.resendButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleResendCode}
              disabled={signUpFetching}
            >
              <Text style={styles.resendButtonText}>Resend Code</Text>
            </Pressable>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerifyEmailScreen;

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

  textContainer: {
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "600",
  },

  description: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },

  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginVertical: 10,
  },

  codeInput: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
  },

  verifyButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 5,
  },

  verifyButtonText: {
    color: "#2E9E68",
    fontSize: 16,
    fontWeight: "600",
  },

  resendButton: {
    paddingVertical: 14,
    alignItems: "center",
  },

  resendButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  buttonDisabled: {
    opacity: 0.5,
  },
});
