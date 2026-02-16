import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

export default function NotificationManager() {
  useEffect(() => {
    register();
  }, []);

  async function register() {
    if (!Device.isDevice) return;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    console.log("Push token:", token);

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }
  }

  return null; // no UI needed
}
