import React from "react";
import { NavigationContainer } from "@react-navigation/native";

import AuthNavigation from "./navigation/authNavigation";
import HomeNavigator from "./navigation/HomeNavigator";

export default function App() {
  return (
    <NavigationContainer>
      <HomeNavigator></HomeNavigator>
     <AuthNavigation></AuthNavigation>
    </NavigationContainer>
  );
}
