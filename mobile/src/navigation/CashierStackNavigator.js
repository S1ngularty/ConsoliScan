import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ManualEntryScreen from "../screens/cashier/ManualEntryScreen";
import OrderDetailsScreen from "../screens/cashier/OrderDetailsScreen";
import QRScanningScreen from "../screens/cashier/QRScanningScreen";

const Stack = createNativeStackNavigator();

export default function CashierStackNavigator() {
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ManualEntry" component={ManualEntryScreen} />
    <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
    <Stack.Screen name="QRScanning" component={QRScanningScreen} />
  </Stack.Navigator>;
}
