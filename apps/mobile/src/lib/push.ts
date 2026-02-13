/**
 * Push Notification Registration — KobKlein Mobile
 *
 * Registers device for Expo push notifications and syncs token to API.
 */
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { kkPost } from "./api";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request push notification permission and get Expo Push Token.
 * Returns null on simulators or if permission denied.
 */
export async function registerForPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Android requires notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "KobKlein",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#C6A756",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: "kobklein", // Replace with actual Expo project ID
  });

  return tokenData.data;
}

/**
 * Register push token with KobKlein API.
 * Called after login / session restore.
 */
export async function syncPushToken(): Promise<void> {
  try {
    const expoToken = await registerForPushToken();
    if (!expoToken) return;

    await kkPost("/v1/push/register", {
      expoToken,
      platform: Platform.OS,
    });
  } catch {
    // Silent fail — push is non-critical
  }
}
