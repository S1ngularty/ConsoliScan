import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "react-redux";
import RootNavigator from "./navigation/RootStackNavigator";
import store from "./features/store/Store";
import NotificationManager from "./components/Common/NotificationManager";

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        {/* <NotificationManager/> */}
        <RootNavigator />
      </NavigationContainer>
    </Provider>
  );
}
