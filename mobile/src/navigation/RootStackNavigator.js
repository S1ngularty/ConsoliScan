import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import AuthNavigation from "./AuthNavigator";
import CustomerStackNavigator from "./CustomerStackNavigator";
import CashierStackNavigator from "./CashierStackNavigator";
import SplashScreen from "../screens/SplashScreen";
import GuestNavigator from "./GuestNavigator";
import productThunks from "../features/slices/product/productThunks";

const ROLES = {
  Customer: "user",
  Cashier: "checker",
  Guest: "guest",
};

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { loading, isLoggedIn, role } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  //  useEffect(() => {
  //   console.log(loading, isLoggedIn, role);
  // }, [loading, isLoggedIn, role]);

  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    if (!appIsReady) return;
    if (isLoggedIn) {
      dispatch(productThunks.fetchCatalogFromServer());
    }
  }, [appIsReady, isLoggedIn, dispatch]);

  if (!appIsReady) {
    return <SplashScreen onReady={() => setAppIsReady(true)} />;
  }

  return (
    <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
      {role === ROLES.Customer ? (
        <>
          <Stack.Screen name="Customer" component={CustomerStackNavigator} />
        </>
      ) : role === ROLES.Cashier ? (
        <Stack.Screen name="Cashier" component={CashierStackNavigator} />
      ) : role === ROLES.Guest ? (
        <>
          <Stack.Screen name="Guest" component={GuestNavigator} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigation} />
      )}
    </Stack.Navigator>
  );
}
