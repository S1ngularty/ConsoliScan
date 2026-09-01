import React from "react";
import { useSignUp } from "@clerk/expo";
import { useNavigation } from "@react-navigation/native";
import showToast from "../../../helpers/toast";

interface User {
  first_name: string;
  last_name: string;
  username?: string | null;
}

export default function useSignUpHook() {
  const { signUp } = useSignUp();
  const navigation = useNavigation();

  const [signUpFetching, setSignUpFetching] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [verificationCode, setVerificationCode] = React.useState("");

  // 1. Give it an initial empty state so 'user' is NEVER undefined
  const [user, setUser] = React.useState<User>({
    first_name: "",
    last_name: "",
    username: "",
  });

  const handleSignUp = async () => {
    // 2. Fixed the broken if statement and safely validate required fields
    if (
      !user.first_name.trim() ||
      !user.last_name.trim() ||
      !email ||
      !password
    ) {
      showToast(
        "error",
        "Sign up Error",
        "Please fill out all required fields.",
      );
      return;
    }

    // Ensure Clerk instance is loaded before proceeding
    if (!signUp) return;

    setSignUpFetching(true);

    try {
      // Clerk handles errors by throwing exceptions, not returning an error object
      const { error } = await signUp.create({
        firstName: user.first_name,
        lastName: user.last_name,
        emailAddress: email,
        password,
      });

      // Clerk told us the email hasn't been verified yet.
      if (signUp.unverifiedFields.includes("email_address")) {
        const { error: codeError } = await signUp.verifications.sendEmailCode();

        if (codeError) {
          showToast(
            "error",
            "Verfication Error",
            "Failed to send verification code, Please try again.",
          );

          return;
        }
        console.log("Verification code sent!");
        navigation.navigate("VerifyEmail" as never);
      }
    } catch (error) {
      console.error("Sign up error:", error);
    } finally {
      setSignUpFetching(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!signUp) return;
    setSignUpFetching(true);
    try {
      const attemptVerification = await signUp.verifications.verifyEmailCode({
        code: verificationCode,
      });

      console.log("Verification successful!");
      console.log("Status:", signUp.status);

      if (signUp.status === "complete") {
        // Clerk handles session management automatically on 'complete' status
        console.log("User is now authenticated!");
      }
    } catch (error) {
      console.error("email verification error:", error);
    } finally {
      setSignUpFetching(false);
    }
  };

  const handleResendCode = async () => {
    if (!signUp) return;
    setSignUpFetching(true);
    try {
      await signUp.verifications.sendEmailCode();
      console.log("New verification code sent!");
    } catch (error) {
      showToast(
        "error",
        "Verfication Error",
        "Failed to send verification code, Please try again.",
      );
      console.error("Resend code error:", error);
    } finally {
      setSignUpFetching(false);
    }
  };

  // 3. Simplified state updates because 'prev' is guaranteed to exist now
  const handleFieldInput = (fieldName: keyof User, value: string) => {
    setUser((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const navigateToSignIn = () => {
    navigation.navigate("SignIn" as never);
  };

  return {
    user,
    email,
    setEmail,
    password,
    setPassword,
    handleSignUp,
    signUpFetching,
    verificationCode,
    setVerificationCode,
    handleVerifyEmail,
    handleResendCode,
    navigateToSignIn,
    handleFieldInput,
  };
}
