import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ScanningScreen from "../screens/customer/ScanningScreen";

const Stack = createNativeStackNavigator();

export default function AuthNavigation() {
  return [
    <Stack.Screen name="Scan" component={ScanningScreen} />,
    <Stack.Screen name="Login" component={LoginScreen} />,
    <Stack.Screen name="Register" component={RegisterScreen} />,
  ];
}
