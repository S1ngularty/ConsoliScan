import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GuestHomeScreen from "../screens/guest/GuestHomeScreen";

const Stack = createNativeStackNavigator();

const GuestNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={GuestHomeScreen} />
    </Stack.Navigator>
  );
};

export default GuestNavigator;
