import { useNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = useNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady) {
    navigationRef.navigate(name, params);
  }
}
