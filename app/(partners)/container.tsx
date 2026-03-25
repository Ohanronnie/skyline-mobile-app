import { ContainerCard } from "@/components/partners/ContainerCard";
import { Box } from "@/components/ui/box";
import { useAuth, useRequireAuth } from "@/contexts/AuthContext";
import { useContainers } from "@/hooks/useShipments";
import { Container, ContainerStatus } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Map ContainerStatus enum to display status
const mapStatusToDisplay = (
  status: ContainerStatus,
): "Delivered" | "Loading" | "In Transit" | "Pending" => {
  switch (status) {
    case ContainerStatus.DELIVERED:
      return "Delivered";
    case ContainerStatus.LOADING:
      return "Loading";
    case ContainerStatus.IN_TRANSIT:
    case ContainerStatus.SENDING:
      return "In Transit";
    default:
      return "Pending";
  }
};

export default function PartnersContainerScreen() {
  useRequireAuth();
  const { user } = useAuth();
  const {
    data: containersData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useContainers();

  const containers =
    containersData?.pages
      ?.flatMap((page: any) => (page && page.data ? page.data : page))
      .filter(Boolean) || [];

  const [searchQuery, setSearchQuery] = useState("");

  const filteredContainers = useMemo(() => {
    if (!containers) return [];

    return containers.filter((container: Container) => {
      const matchesSearch =
        container.containerNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        container.vesselName?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [containers, searchQuery]);

  // Get customer names from customerIds or customerId
  const getCustomerName = (container: Container): string | undefined => {
    // Priority 1: Use customerIds array
    if (container.customerIds && container.customerIds.length > 0) {
      return container.customerIds
        .map((c) => (typeof c === "string" ? "Customer" : c.name))
        .join(", ");
    }

    // Priority 2: Use single customerId property
    if (!container.customerId) return undefined;
    if (typeof container.customerId === "string") {
      const customer = container.customers?.find(
        (c) => c._id === container.customerId,
      );
      return customer?.name;
    }
    return container.customerId.name;
  };

  // Get shipment count from container or calculate from shipments array
  const getShipmentCount = (container: Container): number => {
    return container.shipmentCount ?? container.shipments?.length ?? 0;
  };
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <Text className="text-lg font-bold text-[#1A293B]">
          {user?.name || "Partner"}
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

      <ScrollView
        contentContainerClassName="pb-24 px-6 pt-6"
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
        {/* Total Containers Box */}
        <Box className="bg-white p-6 rounded-xl mb-6 items-center justify-center">
          <Text className="text-4xl font-bold text-primary-blue mb-1">
            {containers.length}
          </Text>
          <Text className="text-gray-500 font-medium">Total containers</Text>
        </Box>

        {/* Search Input */}
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-gray-900"
            placeholder="Search container..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Container List */}
        <View>
          {isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#1A293B" />
              <Text className="text-gray-500 mt-4">Loading containers...</Text>
            </View>
          ) : error ? (
            <View className="py-8 items-center">
              <Text className="text-red-500">Failed to load containers</Text>
              <Text className="text-red-400 text-sm mt-2">
                {(error as any)?.response?.data?.message ||
                  (error as Error)?.message ||
                  "Unknown error"}
              </Text>
            </View>
          ) : filteredContainers.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-gray-500">No containers found</Text>
            </View>
          ) : (
            filteredContainers.map((container: Container) => {
              const customerName = getCustomerName(container);
              const shipmentCount = getShipmentCount(container);
              const displayStatus = mapStatusToDisplay(container.status);
              return (
                <ContainerCard
                  key={container._id}
                  containerNumber={container.containerNumber}
                  status={displayStatus}
                  type={container.sizeType || "N/A"}
                  vessel={container.vesselName || "N/A"}
                  eta={
                    container.etaGhana
                      ? new Date(container.etaGhana).toLocaleDateString()
                      : "N/A"
                  }
                  customerName={customerName}
                  customerStatus={customerName ? "Assigned" : undefined}
                  shipmentCount={shipmentCount}
                  onViewDetails={() =>
                    router.push({
                      pathname: "/(partners)/container-details",
                      params: { id: container._id },
                    })
                  }
                  onNotify={() => console.log("Notify", container._id)}
                  onAssignCustomer={() =>
                    router.push({
                      pathname: "/(partners)/assign-customer",
                      params: { containerId: container._id },
                    })
                  }
                />
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
