import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ManualEntryScreen from "../screens/cashier/ManualEntryScreen";
import QRScanningScreen from "../screens/cashier/QRScanningScreen";
import DrawerNavigator from "./DrawerNavigator";
import AIItemCountTestScreen from "../screens/cashier/DetectionScreen";
import QRScanValidationScreen from "../screens/cashier/QRScanValidationScreen";
import PaymentScreen from "../screens/cashier/PaymentScreen";
import OrderSummaryScreen from "../screens/cashier/OrderSummaryScreen";
import BarcodeScanningScreen from "../screens/cashier/BarcodeScanningScreen";
import ExchangeReturnScreen from "../screens/cashier/ExchangeReturnScreen";

const Stack = createNativeStackNavigator();

export default function CashierStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DrawTabs" component={DrawerNavigator} />
      <Stack.Screen name="QRScanning" component={QRScanningScreen} />
      <Stack.Screen name="ManualEntry" component={ManualEntryScreen} />
      <Stack.Screen name="BarcodeScan" component={BarcodeScanningScreen} />
      <Stack.Screen name="Detection" component={AIItemCountTestScreen} />
      <Stack.Screen
        name="QRScanValidation"
        component={QRScanValidationScreen}
      />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="OrderSummary" component={OrderSummaryScreen} />
      <Stack.Screen name="ExchangeReturn" component={ExchangeReturnScreen} />
    </Stack.Navigator>
  );
}
