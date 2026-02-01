import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeNavigator from "./HomeNavigator"
import ScanningScreen from "../screens/customer/ScanningScreen"
import CheckoutQRScreen from "../screens/customer/QRScreen"

const Stack = createNativeStackNavigator();

export default function CustomerStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTabs" component={HomeNavigator} />
      <Stack.Screen name="Scan" component={ScanningScreen} />
      <Stack.Screen name="QR" component={CheckoutQRScreen} />
    </Stack.Navigator>
  );
}
