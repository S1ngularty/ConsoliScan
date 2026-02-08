import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeNavigator from "./HomeNavigator";
import ScanningScreen from "../screens/customer/ScanningScreen";
import CheckoutQRScreen from "../screens/customer/QRScreen";
import UserProfileScreen from "../screens/customer/UserProfileScreen";
import EligibilityIntroScreen from "../screens/customer/EligibilityIntroScreen";
import EligibilityStatusScreen from "../screens/customer/EligibilityStatusScreen";
import EligibilityApplyScreen from "../screens/customer/EligibilityApplyScreen";
import OrderHistoryScreen from "../screens/customer/OrderHistory";
import SavedItemsScreen from "../screens/customer/SaveItemsScreen";
import HelpSupportScreen from "../screens/customer/HelpSupportScreen";
import ReceiptScreen from "../screens/customer/RecieptScreen";

const Stack = createNativeStackNavigator();

export default function CustomerStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTabs" component={HomeNavigator} />
      <Stack.Screen name="Scan" component={ScanningScreen} />
      <Stack.Screen name="QR" component={CheckoutQRScreen} />
      <Stack.Screen name="Profile" component={UserProfileScreen} />
      <Stack.Screen
        name="EligibilityIntro"
        component={EligibilityIntroScreen}
      />
      <Stack.Screen
        name="EligibilityApply"
        component={EligibilityApplyScreen}
      />
      <Stack.Screen
        name="EligibilityStatus"
        component={EligibilityStatusScreen}
      />
      <Stack.Screen name="History" component={OrderHistoryScreen} />
      <Stack.Screen name="Saved" component={SavedItemsScreen} />
      <Stack.Screen name="Help" component={HelpSupportScreen} />
      <Stack.Screen name="Reciept" component={ReceiptScreen} />
    </Stack.Navigator>
  );
}
