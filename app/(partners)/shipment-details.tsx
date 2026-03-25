import { Box } from "@/components/ui/box";
import { useRequireAuth } from "@/contexts/AuthContext";
import {
    useContainers,
    useShipmentDetails,
    useShipments,
    useWarehouses,
} from "@/hooks/useShipments";
import { Container, Shipment, Warehouse } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row justify-between py-3 border-b border-gray-100 last:border-0">
    <Text className="text-gray-500 flex-1">{label}</Text>
    <Text className="text-gray-900 font-medium flex-1 text-right">{value}</Text>
  </View>
);

const formatStatus = (status: string) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function ShipmentDetailsScreen() {
  useRequireAuth();
  const { shipmentId } = useLocalSearchParams<{ shipmentId: string }>();

  // Note: shipmentId is actually trackingNumber based on how it's passed from shipments screen
  // First, try to find the shipment from the list by tracking number
  const { data: shipmentsData } = useShipments();
  const shipments =
    shipmentsData?.pages
      ?.flatMap((page: any) => (page && page.data ? page.data : page))
      .filter(Boolean) || [];

  const shipmentFromList = shipments.find(
    (s: Shipment) => s.trackingNumber === shipmentId,
  );

  // If found, use its _id to get full details, otherwise try using shipmentId as is
  const shipmentIdToUse = shipmentFromList?._id || shipmentId || "";
  const {
    data: shipment,
    isLoading,
    error,
  } = useShipmentDetails(shipmentIdToUse);
  const { data: containersData } = useContainers();
  const containers =
    containersData?.pages
      ?.flatMap((page: any) => (page && page.data ? page.data : page))
      .filter(Boolean) || [];
  const { data: warehouses = [] } = useWarehouses();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1A293B" />
          <Text className="text-gray-500 mt-4">
            Loading shipment details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !shipment) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-500">Failed to load shipment</Text>
          <Text className="text-red-400 text-sm mt-2">
            {(error as any)?.response?.data?.message ||
              (error as Error)?.message ||
              "Shipment not found"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const shipmentData = shipment as Shipment;

  // Handle containerId - can be string or populated object
  const containerIdString =
    typeof shipmentData.containerId === "object"
      ? shipmentData.containerId._id
      : shipmentData.containerId;

  const container = containers.find(
    (c: Container) =>
      c._id === containerIdString || c.containerNumber === containerIdString,
  );

  // Get container number from populated object or container lookup
  const containerNumber =
    typeof shipmentData.containerId === "object"
      ? shipmentData.containerId.containerNumber
      : container?.containerNumber || shipmentData.containerId || "N/A";
  const originWarehouse = warehouses.find(
    (w: Warehouse) => w._id === shipmentData.originWarehouseId,
  );
  const currentWarehouse = warehouses.find(
    (w: Warehouse) => w._id === shipmentData.currentWarehouseId,
  );

  const customerName =
    typeof shipmentData.customerId === "object"
      ? shipmentData.customerId?.name
      : "Not assigned";

  const customerPhone =
    typeof shipmentData.customerId === "object"
      ? shipmentData.customerId?.phone
      : "";

  const customerEmail =
    typeof shipmentData.customerId === "object"
      ? shipmentData.customerId?.email
      : "";

  const customerLocation =
    typeof shipmentData.customerId === "object"
      ? shipmentData.customerId?.location
      : "";

  // Get status display
  const statusDisplay = formatStatus(shipmentData.status);
  const isInTransit =
    shipmentData.status?.includes("TRANSIT") ||
    shipmentData.status?.includes("LOADED");
  const isDelivered = shipmentData.status?.includes("DELIVERED");
  const isReceived = shipmentData.status?.includes("RECEIVED");

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A293B" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-[#1A293B]">
          {shipmentData.trackingNumber || shipmentId || "Shipment"}
        </Text>
        <Pressable
          onPress={() => router.push("/(partners)/notification")}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}
        >
          <Box className="p-2 bg-gray-50 rounded-full">
            <Image
              source={require("@/assets/images/notification-icon.png")}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </Box>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="pb-8 px-6 pt-6">
        {/* Status Box */}
        <Box className="bg-white p-4 rounded-xl mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <View
              className={`px-3 py-1 rounded-full ${
                isDelivered
                  ? "bg-green-100"
                  : isReceived
                    ? "bg-blue-100"
                    : isInTransit
                      ? "bg-yellow-100"
                      : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  isDelivered
                    ? "text-green-800"
                    : isReceived
                      ? "text-blue-800"
                      : isInTransit
                        ? "text-yellow-800"
                        : "text-gray-800"
                }`}
              >
                {statusDisplay}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(partners)/shipment-timeline",
                  params: { trackingNumber: shipmentData.trackingNumber },
                })
              }
            >
              <Text className="text-primary-blue font-medium">
                View timeline
              </Text>
            </TouchableOpacity>
          </View>

          {currentWarehouse && (
            <>
              <View className="flex-row items-center mb-2">
                <Ionicons name="location-outline" size={20} color="#6B7280" />
                <Text className="ml-2 text-gray-900 font-medium">
                  {currentWarehouse.name}
                </Text>
              </View>
              {shipmentData.deliveredAt && (
                <Text className="text-gray-500 text-sm ml-7">
                  Delivered:{" "}
                  {new Date(shipmentData.deliveredAt).toLocaleDateString()}
                </Text>
              )}
            </>
          )}
        </Box>

        {/* Shipment Details Box */}
        <Box className="bg-white p-4 rounded-xl mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Shipment Details
          </Text>
          <DetailRow
            label="Organization"
            value={shipmentData.organization || "N/A"}
          />
          <DetailRow
            label="Tracking number"
            value={shipmentData.trackingNumber}
          />
          <DetailRow label="Status" value={statusDisplay} />
          <DetailRow label="Container" value={containerNumber} />
          <DetailRow
            label="Origin warehouse"
            value={
              originWarehouse?.name || shipmentData.originWarehouseId || "N/A"
            }
          />
          <DetailRow
            label="Created at"
            value={
              shipmentData.createdAt
                ? new Date(shipmentData.createdAt).toLocaleDateString()
                : "N/A"
            }
          />
          <DetailRow
            label="Current warehouse"
            value={
              currentWarehouse?.name || shipmentData.currentWarehouseId || "N/A"
            }
          />
          {shipmentData.description && (
            <DetailRow label="Description" value={shipmentData.description} />
          )}
          {shipmentData.cbm && (
            <DetailRow label="CBM" value={shipmentData.cbm.toString()} />
          )}
          {shipmentData.quantity && (
            <DetailRow
              label="Quantity"
              value={shipmentData.quantity.toString()}
            />
          )}
        </Box>

        {/* Customer Details Box */}
        {customerName && customerName !== "Not assigned" && (
          <Box className="bg-white p-4 rounded-xl mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Customer Details
            </Text>
            <Text className="text-xl font-bold text-gray-900 mb-4">
              {customerName}
            </Text>
            <View className="space-y-3">
              {customerPhone && (
                <View className="flex-row items-center">
                  <Ionicons name="call-outline" size={20} color="#6B7280" />
                  <Text className="ml-3 text-gray-600">{customerPhone}</Text>
                </View>
              )}
              {customerEmail && (
                <View className="flex-row items-center">
                  <Ionicons name="mail-outline" size={20} color="#6B7280" />
                  <Text className="ml-3 text-gray-600">{customerEmail}</Text>
                </View>
              )}
              {customerLocation && (
                <View className="flex-row items-center">
                  <Ionicons name="location-outline" size={20} color="#6B7280" />
                  <Text className="ml-3 text-gray-600">{customerLocation}</Text>
                </View>
              )}
            </View>
          </Box>
        )}

        {/* SMS Notification Box - Placeholder for future implementation */}
        <Box className="bg-white p-4 rounded-xl mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">
              SMS notification
            </Text>
            <TouchableOpacity>
              <Text className="text-primary-blue font-medium">Send SMS</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-gray-500 text-sm">
            No notifications sent yet
          </Text>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
