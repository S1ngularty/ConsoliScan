import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/auth/loginScreen";
import RegisterScreen from "../screens/auth/registerScreen";
import scanningScreen from "../screens/customer/scanningScreen";

const Stack = createNativeStackNavigator();

export default function AuthNavigation() {
  return [
    <Stack.Screen name="Login" component={LoginScreen} />,
    <Stack.Screen name="Register" component={RegisterScreen} />,
    <Stack.Screen scanningScreen name="Scan" component={scanningScreen} />,
  ];
}
