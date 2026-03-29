import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { Alert, Platform } from "react-native";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";

import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Check for OTA updates
  useEffect(() => {
    async function checkForUpdates() {
      // Skip in development mode
      if (__DEV__ || !Updates.isEnabled) {
        return;
      }

      try {
        const checkResult = await Updates.checkForUpdateAsync();

        if (checkResult.isAvailable) {
          const fetchResult = await Updates.fetchUpdateAsync();

          if (fetchResult.isNew) {
            Alert.alert(
              "Update Available",
              "A new version has been downloaded. Restart now to apply the changes?",
              [
                { text: "Later", style: "cancel" },
                {
                  text: "Restart Now",
                  onPress: () => Updates.reloadAsync(),
                },
              ]
            );
          }
        }
      } catch (error) {
        // Silently fail - don't interrupt user experience for update errors
        console.log("Update check failed:", error);
      }
    }

    // Check for updates after app initializes
    const timer = setTimeout(checkForUpdates, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Prepare the app (fonts, etc.) if needed
    async function prepare() {
      try {
        // Add any initialization here (fonts, etc.)
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, []);

  return (
    <GluestackUIProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
              animation: "default",
              ...(Platform.OS === "ios" && {
                fullScreenGestureEnabled: true,
                gestureDirection: "horizontal",
              }),
            }}>
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
                gestureEnabled: true,
                ...(Platform.OS === "ios" && {
                  fullScreenGestureEnabled: true,
                }),
              }}
            />
            <Stack.Screen
              name="onboarding"
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="(auth)"
              options={{
                headerShown: false,
                gestureEnabled: true,
                ...(Platform.OS === "ios" && {
                  fullScreenGestureEnabled: true,
                }),
              }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
                gestureEnabled: true,
                ...(Platform.OS === "ios" && {
                  fullScreenGestureEnabled: true,
                }),
              }}
            />
            <Stack.Screen
              name="(customer)"
              options={{
                headerShown: false,
                gestureEnabled: true,
                ...(Platform.OS === "ios" && {
                  fullScreenGestureEnabled: true,
                }),
              }}
            />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </GluestackUIProvider>
  );
}
