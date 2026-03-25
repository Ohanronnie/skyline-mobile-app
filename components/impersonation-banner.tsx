import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

export function ImpersonationBanner() {
  const { isImpersonating, user, exitImpersonation } = useAuth();

  if (!isImpersonating) {
    return null;
  }

  return (
    <View className="bg-yellow-500 px-4 py-3 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <Ionicons name="warning" size={20} color="#1A293B" />
        <Text className="text-[#1A293B] font-semibold text-sm ml-2 flex-1">
          Viewing as {user?.name || "Partner"}
        </Text>
      </View>
      <Pressable
        onPress={async () => {
          try {
            await exitImpersonation();
          } catch (error) {
            console.error("Failed to exit impersonation:", error);
          }
        }}
        android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
        <View className="bg-[#1A293B] rounded-lg px-3 py-1.5 flex-row items-center">
          <Ionicons name="exit-outline" size={16} color="white" />
          <Text className="text-white font-semibold text-xs ml-1">Exit</Text>
        </View>
      </Pressable>
    </View>
  );
}
