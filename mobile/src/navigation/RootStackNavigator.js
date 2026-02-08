import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

import AuthNavigation from "./AuthNavigator";
import CustomerStackNavigator from "./CustomerStackNavigator";
import CashierStackNavigator from "./CashierStackNavigator";
import SplashScreen from "../screens/SplashScreen";
import SharedNavigation from "./SharedNavigation";
import GuestNavigator from "./GuestNavigator";

const ROLES = {
  Customer: "user",
  Cashier: "checker",
  Guest: "guest",
};

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { loading, isLoggedIn, role } = useSelector((state) => state.auth);

  const [appIsReady, setAppIsReady] = useState(false);
  if (!appIsReady) {
    return <SplashScreen onReady={() => setAppIsReady(true)} />;
  }

  // useEffect(() => {
  //   console.log(loading, isLoggedIn, role);
  // }, [loading, isLoggedIn, role]);

  return (
    <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
      {role === ROLES.Customer ? (
        <>
          <Stack.Screen name="Customer" component={CustomerStackNavigator} />
          <Stack.Screen name="Shared" component={SharedNavigation} />
        </>
      ) : role === ROLES.Cashier ? (
        <Stack.Screen name="Cashier" component={CashierStackNavigator} />
      ) : role === ROLES.Guest ? (
        <>
          <Stack.Screen name="Guest" component={GuestNavigator} />
          <Stack.Screen name="Shared" component={SharedNavigation} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigation} />
      )}
    </Stack.Navigator>
  );
}
