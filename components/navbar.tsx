import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { useState } from "react";
import { Image, Pressable, View } from "react-native";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const handleNotificationPress = () => {
    if (user?.userType === "partner") {
      router.push("/(partners)/notification");
    } else if (user?.userType === "customer") {
      router.push("/(customer)/(tabs)/notification");
    } else {
      // Admin/staff
      router.push("/notification");
    }
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      {/* Logo - Show Skyrak logo for Skyrak org, otherwise Skyline */}
      <Image
        source={
          user?.organization?.toLowerCase() === "skyrak"
            ? require("@/assets/images/skyrak.png")
            : require("@/assets/images/skyline-logo.png")
        }
        className="h-10 w-32"
        resizeMode="cover"
      />

      {/* Search Bar */}
      <View className="flex-1  mx-4">
      
      </View>

      {/* Notification Icon */}
      <Pressable
        onPress={handleNotificationPress}
        android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
        <Image
          source={require("@/assets/images/notification-icon.png")}
          className="w-6 h-6"
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}
