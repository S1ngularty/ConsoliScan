import React from "react";
import { TouchableOpacity, Text } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../constants/firebase"; // adjust path
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { androidClientId, expoClientId } from "../constants/config";

WebBrowser.maybeCompleteAuthSession();

const GoogleSignIn = ({ style }) => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId,
    androidClientId,
  });

  React.useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).catch(console.error);
    }
  }, [response]);

  return (
    <TouchableOpacity
      style={style}
      disabled={!request}
      onPress={() => promptAsync()}
    >
      <MaterialCommunityIcons name="google" size={20} color="#DB4437" />
      <Text>Continue with Google</Text>
    </TouchableOpacity>
  );
};

export default GoogleSignIn;
