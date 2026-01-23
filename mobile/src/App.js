import React from "react";
import { NavigationContainer } from "@react-navigation/native";

import AuthNavigation from "./navigation/AuthNavigation";
import HomeNavigator from "./navigation/HomeNavigator";
import RootNavigator from "./navigation/RootStackNavigator";

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator/>
    </NavigationContainer>
  );
}
