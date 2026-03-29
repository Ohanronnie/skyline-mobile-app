import { useDeleteWarehouse } from "@/hooks/useShipments";
import { getWarehouseDetails, Shipment } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatStatus = (status: string) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function WarehouseDetails() {
  const params = useLocalSearchParams();
  const warehouseId = params.id as string;
  const deleteWarehouseMutation = useDeleteWarehouse();

  const {
    data: warehouse,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["warehouse", warehouseId],
    queryFn: () => getWarehouseDetails(warehouseId),
    enabled: !!warehouseId,
  });

  // Get shipments from warehouse data (with defaults for hook order)
  const warehouseShipments: Shipment[] = warehouse?.shipments || [];
  const shipmentCount = warehouse?.shipmentCount ?? warehouseShipments.length;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!warehouse) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Warehouse not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalCapacity = warehouse.capacity || 0;
  const currentUtilization = warehouse.currentUtilization || 0;

  const handleDeleteWarehouse = () => {
    Alert.alert(
      "Delete warehouse",
      `Are you sure you want to delete "${warehouse.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteWarehouseMutation.mutate(warehouseId, {
              onSuccess: () => {
                router.back();
              },
              onError: (error: unknown) => {
                const err = error as {
                  response?: { data?: { message?: string } };
                  message?: string;
                };
                Alert.alert(
                  "Error",
                  err?.response?.data?.message ||
                    err?.message ||
                    "Failed to delete warehouse",
                );
              },
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <Pressable
          onPress={() => router.back()}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
          <Ionicons name="arrow-back" size={24} color="#1A293B" />
        </Pressable>
        <Text className="text-lg font-semibold text-[#1A293B]">
          Warehouse details
        </Text>
        <Pressable
          onPress={() => router.push("/notification")}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
          <Ionicons name="notifications-outline" size={24} color="#1A293B" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || isLoading}
            onRefresh={async () => {
              await refetch();
            }}
            tintColor="#1A293B"
            colors={["#1A293B"]}
          />
        }>
        <View className="px-4 pt-4">
          {/* Basic information */}
          <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
            <Text className="text-lg font-semibold text-[#1A293B] mb-4">
              Basic information
            </Text>

            {[
              { label: "Warehouse name", value: warehouse.name },
              {
                label: "Location",
                value:
                  warehouse.location.charAt(0).toUpperCase() +
                  warehouse.location.slice(1),
              },
              { label: "Address", value: warehouse.address || "N/A" },
              {
                label: "Status",
                value: warehouse.isActive ? "Active" : "Inactive",
              },
            ].map((item, index) => (
              <View
                key={item.label}
                className={`flex-row justify-between py-3 ${
                  index !== 3 ? "border-b border-gray-100" : ""
                }`}>
                <Text className="text-sm text-gray-500">{item.label}</Text>
                <Text className="text-sm font-semibold text-[#1A293B] text-right max-w-[60%]">
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Contact person box */}
          <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
            <Text className="text-lg font-semibold text-[#1A293B] mb-4">
              Contact person
            </Text>
            <View className="space-y-3">
              <View>
                <Text className="text-sm text-gray-500 mb-1">Name</Text>
                <Text className="text-sm font-semibold text-[#1A293B]">
                  {warehouse.contactPerson || "N/A"}
                </Text>
              </View>
              <View>
                <Text className="text-sm text-gray-500 mb-1">Phone</Text>
                <Text className="text-sm font-semibold text-[#1A293B]">
                  {warehouse.phone || "N/A"}
                </Text>
              </View>
            </View>
          </View>

          {/* Stat boxes */}
          <View className="flex-row justify-between mb-4">
            <View
              className="rounded-2xl p-4 items-start"
              style={{ width: "48%", backgroundColor: "#3D6DD64D" }}>
              <Text className="text-3xl font-bold text-[#0065EA]">
                {totalCapacity.toLocaleString()}
              </Text>
              <Text className="text-sm font-medium text-[#0065EA] mt-1">
                Total capacity
              </Text>
            </View>
            <View
              className="rounded-2xl p-4 items-start"
              style={{ width: "48%", backgroundColor: "#10B9814D" }}>
              <Text className="text-3xl font-bold text-[#10B981]">
                {currentUtilization.toLocaleString()}
              </Text>
              <Text className="text-sm font-medium text-[#10B981] mt-1">
                Current utilization
              </Text>
            </View>
          </View>

          {/* Additional stat box */}
          <View className="mb-4">
            <View
              className="rounded-2xl p-4 items-start"
              style={{ backgroundColor: "#F59E0B4D" }}>
              <Text className="text-3xl font-bold text-[#F59E0B]">
                {shipmentCount}
              </Text>
              <Text className="text-sm font-medium text-[#F59E0B] mt-1">
                Shipments
              </Text>
            </View>
          </View>

          {/* Shipments Section */}
          <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
            <Text className="text-lg font-semibold text-[#1A293B] mb-4">
              Shipments
            </Text>

            {/* Shipments List */}
            <View>
              <Text className="text-sm font-semibold text-[#1A293B] mb-3">
                Shipments ({warehouseShipments.length})
              </Text>
              {warehouseShipments.length === 0 ? (
                <Text className="text-sm text-gray-500 text-center py-4">
                  No shipments found
                </Text>
              ) : (
                warehouseShipments.map((shipment) => {
                  const customerName =
                    typeof shipment.customerId === "object"
                      ? shipment.customerId?.name
                      : "Unknown Customer";
                  const statusDisplay = formatStatus(shipment.status);
                  const getStatusColor = (status: string) => {
                    if (status.includes("Delivered")) return "green";
                    if (status.includes("Transit")) return "blue";
                    if (
                      status.includes("Warehouse") ||
                      status.includes("Received")
                    )
                      return "yellow";
                    return "gray";
                  };
                  const statusColor = getStatusColor(shipment.status);
                  const shipmentDate = shipment.receivedAt
                    ? new Date(shipment.receivedAt).toLocaleDateString()
                    : shipment.createdAt
                    ? new Date(shipment.createdAt).toLocaleDateString()
                    : "N/A";

                  return (
                    <Pressable
                      key={shipment._id}
                      onPress={() =>
                        router.push(
                          `/shipment-details?id=${shipment._id}`
                        )
                      }
                      android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                      className="bg-gray-50 rounded-xl p-4 mb-3">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <View className="flex-row items-center mb-2 flex-wrap">
                            <Text className="text-base font-semibold text-[#1A293B] mr-2">
                              {shipment.trackingNumber}
                            </Text>
                            <View
                              className={`rounded-full px-2 py-1 ${
                                statusColor === "green"
                                  ? "bg-green-100"
                                  : statusColor === "blue"
                                  ? "bg-blue-100"
                                  : statusColor === "yellow"
                                  ? "bg-yellow-100"
                                  : "bg-gray-100"
                              }`}>
                              <Text
                                className={`text-xs font-medium ${
                                  statusColor === "green"
                                    ? "text-green-700"
                                    : statusColor === "blue"
                                    ? "text-blue-700"
                                    : statusColor === "yellow"
                                    ? "text-yellow-700"
                                    : "text-gray-700"
                                }`}>
                                {statusDisplay}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-sm text-gray-600 mb-1">
                            {customerName}
                          </Text>
                          {typeof shipment.customerId === "object" &&
                            shipment.customerId?.location && (
                              <View className="flex-row items-center mb-1">
                                <Ionicons
                                  name="location-outline"
                                  size={14}
                                  color="#6B7280"
                                  style={{ marginRight: 6 }}
                                />
                                <Text className="text-sm text-gray-600">
                                  {shipment.customerId.location}
                                </Text>
                              </View>
                            )}
                          <View className="flex-row items-center">
                            <Ionicons
                              name="calendar-outline"
                              size={14}
                              color="#6B7280"
                              style={{ marginRight: 6 }}
                            />
                            <Text className="text-sm text-gray-600">
                              {shipmentDate}
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
                  );
                })
              )}
            </View>
          </View>

          <Pressable
            onPress={handleDeleteWarehouse}
            disabled={deleteWarehouseMutation.isPending}
            android_ripple={{ color: "rgba(0,0,0,0.06)" }}
            className="mt-2 mb-6">
            <View className="rounded-2xl py-4 items-center border border-red-200 bg-red-50">
              {deleteWarehouseMutation.isPending ? (
                <ActivityIndicator color="#B91C1C" />
              ) : (
                <Text className="text-base font-semibold text-red-700">
                  Delete warehouse
                </Text>
              )}
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
