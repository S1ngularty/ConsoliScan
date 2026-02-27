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
    // Push token received

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    // ✅ Local test notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Local Test",
        body: "Notifications are working 🎉",
      },
      trigger: null,
    });
  }

  return null;
}
