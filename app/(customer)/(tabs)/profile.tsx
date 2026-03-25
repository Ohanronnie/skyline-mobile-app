import { LegalLinksRow } from "@/components/legal-links-row";
import { useAuth } from "@/contexts/AuthContext";
import { getCustomerProfile } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Image,
  Pressable,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CustomerProfile() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { logout } = useAuth();

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customer-profile"],
    queryFn: getCustomerProfile,
  });

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Navbar */}
        <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
          <View style={{ width: 24 }} />
          <Text className="text-lg font-semibold text-[#1A293B]">Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <View className="flex-1 px-4 pt-6">
          <View className="bg-white rounded-2xl p-6 border border-gray-100 items-center mb-6">
            <View className="w-24 h-24 rounded-full bg-primary-blue items-center justify-center mb-4">
              <Image
                source={require("@/assets/images/profile-dummy.png")}
                className="w-16 h-16"
                resizeMode="contain"
              />
            </View>
            {isLoading ? (
              <Text className="text-base text-gray-500 mb-1">
                Loading profile...
              </Text>
            ) : error ? (
              <Text className="text-base text-red-500 mb-1">
                Failed to load profile
              </Text>
            ) : (
              <>
                <Text className="text-2xl font-bold text-[#1A293B] mb-1">
                  {profile?.name || "Customer"}
                </Text>
                <Text className="text-sm text-gray-600 mb-1">
                  {profile?.phone || profile?.email || ""}
                </Text>
                {profile?.location && (
                  <Text className="text-xs text-gray-500">
                    {profile.location.toString().toUpperCase()}
                  </Text>
                )}
              </>
            )}
          </View>

          {/* Preferences */}
          <View className="space-y-4 mb-8">
            <View className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => router.push("/(customer)/(tabs)/notification")}
                  className="mr-3">
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color="#1A293B"
                  />
                </TouchableOpacity>
                <View>
                  <Text className="text-base font-semibold text-[#1A293B]">
                    Notifications
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Manage notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#D1D5DB", true: "#9CC9FF" }}
                thumbColor={notificationsEnabled ? "#0065EA" : "#F4F4F5"}
              />
            </View>

            <View className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3">
                  <Ionicons name="language-outline" size={24} color="#1A293B" />
                </View>
                <View>
                  <Text className="text-base font-semibold text-[#1A293B]">
                    Language
                  </Text>
                  <Text className="text-sm text-gray-500">English (US)</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </View>

          <LegalLinksRow />

          {/* Sign out */}
          <Pressable
            onPress={() => {
              logout();
            }}
            android_ripple={{ color: "rgba(255,0,0,0.1)" }}
            className="mt-8">
            <View className="bg-red-100 rounded-full py-3 items-center border border-red-200">
              <Text className="text-red-600 font-semibold text-base">
                Sign out
              </Text>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}
