import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { View, AppState, BackHandler, Alert } from "react-native";
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
  syncPendingCheckouts,
  syncOfflineTransactions,
} from "../features/slices/cart/cartThunks";
import { getPromos } from "../api/promo.api";
import { writePromos } from "../utils/promoStorage";

const ROLES = {
  Customer: "user",
  Cashier: "checker",
  Guest: "guest",
};

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { loading, isLoggedIn, role } = useSelector((state) => state.auth);
  const network = useSelector((state) => state.network);
  const dispatch = useDispatch();

  const [appIsReady, setAppIsReady] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const cartState = useSelector((state) => state.cart);

  // Listen for app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => {
      subscription.remove();
    };
  }, [cartState.sessionActive, cartState.sessionId, role, dispatch]);

  // Handle hardware back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // Show confirmation dialog when user tries to exit
        Alert.alert(
          "Exit App?",
          "Are you sure you want to exit the application?",
          [
            {
              text: "Cancel",
              onPress: () => {
                // Do nothing - stay in app
              },
              style: "cancel",
            },
            {
              text: "Exit",
              onPress: () => {
                // Allow app to exit
                BackHandler.exitApp();
              },
              style: "destructive",
            },
          ],
        );
        // Return true to prevent default back behavior
        return true;
      },
    );

    return () => {
      backHandler.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState) => {
    // App state change detected
    // Session persists only while app is alive
    appStateRef.current = nextAppState;
  };

  useEffect(() => {
    if (!appIsReady) return;
    if (!isLoggedIn) return;

    const initializeApp = async () => {
      if (role === ROLES.Customer) {
        // Session is cleared if app was killed - no recovery needed
        // Just ensure catalog is loaded
      }

      // Load catalog and promos
      try {
        await dispatch(productThunks.fetchCatalogFromServer());
      } catch (error) {}

      // Sync promos for customer
      if (role === ROLES.Customer) {
        try {
          const serverPromos = await getPromos();
          const unlimitedPromos = serverPromos.filter((promo) => {
            const limit = Number(promo.usageLimit || 0);
            return limit <= 0 && promo.active !== false;
          });
          await writePromos(unlimitedPromos);
        } catch (error) {}
      }
    };

    initializeApp();
  }, [appIsReady, isLoggedIn, role, dispatch]);

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

  useEffect(() => {
    const isOnline = !network.isOffline && !network.isServerDown;
    //  console.log("Network state changed:", isOnline);

    if (isOnline) {
      checkPendingCartSync();
    }
  }, [network.isOffline, network.isServerDown, isLoggedIn, role]);
  // Check and trigger pending sync for checkouts and offline transactions
  const checkPendingCartSync = async () => {
    try {
      // Sync pending checkouts (customer)
      const checkoutQueueJson = await AsyncStorage.getItem("checkout_queue");
      if (checkoutQueueJson && isLoggedIn && role === ROLES.Customer) {
        const queue = JSON.parse(checkoutQueueJson);
        const pending = queue.filter((item) => !item.synced);
        if (pending.length > 0) {
          dispatch(syncPendingCheckouts());
        }
      }

      // Sync offline cashier transactions
      const offlineTransactionsJson = await AsyncStorage.getItem(
        "offline_transactions",
      );
      if (offlineTransactionsJson && isLoggedIn && role === ROLES.Cashier) {
        const transactions = JSON.parse(offlineTransactionsJson);
        if (Array.isArray(transactions) && transactions.length > 0) {
          dispatch(syncOfflineTransactions());
        }
      }
    } catch (error) {}
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
