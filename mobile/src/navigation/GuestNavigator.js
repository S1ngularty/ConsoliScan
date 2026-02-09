import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GuestHomeScreen from "../screens/guest/GuestHomeScreen";
import SharedNavigation from "./SharedNavigation";

const Stack = createNativeStackNavigator();

const GuestNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={GuestHomeScreen} />
      <Stack.Screen name="Shared" component={SharedNavigation} />
    </Stack.Navigator>
  );
};

export default GuestNavigator;
