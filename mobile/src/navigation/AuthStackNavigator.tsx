import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignUp from "../features/auth/screens/SignUp";

const AuthStack = createNativeStackNavigator();

export default function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen component={SignUp} name="SignUp" />
    </AuthStack.Navigator>
  );
}
