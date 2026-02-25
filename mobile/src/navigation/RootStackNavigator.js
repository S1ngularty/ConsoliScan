import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AuthNavigation from "./AuthNavigator";
import CustomerStackNavigator from "./CustomerStackNavigator";
import CashierStackNavigator from "./CashierStackNavigator";
import SplashScreen from "../screens/SplashScreen";
import GuestNavigator from "./GuestNavigator";
import productThunks from "../features/slices/product/productThunks";
import OfflineBanner from "../components/Common/OfflineBanner";
import {
  setOffline,
  setServerDown,
} from "../features/slices/network/networkSlice";
import { setNetworkDispatch } from "../utils/apiErrorHandler";
import {
  syncCartToServer,
  syncPendingCheckouts,
} from "../features/slices/cart/cartThunks";

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

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline =
        !state.isConnected ||
        state.isInternetReachable === false ||
        state.type === "none";
      dispatch(setOffline(offline));
      if (!offline) {
        dispatch(setServerDown(false));
        // Check for pending cart sync when coming back online
        checkPendingCartSync();
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  // Check and trigger pending cart sync and checkouts
  const checkPendingCartSync = async () => {
    try {
      // Sync pending cart changes
      const needsSync = await AsyncStorage.getItem("cart_needs_sync");
      if (needsSync === "true" && isLoggedIn && role === ROLES.Customer) {
        console.log(
          "🔄 [ROOT NAV] Network restored, triggering pending cart sync",
        );
        dispatch(syncCartToServer());
      }

      // Sync pending checkouts
      const checkoutQueueJson = await AsyncStorage.getItem("checkout_queue");
      if (checkoutQueueJson && isLoggedIn && role === ROLES.Customer) {
        const queue = JSON.parse(checkoutQueueJson);
        const pending = queue.filter((item) => !item.synced);
        if (pending.length > 0) {
          console.log(
            "🔄 [ROOT NAV] Network restored, syncing",
            pending.length,
            "pending checkouts",
          );
          dispatch(syncPendingCheckouts());
        }
      }
    } catch (error) {
      console.error("❌ [ROOT NAV] Error checking pending sync:", error);
    }
  };

  useEffect(() => {
    setNetworkDispatch(dispatch);
  }, [dispatch]);

  if (!appIsReady) {
    return <SplashScreen onReady={() => setAppIsReady(true)} />;
  }

  return (
    <View style={{ flex: 1 }}>
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
      <OfflineBanner />
    </View>
  );
}
