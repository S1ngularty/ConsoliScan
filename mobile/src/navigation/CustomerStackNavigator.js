import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeNavigator from "./HomeNavigator";
import ScanningScreen from "../screens/customer/ScanningScreen";
import CheckoutQRScreen from "../screens/customer/QRScreen";
import UserProfileScreen from "../screens/customer/UserProfileScreen";
import EligibilityIntroScreen from "../screens/customer/EligibilityIntroScreen";
import EligibilityStatusScreen from "../screens/customer/EligibilityStatusScreen";
import EligibilityApplyScreen from "../screens/customer/EligibilityApplyScreen";

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
    </Stack.Navigator>
  );
}
