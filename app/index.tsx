import { useAuth } from "@/contexts/AuthContext";
import { getOnboardingComplete } from "@/lib/onboarding-storage";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOnboardingComplete().then((done) => {
      if (!cancelled) {
        setOnboardingCompleteState(done);
        setOnboardingChecked(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoading || !onboardingChecked) {
      return;
    }

    const handleNavigation = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
        console.log("Splash screen already hidden");
      }

      if (isAuthenticated && user) {
        if (user.userType === "customer") {
          router.replace("/(customer)/(tabs)/shipments");
        } else if (user.userType === "partner") {
          router.replace("/(partners)");
        } else {
          router.replace("/(tabs)");
        }
      } else if (!onboardingComplete) {
        router.replace("/onboarding");
      } else {
        router.replace("/(auth)");
      }
    };

    void handleNavigation();
  }, [
    isLoading,
    onboardingChecked,
    onboardingComplete,
    isAuthenticated,
    user,
  ]);

  return <View style={{ flex: 1, backgroundColor: "#1A293B" }} />;
}
