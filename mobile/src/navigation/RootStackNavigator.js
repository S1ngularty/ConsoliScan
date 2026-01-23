import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeNavigator from "./HomeNavigator";
import AuthNavigation from "./AuthNavigation";
import ScanningScreen from "../screens/customer/ScanningScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTabs" component={HomeNavigator} />
      <Stack.Screen name="Auth" component={AuthNavigation} />
      <Stack.Screen name="Scan" component={ScanningScreen} />
    </Stack.Navigator>
  );
}
