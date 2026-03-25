import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      handleNavigation();
    }
  }, [isLoading, isAuthenticated]);

  const handleNavigation = async () => {
    // Hide splash screen before navigation
    try {
      await SplashScreen.hideAsync();
    } catch (error) {
      // Splash screen might already be hidden or not shown
      console.log("Splash screen already hidden");
    }

    if (isAuthenticated && user) {
      // Route based on user type
      if (user.userType === "customer") {
        // Customer user - redirect to customer portal
        router.replace("/(customer)/(tabs)/shipments");
      } else if (user.userType === "partner") {
        // Partner user - redirect to partner portal
        router.replace("/(partners)");
      } else {
        // Admin/Staff user - redirect to admin portal
        router.replace("/(tabs)");
      }
    } else {
      // User is not logged in, redirect to auth
      router.replace("/(auth)");
    }
  };

  // Return empty view - splash screen is shown by default
  return <View style={{ flex: 1, backgroundColor: "#1A293B" }} />;
}
