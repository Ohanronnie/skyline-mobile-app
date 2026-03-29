import Navbar from "@/components/navbar";
import { Box } from "@/components/ui/box";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardStats } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const { user } = useAuth();

  // Check if user is from Skyrak organization
  const isSkyrak = user?.organization?.toLowerCase() === "skyrak";

  const allMenuItems = [
    {
      image: require("@/assets/images/container-icon.png"),
      label: "Containers",
      route: "/containers",
    },
    {
      image: require("@/assets/images/customer-icon.png"),
      label: "Customers",
      route: "/customers",
    },
    {
      image: require("@/assets/images/warehouse-icon.png"),
      label: "Warehouses",
      route: "/(tabs)/warehouses",
    },
    {
      image: require("@/assets/images/partner.png"),
      label: "Partners",
      route: "/partners",
      hideForSkyrak: true, // Hide for Skyrak users
    },
    {
      image: require("@/assets/images/cargo-icon.png"),
      label: "Cargo",
      route: "/cargo",
    },
    {
      image: require("@/assets/images/documents-icon.png"),
      label: "Documents",
      route: "/documents",
    },

    {
      image: require("@/assets/images/staffs-icon.png"),
      label: "Staff",
      route: "/staffs",
    },
    {
      icon: "chatbubbles-outline",
      label: "Broadcast",
      route: "/broadcast",
      // hideForSkyrak: true, // Hide for Skyrak users
    },
  ];

  // Filter menu items based on organization
  const menuItems = allMenuItems.filter(
    (item) => !isSkyrak || !item.hideForSkyrak,
  );

  const {
    refetch,
    isRefetching,
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });
  const totals = stats?.totals;
  const recentShipments = stats?.recentActivity?.recentShipments ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Navbar />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: Platform.OS === "ios" ? 88 : 100,
        }}
        showsVerticalScrollIndicator={true}
        overScrollMode="always"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#1A293B"
            colors={["#1A293B"]}
          />
        }
      >
        <View className="px-4 pt-6">
          {/* Welcome Box */}
          <Box
            className="bg-white rounded-2xl py-6 px-4"
            style={styles.welcomeBox}
          >
            <Text className="text-2xl  text-[#1A293B] mb-2">Welcome back</Text>
            <Text className="text-3xl font-bold  text-primary-blue mb-6">
              {user?.name || "Skyline admin"}
            </Text>

            {/* Menu Items Grid */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {menuItems.map((item, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    if (item.route) {
                      router.push(item.route as any);
                    }
                  }}
                  android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                  className="mr-6"
                >
                  <View className="items-center">
                    <Box
                      className="rounded-xl w-16 h-16 items-center justify-center mb-2"
                      style={styles.iconBox}
                    >
                      {item.icon ? (
                        <Ionicons
                          name={item.icon as any}
                          size={40}
                          color="#1A293B"
                        />
                      ) : (
                        <Image
                          source={item.image}
                          className="w-10 h-10"
                          resizeMode="contain"
                        />
                      )}
                    </Box>
                    <Text className="text-xs text-gray-700 text-center font-medium">
                      {item.label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Box>

          {/* Total Boxes Grid */}
          <View className="flex-row flex-wrap justify-between mt-4">
            {[
              {
                key: "shipments",
                image: require("@/assets/images/container-icon.png"),
                label: "Total Shipments",
                value: totals?.shipments ?? 0,
              },
              {
                key: "containers",
                image: require("@/assets/images/cargo-icon.png"),
                label: "Total Containers",
                value: totals?.containers ?? 0,
              },
              {
                key: "customers",
                image: require("@/assets/images/customer-icon.png"),
                label: "Total Customers",
                value: totals?.customers ?? 0,
              },
              {
                key: "warehouses",
                image: require("@/assets/images/warehouse-icon.png"),
                label: "Total Warehouses",
                value: totals?.warehouses ?? 0,
              },
            ].map((item) => (
              <Box
                key={item.key}
                className="bg-white rounded-2xl p-4 mb-4"
                style={[styles.welcomeBox, { width: "48%" }]}
              >
                <View className="items-start">
                  <View className="flex-row items-center mb-2">
                    <Image
                      source={item.image}
                      className="w-6 h-6 mr-2"
                      resizeMode="contain"
                    />
                  </View>
                  <Text className="text-xl font-bold text-[#1A293B] mb-1">
                    {item.value}
                  </Text>
                  <Text className="text-base text-gray-600">{item.label}</Text>
                </View>
              </Box>
            ))}
          </View>

          {/* Recent Activity Box */}
          <Box
            className="bg-white rounded-2xl p-6 mt-4"
            style={styles.welcomeBox}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-[#1A293B]">
                Recent activity
              </Text>
              <Pressable onPress={() => console.log("View all pressed")}>
                <Text className="text-primary-blue font-semibold">
                  View all
                </Text>
              </Pressable>
            </View>

            <FlatList
              data={recentShipments}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              renderItem={({ item: shipment, index }) => {
                const date = new Date(shipment.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                );

                return (
                  <View
                    className={`flex-row justify-between items-center ${
                      index !== recentShipments.length - 1
                        ? "pb-4 mb-4 border-b border-gray-200"
                        : ""
                    }`}
                  >
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-[#1A293B] mb-1">
                        {shipment.trackingNumber}
                      </Text>
                      <View className="bg-green-100 rounded-full px-3 py-1 mb-2 self-start">
                        <Text className="text-xs font-semibold text-green-700">
                          {shipment.status}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: "/shipment-details",
                            params: { id: shipment._id },
                          })
                        }
                      >
                        <View className="bg-gray-100 rounded-full px-3 py-1 self-start">
                          <Text className="text-xs font-semibold text-[#1A293B]">
                            View
                          </Text>
                        </View>
                      </Pressable>
                    </View>
                    <Text className="text-xs text-gray-500 ml-4">{date}</Text>
                  </View>
                );
              }}
              ListEmptyComponent={() => (
                <View>
                  {isLoading ? (
                    <Text className="text-gray-500">Loading activity...</Text>
                  ) : error ? (
                    <Text className="text-red-500">
                      Failed to load dashboard stats
                    </Text>
                  ) : (
                    <Text className="text-gray-500">No recent activity</Text>
                  )}
                </View>
              )}
            />
          </Box>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  welcomeBox: {
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  iconBox: {
    backgroundColor: "#E5E7EB",
  },
});
