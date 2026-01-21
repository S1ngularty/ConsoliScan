import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AuthNavigation from "./navigation/authNavigation";

const Stack = createNativeStackNavigator();

export default function App() {
  const navigations = [...AuthNavigation()];
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown:false}}>{navigations.map((nav) => nav)}</Stack.Navigator>
    </NavigationContainer>
  );
}
