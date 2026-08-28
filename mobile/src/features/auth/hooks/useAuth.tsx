import React from "react";
import { useSignUp, useSignIn } from "@clerk/expo";
import { useNavigation } from "@react-navigation/native";

export default function useAuth() {
  const { signUp } = useSignUp();
  const { signIn, errors, fetchStatus } = useSignIn();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSignUp = async () => {
    const { error } = await signUp.password({
      emailAddress: email,
      password: password,
    });

    if (error) {
      console.log(error);
      return;
    }

    await signUp.verifications.sendEmailCode();

    const needsEmailCode =
      Array.isArray(signUp.unverifiedFields) &&
      signUp.unverifiedFields.includes("email_address");

    //    if (needsEmailCode) {
    //      setShowEmailCode(true);
    //      return;
    //    }

    // if (
    //   signUp.status === "missing_requirements" &&
    //   (signUp.missingFields?.length ?? 0) > 0
    // ) {
    //   router.push("/continue" as Href);
    //   return;
    // }

    console.log("Sign-up status:", signUp.status);
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    handleSignUp,
  };
}
