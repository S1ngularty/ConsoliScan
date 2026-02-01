import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { useEffect } from "react";

import AuthNavigation from "./AuthNavigator";
import CustomerStackNavigator from "./CustomerStackNavigator";
import CashierStackNavigator from "./CashierStackNavigator";

const ROLES = {
  Customer: "user",
  Cashier: "checker",
};

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { loading, isLoggedIn, role } = useSelector((state) => state.auth);

  // useEffect(() => {
  //   console.log(loading, isLoggedIn, role);
  // }, [loading, isLoggedIn, role]);

  return (
    <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <Stack.Screen name="Auth" component={AuthNavigation} />
      ) : role === ROLES.Customer ? (
        <Stack.Screen name="Customer" component={CustomerStackNavigator} />
      ) : role === ROLES.Cashier ? (
        <Stack.Screen name="Cashier" component={CashierStackNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigation} />
      )}
    </Stack.Navigator>
  );
}
