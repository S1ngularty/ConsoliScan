import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CartScreen from "../screens/customer/CartScreen";
import ScanningScreen from "../screens/customer/ScanningScreen";
import ReceiptScreen from "../screens/customer/RecieptScreen";
import HelpSupportScreen from "../screens/customer/HelpSupportScreen";
import CheckoutQRScreen from "../screens/customer/QRScreen";
import AboutAppScreen from "../screens/customer/AboutScreen";

const Stack = createNativeStackNavigator();

const SharedNavigation = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown:false}}>
      <Stack.Screen name="Scan" component={ScanningScreen} />
      <Stack.Screen name="Cart" component={CartScreen}/>
      <Stack.Screen name="QR" component={CheckoutQRScreen} />
      <Stack.Screen name="Help" component={HelpSupportScreen} />
      <Stack.Screen name="Reciept" component={ReceiptScreen} />
      <Stack.Screen name="About" component={AboutAppScreen}/>
    </Stack.Navigator>
  );
};

export default SharedNavigation;
