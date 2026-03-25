import { Input, InputField } from "@/components/ui/input";
import { useTrackingSummary } from "@/hooks/useShipments";
import { Shipment, ShipmentStatus, trackNumber } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ShipmentTracking() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const { data: summary, isLoading } = useTrackingSummary();

  // Group shipments by status for quick access
  const quickAccessItems = useMemo(() => {
    const stats = summary?.stats || {
      inTransit: 0,
      delivered: 0,
      pending: 0,
      atWarehouse: 0,
    };

    return [
      {
        icon: require("@/assets/images/warehouse-icon.png"),
        title: "In transit",
        subtitle: `${stats.inTransit} shipments`,
        filterStatus: ShipmentStatus.IN_TRANSIT,
      },
      {
        icon: require("@/assets/images/box-icon.png"),
        title: "Delivered",
        subtitle: `${stats.delivered} shipments`,
        filterStatus: ShipmentStatus.DELIVERED,
      },
      {
        icon: require("@/assets/images/pending-icon.png"),
        title: "Pending",
        subtitle: `${stats.pending} shipments`,
        filterStatus: ShipmentStatus.RECEIVED,
      },
      {
        icon: require("@/assets/images/at-wareouse-icon.png"),
        title: "At warehouse",
        subtitle: `${stats.atWarehouse} shipments`,
        filterStatus: ShipmentStatus.RECEIVED,
      },
    ];
  }, [summary]);

  // Get recent shipments from server
  const recentSearches = useMemo(() => {
    if (!summary?.recent) return [];

    return summary.recent.map((shipment: Shipment) => {
      const now = new Date();
      const created = new Date(shipment.createdAt);
      const diffMs = now.getTime() - created.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      let timeAgo = "";
      if (diffDays > 0) {
        timeAgo = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      } else if (diffHours > 0) {
        timeAgo = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      } else {
        timeAgo = "Just now";
      }

      const statusLabel =
        shipment.status === ShipmentStatus.DELIVERED ||
        shipment.status.includes("delivered")
          ? "Delivered"
          : shipment.status === ShipmentStatus.IN_TRANSIT ||
              shipment.status.includes("transit")
            ? "In transit"
            : shipment.status === ShipmentStatus.RECEIVED ||
                shipment.status.includes("received")
              ? "At warehouse"
              : "Pending";

      return {
        id: shipment._id,
        trackingNumber: shipment.trackingNumber,
        status: statusLabel,
        timeAgo,
      };
    });
  }, [summary]);

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      return;
    }

    setIsTracking(true);
    try {
      const result = await trackNumber(trackingNumber.trim());
      if (result.type === "shipment" && result.data) {
        router.push(`/shipment-details?id=${result.data._id}`);
      } else if (result.type === "container" && result.data) {
        router.push(`/container-details?id=${result.data._id}`);
      } else {
        // Show error or navigate to not found
        console.log("Tracking not found");
      }
    } catch (error) {
      console.error("Tracking error:", error);
      // You could show an error toast here
    } finally {
      setIsTracking(false);
    }
  };

  const handleQuickAccess = (filterStatus: string) => {
    // Navigate to shipments screen - the filter will need to be set via state
    // For now, just navigate to shipments and user can filter manually
    router.push("/(tabs)/shipments");
  };

  const handleRecentSearch = (shipmentId: string) => {
    router.push(`/shipment-details?id=${shipmentId}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <Pressable
          onPress={() => router.back()}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}
        >
          <Ionicons name="arrow-back" size={24} color="#1A293B" />
        </Pressable>
        <Text className="text-lg font-semibold text-[#1A293B]">Tracking</Text>
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

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1">
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{
              paddingBottom: Platform.OS === "ios" ? 40 : 120,
              flexGrow: 1,
            }}
            keyboardShouldPersistTaps="handled"
            overScrollMode="always"
            bounces={true}
          >
            <View className="px-4 pt-6">
              <View className="bg-white rounded-2xl p-5 border border-gray-100">
                <Text className="text-2xl font-bold text-[#1A293B] mb-2">
                  Track shipment
                </Text>
                <Text className="text-base text-gray-600 mb-6">
                  Enter your tracking number to find your shipment
                </Text>

                <Text className="text-sm font-medium text-[#1A293B] mb-2">
                  Tracking number
                </Text>
                <Input className="mb-5">
                  <InputField
                    value={trackingNumber}
                    onChangeText={setTrackingNumber}
                    placeholder="Enter tracking number"
                    placeholderTextColor="#9CA3AF"
                    className="text-[#1A293B]"
                  />
                </Input>

                <Pressable
                  onPress={handleTrack}
                  disabled={!trackingNumber.trim() || isTracking}
                  android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                >
                  <View
                    className={`rounded-full py-3 items-center flex-row justify-center ${
                      !trackingNumber.trim() || isTracking
                        ? "bg-gray-300"
                        : "bg-primary-blue"
                    }`}
                  >
                    {isTracking ? (
                      <>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text className="text-white font-semibold text-base ml-2">
                          Tracking...
                        </Text>
                      </>
                    ) : (
                      <Text className="text-white font-semibold text-base">
                        Track shipment
                      </Text>
                    )}
                  </View>
                </Pressable>
              </View>

              {/* Quick Access */}
              <View className="mt-8">
                <Text className="text-lg font-semibold text-[#1A293B] mb-4">
                  Quick access
                </Text>
                {isLoading ? (
                  <View className="items-center py-8">
                    <ActivityIndicator size="large" color="#1A293B" />
                  </View>
                ) : (
                  <View className="flex-row flex-wrap justify-between">
                    {quickAccessItems.map((item, index) => (
                      <Pressable
                        key={index}
                        onPress={() => handleQuickAccess(item.filterStatus)}
                        android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                        style={{ width: "48%" }}
                        className="mb-4"
                      >
                        <View className="bg-white border border-gray-100 rounded-2xl p-4 flex-row items-center">
                          <Image
                            source={item.icon}
                            className="w-10 h-10 mr-3"
                            resizeMode="contain"
                          />
                          <View>
                            <Text className="text-base font-semibold text-[#1A293B]">
                              {item.title}
                            </Text>
                            <Text className="text-sm text-gray-500">
                              {item.subtitle}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Recent Searches */}
              <View className="mt-8">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="time-outline" size={18} color="#1A293B" />
                  <Text className="text-sm font-semibold text-[#1A293B] ml-2">
                    Recent searches
                  </Text>
                </View>
                <View className="bg-white border border-gray-100 rounded-2xl p-4">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-base font-semibold text-[#1A293B]">
                      Recent tracking
                    </Text>
                  </View>

                  {isLoading ? (
                    <View className="items-center py-4">
                      <ActivityIndicator size="small" color="#1A293B" />
                    </View>
                  ) : recentSearches.length === 0 ? (
                    <View className="py-4">
                      <Text className="text-gray-500 text-center">
                        No recent shipments
                      </Text>
                    </View>
                  ) : (
                    recentSearches.map((item, index) => (
                      <Pressable
                        key={item.id}
                        onPress={() => handleRecentSearch(item.id)}
                        android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                      >
                        <View
                          className={`flex-row items-center justify-between ${
                            index !== recentSearches.length - 1
                              ? "pb-4 mb-4 border-b border-gray-100"
                              : ""
                          }`}
                        >
                          <View className="flex-row items-center flex-1">
                            <Image
                              source={require("@/assets/images/box-icon.png")}
                              className="w-10 h-10 mr-3"
                              resizeMode="contain"
                            />
                            <View>
                              <Text className="text-base font-semibold text-[#1A293B]">
                                {item.trackingNumber}
                              </Text>
                              <Text className="text-sm text-gray-500 mt-1">
                                {item.status} • {item.timeAgo}
                              </Text>
                            </View>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color="#9CA3AF"
                          />
                        </View>
                      </Pressable>
                    ))
                  )}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
