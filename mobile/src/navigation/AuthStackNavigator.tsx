import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignUp from "../features/auth/screens/SignUp";
import VerifyEmailScreen from "../features/auth/screens/EmailVerification";

const AuthStack = createNativeStackNavigator();

export default function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen component={SignUp} name="SignUp" />
      <AuthStack.Screen component={VerifyEmailScreen} name="VerifyEmail"/>
    </AuthStack.Navigator>
  );
}
