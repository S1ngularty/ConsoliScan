import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthStackNavigator from "./AuthStackNavigator";

const Stack = createNativeStackNavigator();

export default function RootStack() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen component={AuthStackNavigator} name="Auth" />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
