import React from "react";
import { useSignUp, useSignIn } from "@clerk/expo";
import { useNavigation } from "@react-navigation/native";

export default function useSignUpHook() {
  const { signUp } = useSignUp();

  const navigation = useNavigation();

  const [signUpFetching, setSignUpFetching] = React.useState(false);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [verificationCode, setVerificationCode] = React.useState("");

  const handleSignUp = async () => {
    setSignUpFetching(true);

    try {
      const { error } = await signUp.password({
        emailAddress: email,
        password,
      });

      if (error) {
        console.log(error);
        return;
      }

      // Clerk told us the email hasn't been verified yet.
      if (signUp.unverifiedFields.includes("email_address")) {
        await signUp.verifications.sendEmailCode();

        console.log("Verification code sent!");
        navigation.navigate("VerifyEmail" as never)
      }
    } finally {
      setSignUpFetching(false);
    }
  };

  const handleVerifyEmail = async () => {
    setSignUpFetching(true)
    try {
      const { error } = await signUp.verifications.verifyEmailCode({
        code: verificationCode,
      });

      if (error) {
        console.error("email verification error:", error);
        return;
      }

      console.log("Verification successful!");
      console.log("Status:", signUp.status);

      if (signUp.status === "complete") {
        await signUp.finalize();
        console.log("User is now authenticated!");
      }
    } finally {
      setSignUpFetching(false);
    }
  };

  const handleResendCode = async () => {
    setSignUpFetching(true);
    try {
      const { error } = await signUp.verifications.sendEmailCode();

      if (error) {
        console.log(error);
        return;
      }

      console.log("New verification code sent!");
    } finally {
      setSignUpFetching(false);
    }
  };

  return {
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
  };
}
