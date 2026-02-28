import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeNavigator from "./HomeNavigator";
import UserProfileScreen from "../screens/customer/UserProfileScreen";
import EligibilityIntroScreen from "../screens/customer/EligibilityIntroScreen";
import EligibilityStatusScreen from "../screens/customer/EligibilityStatusScreen";
import EligibilityApplyScreen from "../screens/customer/EligibilityApplyScreen";
import CameraScreen from "../screens/customer/CameraScreen";
import EligibilityFormScreen from "../screens/customer/EligibilityFormScreen";
import SavedItemsScreen from "../screens/customer/SaveItemsScreen";
import SharedNavigation from "./SharedNavigation";
import ReturnScreen from "../screens/customer/ReturnScreen";
import ReturnQRScreen from "../screens/customer/ReturnQRScreen";
import ReturnOptionsScreen from "../screens/customer/ReturnOptionsScreen";

const Stack = createNativeStackNavigator();

export default function CustomerStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTabs" component={HomeNavigator} />
      <Stack.Screen name="Profile" component={UserProfileScreen} />
      <Stack.Screen
        name="EligibilityIntro"
        component={EligibilityIntroScreen}
      />
      <Stack.Screen
        name="EligibilityApply"
        component={EligibilityApplyScreen}
      />
      <Stack.Screen name="CameraScreen" component={CameraScreen} />
      <Stack.Screen
        name="EligibilityFormScreen"
        component={EligibilityFormScreen}
      />
      <Stack.Screen
        name="EligibilityStatus"
        component={EligibilityStatusScreen}
      />
      <Stack.Screen name="Saved" component={SavedItemsScreen} />
      <Stack.Screen name="Shared" component={SharedNavigation} />
      <Stack.Screen name="Return" component={ReturnScreen} />
      <Stack.Screen name="ReturnQR" component={ReturnQRScreen} />
      <Stack.Screen name="ReturnOptions" component={ReturnOptionsScreen} />
    </Stack.Navigator>
  );
}
