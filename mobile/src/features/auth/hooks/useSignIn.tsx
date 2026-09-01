import React from "react";
import { useSignIn } from "@clerk/expo";
import { useNavigation } from "@react-navigation/native";
import showToast from "../../../helpers/toast";

const useSignInHook = () => {
  const { signIn } = useSignIn();
  const navigation = useNavigation();

  const [signInFetching, setSignInFetching] = React.useState(false);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSignIn = async () => {
    if (!email) return;

    setSignInFetching(true);

    try {
      const { error } = await signIn.password({
        emailAddress: email,
        password,
      });

      if (error) {
        showToast("error", "Authentication Error", error.message);
        return;
      }

      if (signIn.status === "complete") {
        navigation.navigate("Home" as never);
      }
    } finally {
      setSignInFetching(false);
    }
  };

  const navigateToSignUp = () => {
    navigation.navigate("SignUp" as never);
  };

  return {
    email,
    setEmail,

    password,
    setPassword,

    signInFetching,

    handleSignIn,
    navigateToSignUp,
  };
};

export default useSignInHook;
