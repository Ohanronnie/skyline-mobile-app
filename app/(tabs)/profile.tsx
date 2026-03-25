import { LegalLinksRow } from "@/components/legal-links-row";
import { SMSManagementModal } from "@/components/partners/SMSManagementModal";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardStats } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useState } from "react";
import {
    Image,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSMSModalVisible, setIsSMSModalVisible] = useState(false);
  const { user, logout } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const totals = stats?.totals;

  const displayName = user?.name || "User";
  const subtitleParts: string[] = [];
  if ((user as any)?.role) {
    subtitleParts.push(String((user as any).role).replace(/_/g, " "));
  }
  if ((user as any)?.organization) {
    subtitleParts.push(String((user as any).organization));
  }
  const subtitle =
    subtitleParts.length > 0 ? subtitleParts.join(" • ") : "Signed in";
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView>
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <Pressable
          onPress={() => router.back()}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}
        >
          <Ionicons name="arrow-back" size={24} color="#1A293B" />
        </Pressable>
        <Text className="text-lg font-semibold text-[#1A293B]">Profile</Text>
        <Pressable
          onPress={() => router.push("/notification")}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}
        >
          <Image
            source={require("@/assets/images/notification-icon.png")}
            className="w-8 h-8"
            resizeMode="contain"
          />
        </Pressable>
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
          <Text className="text-2xl font-bold text-[#1A293B] mb-1">
            {displayName}
          </Text>
          <Text className="text-sm text-gray-600 mb-1">{subtitle}</Text>
          {user?.email && (
            <Text className="text-xs text-gray-500 mb-4">{user.email}</Text>
          )}

          <View className="flex-row w-full justify-between">
            {[
              {
                key: "shipments",
                label: "Shipments",
                value: totals?.shipments ?? 0,
              },
              {
                key: "containers",
                label: "Containers",
                value: totals?.containers ?? 0,
              },
              {
                key: "customers",
                label: "Customers",
                value: totals?.customers ?? 0,
              },
            ].map((item) => (
              <View key={item.key} className="items-center flex-1">
                <Text className="text-2xl font-bold text-primary-blue">
                  {item.value}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Preferences */}
        <View className="space-y-4 mb-8">
          <View className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Image
                source={require("@/assets/images/translation-icon.png")}
                className="w-10 h-10 mr-3"
                resizeMode="contain"
              />
              <View>
                <Text className="text-base font-semibold text-[#1A293B]">
                  Language
                </Text>
                <Text className="text-sm text-gray-500">English (US)</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>

          <View className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Image
                source={require("@/assets/images/notification-bell.png")}
                className="w-10 h-10 mr-3"
                resizeMode="contain"
              />
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

          <TouchableOpacity
            onPress={() => setIsSMSModalVisible(true)}
            className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center justify-between"
          >
            <View>
              <Text className="text-base font-semibold text-[#1A293B]">
                SMS
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                Manage SMS sent to your customers
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <LegalLinksRow />

        {/* Sign out */}

        <View className="mt-4 items-center">
          <Text className="text-gray-400 text-xs font-medium">
            Version 1.0.22
          </Text>
        </View>
        <Pressable
          onPress={logout}
          android_ripple={{ color: "rgba(255,0,0,0.1)" }}
          className="mb-4 mt-2"
        >
          <View className="bg-red-100 rounded-full py-3 items-center border border-red-200">
            <Text className="text-red-600 font-semibold text-base">
              Sign out
            </Text>
          </View>
        </Pressable>
      </View>

      <SMSManagementModal
        isVisible={isSMSModalVisible}
        onClose={() => setIsSMSModalVisible(false)}
      />
      </ScrollView>
    </SafeAreaView>
  );
}
