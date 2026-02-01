import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ManualEntryScreen from "../screens/cashier/ManualEntryScreen";
import OrderDetailsScreen from "../screens/cashier/OrderDetailsScreen";
import QRScanningScreen from "../screens/cashier/QRScanningScreen";

const Stack = createNativeStackNavigator();

export default function CashierStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="QRScanning" component={QRScanningScreen} />
      <Stack.Screen name="ManualEntry" component={ManualEntryScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
    </Stack.Navigator>
  );
}
