import {
  useContainers,
  useShipmentDetails,
  useWarehouses,
} from "@/hooks/useShipments";
import { Container, Warehouse } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ShipmentDetails() {
  const params = useLocalSearchParams();
  const shipmentId = params.id as string;

  const {
    data: shipment,
    isLoading: isLoadingShipment,
    error: shipmentError,
    refetch,
    isRefetching,
  } = useShipmentDetails(shipmentId);

  const { data: containersData } = useContainers();
  const containers =
    containersData?.pages
      .flatMap((page: any) => (page && page.data ? page.data : page))
      .filter(Boolean) || [];
  const { data: warehouses = [] } = useWarehouses();

  // Extract customers and partners from shipment
  const shipmentCustomers = useMemo(() => {
    if (!shipment) return [];
    // Priority 1: customerIds array (populated objects)
    if (shipment.customerIds && shipment.customerIds.length > 0) {
      return shipment.customerIds.filter(
        (c: any) => typeof c === "object",
      ) as any[];
    }
    // Priority 2: single customerId (populated object)
    if (shipment.customerId && typeof shipment.customerId === "object") {
      return [shipment.customerId];
    }
    return [];
  }, [shipment]);

  const shipmentPartners = useMemo(() => {
    if (!shipment) return [];
    // Priority 1: partnerIds array (populated objects)
    if (shipment.partnerIds && shipment.partnerIds.length > 0) {
      return shipment.partnerIds.filter(
        (p: any) => typeof p === "object",
      ) as any[];
    }
    // Priority 2: single partnerId (populated object)
    if (shipment.partnerId && typeof shipment.partnerId === "object") {
      return [shipment.partnerId];
    }
    return [];
  }, [shipment]);

  if (!shipment) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Shipment not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Handle containerId - can be string or populated object
  const containerIdString =
    typeof shipment.containerId === "object"
      ? shipment.containerId._id
      : shipment.containerId;
  const container = containers.find(
    (c: Container) => c._id === containerIdString,
  );
  const originWarehouse = warehouses.find(
    (w: Warehouse) => w._id === shipment.originWarehouseId,
  );
  const currentWarehouse = warehouses.find(
    (w: Warehouse) => w._id === shipment.currentWarehouseId,
  );

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <Pressable
          onPress={() => router.back()}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}
        >
          <Ionicons name="arrow-back" size={24} color="#1A293B" />
        </Pressable>
        <Text className="text-lg font-semibold text-[#1A293B]">
          Shipment details
        </Text>
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

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#1A293B"
            colors={["#1A293B"]}
          />
        }
      >
        <View className="px-4 pt-4">
          {/* Basic information */}
          <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
            <Text className="text-lg font-semibold text-[#1A293B] mb-4">
              Basic information
            </Text>

            {[
              {
                label: "Tracking number",
                value: shipment.trackingNumber,
              },
              {
                label: "Status",
                value: formatStatus(shipment.status),
              },
              {
                label: "Container",
                value:
                  typeof shipment.containerId === "object"
                    ? shipment.containerId.containerNumber
                    : container?.containerNumber ||
                      shipment.containerId ||
                      "N/A",
              },
              {
                label: "Origin warehouse",
                value:
                  originWarehouse?.name || shipment.originWarehouseId || "N/A",
              },
              {
                label: "Current warehouse",
                value:
                  currentWarehouse?.name ||
                  shipment.currentWarehouseId ||
                  "N/A",
              },
              {
                label: "Created at",
                value: new Date(shipment.createdAt).toLocaleDateString(),
              },
            ].map((item, index) => (
              <View
                key={item.label}
                className={`flex-row justify-between py-3 ${
                  index !== 5 ? "border-b border-gray-100" : ""
                }`}
              >
                <Text className="text-sm text-gray-500">{item.label}</Text>
                <Text className="text-sm font-semibold text-[#1A293B] text-right max-w-[60%]">
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Description */}
          {shipment.description && (
            <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
              <Text className="text-lg font-semibold text-[#1A293B] mb-4">
                Description
              </Text>
              <Text className="text-sm font-semibold text-[#1A293B]">
                {shipment.description}
              </Text>
            </View>
          )}

          {/* Customers Section */}
          <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
            <Text className="text-lg font-semibold text-[#1A293B] mb-4">
              Customers ({shipmentCustomers.length})
            </Text>
            {shipmentCustomers.length === 0 ? (
              <Text className="text-sm text-gray-500 text-center py-2">
                No customers assigned
              </Text>
            ) : (
              shipmentCustomers.map((customer, index) => (
                <View
                  key={customer._id || index}
                  className={`py-3 ${index !== shipmentCustomers.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <Text className="text-sm font-semibold text-[#1A293B] mb-1">
                    {customer.name || "Unknown"}
                  </Text>
                  {customer.email && (
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="mail-outline" size={14} color="#6B7280" />
                      <Text className="text-xs text-gray-600 ml-1">
                        {customer.email}
                      </Text>
                    </View>
                  )}
                  {customer.phone && (
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="call-outline" size={14} color="#6B7280" />
                      <Text className="text-xs text-gray-600 ml-1">
                        {customer.phone}
                      </Text>
                    </View>
                  )}
                  {customer.location && (
                    <View className="flex-row items-center mt-1">
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color="#6B7280"
                      />
                      <Text className="text-xs text-gray-600 ml-1">
                        {customer.location}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Partners Section */}
          {shipmentPartners.length > 0 && (
            <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
              <Text className="text-lg font-semibold text-[#1A293B] mb-4">
                Partners ({shipmentPartners.length})
              </Text>
              {shipmentPartners.map((partner, index) => (
                <View
                  key={partner._id || index}
                  className={`py-3 ${index !== shipmentPartners.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <Text className="text-sm font-semibold text-[#1A293B] mb-1">
                    {partner.name || "Unknown"}
                  </Text>
                  {partner.email && (
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="mail-outline" size={14} color="#6B7280" />
                      <Text className="text-xs text-gray-600 ml-1">
                        {partner.email}
                      </Text>
                    </View>
                  )}
                  {partner.phone && (
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="call-outline" size={14} color="#6B7280" />
                      <Text className="text-xs text-gray-600 ml-1">
                        {partner.phone}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Additional details */}
          {(shipment.cbm || shipment.quantity || shipment.receivedQuantity) && (
            <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
              <Text className="text-lg font-semibold text-[#1A293B] mb-4">
                Additional details
              </Text>
              <View className="space-y-3">
                {shipment.cbm && (
                  <View>
                    <Text className="text-sm text-gray-500 mb-1">CBM</Text>
                    <Text className="text-sm font-semibold text-[#1A293B]">
                      {shipment.cbm}
                    </Text>
                  </View>
                )}
                {shipment.quantity && (
                  <View>
                    <Text className="text-sm text-gray-500 mb-1">Quantity</Text>
                    <Text className="text-sm font-semibold text-[#1A293B]">
                      {shipment.quantity}
                    </Text>
                  </View>
                )}
                {shipment.receivedQuantity && (
                  <View>
                    <Text className="text-sm text-gray-500 mb-1">
                      Received quantity
                    </Text>
                    <Text className="text-sm font-semibold text-[#1A293B]">
                      {shipment.receivedQuantity}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Timeline button */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/shipment-timeline",
                params: { trackingNumber: shipment.trackingNumber },
              })
            }
            android_ripple={{ color: "rgba(0,0,0,0.1)" }}
            className="mb-4"
          >
            <View className="bg-[#1A293B] rounded-2xl p-4 flex-row items-center justify-center">
              <Ionicons name="time-outline" size={20} color="white" />
              <Text className="text-white font-semibold text-base ml-2">
                View timeline
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
