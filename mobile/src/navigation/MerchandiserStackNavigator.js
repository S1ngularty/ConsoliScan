import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MerchandiserHomeScreen from "../screens/merchandiser/MerchandiserHomeScreen";
import ProductScanScreen from "../screens/merchandiser/ProductScanScreen";
import ProductEditScreen from "../screens/merchandiser/ProductEditScreen";
import ProductAddScreen from "../screens/merchandiser/ProductAddScreen";

const Stack = createNativeStackNavigator();

export default function MerchandiserStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="MerchandiserHome"
        component={MerchandiserHomeScreen}
      />
      <Stack.Screen name="ProductScan" component={ProductScanScreen} />
      <Stack.Screen name="ProductEdit" component={ProductEditScreen} />
      <Stack.Screen name="ProductAdd" component={ProductAddScreen} />
    </Stack.Navigator>
  );
}
