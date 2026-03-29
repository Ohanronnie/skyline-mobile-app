import { ShipmentCard } from "@/components/partners/ShipmentCard";
import { Box } from "@/components/ui/box";
import { useRequireAuth } from "@/contexts/AuthContext";
import { usePartnerShipments } from "@/hooks/useShipments";
import { Shipment } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FILTERS = ["All", "Pending assignment", "Assigned"];

export default function PartnersShipmentsScreen() {
  useRequireAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: shipmentsData,
    isLoading,
    error,
    refetch,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = usePartnerShipments(debouncedSearch);

  const shipments =
    shipmentsData?.pages
      ?.flatMap((page: any) => (page && page.data ? page.data : page))
      .filter(Boolean) || [];

  const filteredShipments = useMemo(() => {
    if (!shipments) return [];

    return shipments.filter((shipment: Shipment) => {
      // Search is handled by server, but we still need activeFilter
      if (activeFilter === "All") return true;

      // Map backend status to partner UI status
      const hasCustomer = !!shipment.customerId;
      if (activeFilter === "Assigned" && hasCustomer) return true;
      if (activeFilter === "Pending assignment" && !hasCustomer) return true;

      return false;
    });
  }, [shipments, activeFilter]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A293B" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-[#1A293B]">Shipments</Text>
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

      <FlatList
        data={filteredShipments}
        keyExtractor={(item) => item._id}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#1A293B"
            colors={["#1A293B"]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Search */}
            <View className="px-6 mt-6">
              <View className="bg-white rounded-xl px-4 py-3 flex-row items-center border border-gray-200">
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-2 text-base text-gray-900"
                  placeholder="Search shipments..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 24,
                gap: 12,
                marginTop: 24,
                paddingBottom: 24,
              }}
            >
              {FILTERS.map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    onPress={() => setActiveFilter(filter)}
                    className={`px-5 py-2 rounded-full border ${
                      isActive
                        ? "bg-[#1A293B] border-[#1A293B]"
                        : "bg-transparent border-gray-300"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        isActive ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {isLoading && (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#1A293B" />
                <Text className="text-gray-500 mt-4">Loading shipments...</Text>
              </View>
            )}

            {error && (
              <View className="py-8 items-center">
                <Text className="text-red-500">Failed to load shipments</Text>
                <Text className="text-red-400 text-sm mt-2">
                  {(error as any)?.response?.data?.message ||
                    (error as Error)?.message ||
                    "Unknown error"}
                </Text>
              </View>
            )}

            {!isLoading && !error && filteredShipments.length === 0 && (
              <View className="py-8 items-center">
                <Text className="text-gray-500">No shipments found</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item: shipment }) => {
          const customerName =
            typeof shipment.customerId === "object"
              ? shipment.customerId?.name
              : undefined;
          const status: "Assigned" | "Pending assignment" = customerName
            ? "Assigned"
            : "Pending assignment";

          return (
            <View className="px-6 mb-4">
              <ShipmentCard
                key={shipment._id}
                shipmentNumber={shipment.trackingNumber}
                date={new Date(shipment.createdAt).toLocaleDateString()}
                containerNumber={
                  typeof shipment.containerId === "object"
                    ? shipment.containerId?.containerNumber
                    : shipment.containerId || "N/A"
                }
                customerName={customerName}
                status={status}
                onViewDetails={() =>
                  router.push({
                    pathname: "/(partners)/shipment-details",
                    params: { shipmentId: shipment.trackingNumber },
                  })
                }
                onAction={() =>
                  router.push({
                    pathname: "/(partners)/assign-customer",
                    params: {
                      shipmentId: shipment._id,
                      trackingNumber: shipment.trackingNumber,
                    },
                  })
                }
              />
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
