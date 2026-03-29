import { Box } from "@/components/ui/box";
import { useAuth } from "@/contexts/AuthContext";
import { useShipments } from "@/hooks/useShipments";
import { Shipment, ShipmentStatus } from "@/lib/api";
import { getShipmentProgressPercentage, getShipmentStatusColor } from "@/lib/shipment";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function CustomerShipments() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: shipmentsData, isLoading, refetch } = useShipments();

  const shipments =
    shipmentsData?.pages
      .flatMap((page: any) => (page && page.data ? page.data : page))
      .filter(Boolean) || [];

  const activeShipments =
    shipments?.filter((s: Shipment) => s.status !== ShipmentStatus.DELIVERED)
      .length || 0;

  const deliveredShipments =
    shipments?.filter((s: Shipment) => s.status === ShipmentStatus.DELIVERED)
      .length || 0;

  const getStatusColor = (status: ShipmentStatus) => {
    switch (status) {
      case ShipmentStatus.DELIVERED:
        return "bg-green-100 text-green-600";
      case ShipmentStatus.IN_TRANSIT:
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-blue-100 text-blue-600";
    }
  };

  const getStatusText = (status: ShipmentStatus) => {
    return status.replace(/_/g, " ").toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <StatusBar style="light" />
      <View className="flex-1 bg-gray-50">
        <View
          className="px-6"
          style={{
            backgroundColor: "#1A293B",
            borderBottomWidth: 1,
            borderBottomColor: "#E5E5E5",
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            paddingTop: insets.top + 20,
            paddingBottom: 30,
          }}
        >
          <Text className="text-3xl font-bold text-white mb-2">
            HI, {user?.name || "Customer"}
          </Text>
          <Text className="text-white/80 text-xl">{user?.phone || ""}</Text>
        </View>
        <SafeAreaView className="flex-1" edges={["bottom", "left", "right"]}>
          <ScrollView
            className="flex-1 px-6 pt-6"
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            }
          >
            {/* Stats Row */}
            <View className="flex-row gap-4  mb-6">
              <Box className="flex-1 mr-2 bg-white rounded-xl p-4 border border-gray-200">
                <Text className="text-gray-600 text-sm mb-1">Active</Text>
                <Text className="text-2xl font-bold text-[#1A293B]">
                  {activeShipments}
                </Text>
              </Box>
              <Box className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
                <Text className="text-gray-600 text-sm mb-1">Delivered</Text>
                <Text className="text-2xl font-bold text-[#1A293B]">
                  {deliveredShipments}
                </Text>
              </Box>
            </View>

            {/* Your Shipments Section */}
            <Text className="text-xl font-bold text-[#1A293B] mb-4">
              Your shipments
            </Text>

            {isLoading && !shipmentsData ? (
              <ActivityIndicator size="large" color="#1A293B" />
            ) : shipments.length > 0 ? (
              shipments.map((shipment: Shipment) => (
                <Pressable
                  key={shipment._id}
                  onPress={() =>
                    router.push({
                      pathname: "/(customer)/shipment-details",
                      params: { id: shipment._id },
                    })
                  }
                  android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                >
                  <Box className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-base font-semibold text-[#1A293B]">
                        {shipment.trackingNumber}
                      </Text>
                      <View
                        className={`px-3 py-1 rounded-full ${getStatusColor(shipment.status).split(" ")[0]}`}
                      >
                        <Text
                          className={`text-xs font-semibold ${getStatusColor(shipment.status).split(" ")[1]}`}
                        >
                          {getStatusText(shipment.status)}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View className="mb-3">
                      <View
                        className="bg-gray-200 rounded-full overflow-hidden"
                        style={{ height: 3 }}
                      >
                        <View
                          className={`h-full rounded-full ${getShipmentStatusColor(shipment.status)}`}
                          style={{
                            width: getShipmentProgressPercentage(shipment.status) as any,
                          }}
                        />
                      </View>
                    </View>

                    {/* Date */}
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={16} color="#6B7280" />
                      <Text className="text-gray-600 text-sm ml-2">
                        {formatDate(shipment.createdAt)}
                      </Text>
                    </View>
                  </Box>
                </Pressable>
              ))
            ) : (
              <Text className="text-gray-500 text-center mt-4">
                No shipments found
              </Text>
            )}

            <View className="h-20" />
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
  );
}
