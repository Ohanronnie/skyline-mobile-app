import { ImpersonationBanner } from "@/components/impersonation-banner";
import { RecentActivityItem } from "@/components/partners/RecentActivityItem";
import { StatCard } from "@/components/partners/StatCard";
import { Box } from "@/components/ui/box";
import { useRequireAuth } from "@/contexts/AuthContext";
import { getPartnerHomeStats } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PartnersHomeScreen() {
  // Redirect to auth if tokens are missing/cleared
  useRequireAuth();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["partner-home"],
    queryFn: getPartnerHomeStats,
  });
  console.log(JSON.stringify(error, null, 2));
  const partner = data?.partner;
  const recentShipments = data?.recentActivity?.recentShipments ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Impersonation Banner */}
      <ImpersonationBanner />

      {/* Navbar */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <Text className="text-lg font-bold text-[#1A293B]">
          {partner?.name || "Partner"}
        </Text>
        <Pressable
          onPress={() => router.push("/(partners)/notification")}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
          <Box className="p-2 bg-gray-50 rounded-full">
            <Image
              source={require("@/assets/images/notification-icon.png")}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </Box>
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#1A293B"
            colors={["#1A293B"]}
          />
        }>
        {/* Welcome Section */}
        <View className="px-6 mt-4 mb-6">
          <Text className="text-2xl font-bold text-gray-900">
            Welcome back,
          </Text>
          <Text className="text-gray-500 text-base mt-1">
            Here's your business overview
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="px-6 flex-row flex-wrap justify-between">
          {[
            {
              id: "shipments",
              icon: require("@/assets/images/cargo-icon.png"),
              count: partner?.shipmentCount ?? 0,
              label: "Total shipments",
            },
            {
              id: "customers",
              icon: require("@/assets/images/people.png"),
              count: partner?.customerCount ?? 0,
              label: "Total customers",
            },
            {
              id: "containers",
              icon: require("@/assets/images/container-icon.png"),
              count: partner?.containerCount ?? 0,
              label: "Containers",
            },
          ].map((stat) => (
            <StatCard
              key={stat.id}
              icon={stat.icon}
              count={stat.count}
              label={stat.label}
            />
          ))}
        </View>

        {/* Recent Activity Section */}
        <View className="px-6 mt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">
              Recent activity
            </Text>
          </View>

          <Box className="bg-white rounded-xl p-4">
            {isLoading ? (
              <Text className="text-gray-500">Loading activity...</Text>
            ) : error ? (
              <Text className="text-red-500">Failed to load activity</Text>
            ) : recentShipments.length === 0 ? (
              <Text className="text-gray-500">No recent shipments</Text>
            ) : (
              recentShipments.map((item, index) => (
                <RecentActivityItem
                  key={item._id}
                  containerNumber={item.trackingNumber}
                  date={new Date(item.createdAt).toLocaleString()}
                  customerName={
                    typeof item.customerId === "object"
                      ? item.customerId?.name
                      : item.customerId || "Customer"
                  }
                  status={item.status as any}
                  isLast={index === recentShipments.length - 1}
                />
              ))
            )}
          </Box>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
