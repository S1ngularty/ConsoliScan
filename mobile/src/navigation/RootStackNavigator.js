import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeNavigator from "./HomeNavigator";
import AuthNavigation from "./AuthNavigator";
import ScanningScreen from "../screens/customer/ScanningScreen";
import CheckoutQRScreen from "../screens/customer/QRScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthNavigation} />
      <Stack.Screen name="HomeTabs" component={HomeNavigator} />
      <Stack.Screen name="Scan" component={ScanningScreen} />
      <Stack.Screen name="QR" component={CheckoutQRScreen} />
    </Stack.Navigator>
  );
}
