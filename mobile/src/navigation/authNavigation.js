import React from "react";
import {createNativeStackNavigator} from "@react-navigation/native-stack"

import LoginScreen from "../screens/auth/loginScreen";

const Stack = createNativeStackNavigator()

export default function AuthNavigation (){
    return [
        <Stack.Screen name="Login" component={LoginScreen}/>
    ]
}