import { AddContainerModal } from "@/components/add-container-modal";
import { Input, InputField } from "@/components/ui/input";
import { useContainers } from "@/hooks/useShipments";
import { Container, ContainerStatus, deleteContainer } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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

const filterOptions = [
  "All containers",
  ...Object.values(ContainerStatus).map(formatStatus),
];

export default function Containers() {
  const [selectedFilter, setSelectedFilter] = useState("All containers");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContainer, setEditingContainer] = useState<Container | null>(
    null,
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: containersData,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useContainers(debouncedSearch);

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteContainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["containers"] });
      Alert.alert("Success", "Container deleted successfully");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete container";
      Alert.alert("Error", errorMessage);
    },
  });

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Container",
      "Are you sure you want to delete this container? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(id),
        },
      ],
    );
  };

  const allContainers =
    containersData?.pages
      .flatMap((page: any) => (page && page.data ? page.data : page))
      .filter(Boolean) || [];

  const containerStats = useMemo(() => {
    const total = allContainers.length;
    const loading = allContainers.filter(
      (c: Container) => c.status === ContainerStatus.LOADING,
    ).length;
    const registered = allContainers.filter(
      (c: Container) => c.status === ContainerStatus.REGISTERED,
    ).length;

    return [
      { label: "Total", value: total },
      { label: "Loading", value: loading },
      { label: "Registered", value: registered },
    ];
  }, [allContainers]);

  const filteredContainers = useMemo(() => {
    return allContainers.filter((container: Container) => {
      if (!container) return false;
      const matchesFilter =
        selectedFilter === "All containers" ||
        formatStatus(container.status) === selectedFilter;

      return matchesFilter;
    });
  }, [allContainers, selectedFilter]);

  const handleOpenAdd = () => {
    setEditingContainer(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (container: Container) => {
    setEditingContainer(container);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingContainer(null);
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
        <Text className="text-lg font-semibold text-[#1A293B]">Containers</Text>
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

      <FlatList
        data={filteredContainers}
        keyExtractor={(item: Container) => item._id}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator size="small" color="#1A293B" />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#1A293B"
            colors={["#1A293B"]}
          />
        }
        renderItem={({ item: container }: { item: Container }) => (
          <View className="px-4 mb-4">
            <View className="bg-white rounded-2xl border border-gray-100 p-4">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <Image
                    source={require("@/assets/images/box-icon.png")}
                    className="w-8 h-8 mr-3"
                    resizeMode="contain"
                  />
                  <View>
                    <Text className="text-lg font-semibold text-[#1A293B]">
                      {container.containerNumber}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {container.sizeType || "N/A"}
                    </Text>
                  </View>
                </View>
                <View className="bg-orange-100 rounded-lg px-3 py-1">
                  <Text className="text-xs font-semibold text-orange-700">
                    {formatStatus(container.status)}
                  </Text>
                </View>
              </View>

              <View className="mb-3">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-500">Vessel</Text>
                  <Text className="text-sm font-semibold text-[#1A293B]">
                    {container.vesselName || "N/A"}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-500">ETA Ghana</Text>
                  <Text className="text-sm font-semibold text-[#1A293B]">
                    {container.etaGhana
                      ? new Date(container.etaGhana).toLocaleDateString()
                      : "N/A"}
                  </Text>
                </View>

                {/* Partners & Customers Summary */}
                {(container.partnerIds?.length || 0) > 0 && (
                  <View className="flex-row items-center mt-2 flex-wrap">
                    <Ionicons
                      name="business-outline"
                      size={14}
                      color="#10b981"
                    />
                    <Text className="text-xs text-green-700 font-medium ml-1">
                      {container.partnerIds
                        ?.map((p: any) =>
                          typeof p === "string" ? "Partner" : p.name,
                        )
                        .join(", ")}
                    </Text>
                  </View>
                )}
                {(container.customerIds?.length || 0) > 0 && (
                  <View className="flex-row items-center mt-1 flex-wrap">
                    <Ionicons name="people-outline" size={14} color="#3b82f6" />
                    <Text className="text-xs text-blue-700 font-medium ml-1">
                      {container.customerIds
                        ?.map((c: any) =>
                          typeof c === "string" ? "Customer" : c.name,
                        )
                        .join(", ")}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row gap-2 flex-wrap">
                <Pressable
                  onPress={() =>
                    router.push(`/container-details?id=${container._id}`)
                  }
                  android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                  className="flex-1 min-w-[30%]"
                >
                  <View className="bg-[#1A293B] rounded-full px-3 py-2 items-center">
                    <Text className="text-sm font-semibold text-white">
                      View
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => handleOpenEdit(container)}
                  android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                  className="flex-1 min-w-[30%]"
                >
                  <View className="bg-[#E5E7EB] rounded-full px-3 py-2 items-center">
                    <Text className="text-sm font-semibold text-[#1A293B]">
                      Edit
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(container._id)}
                  android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                  className="flex-1 min-w-[30%]"
                >
                  <View className="bg-[#FF12124D] rounded-full px-3 py-2 items-center">
                    <Text className="text-sm font-semibold text-red-500">
                      Delete
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        )}
        ListHeaderComponent={
          <View className="px-4 pt-6">
            {/* Stats */}
            <View className="flex-row justify-between mb-6">
              {containerStats.map((stat) => (
                <View
                  key={stat.label}
                  className="bg-white rounded-2xl border border-gray-100 p-4 items-center"
                  style={{ width: "32%" }}
                >
                  <Text className="text-2xl font-bold text-primary-blue">
                    {stat.value}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Search */}
            <Text className="text-sm font-medium text-[#1A293B] mb-2">
              Search containers
            </Text>
            <Input>
              <InputField
                placeholder="Search by ID or location"
                placeholderTextColor="#9CA3AF"
                className="text-[#1A293B]"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </Input>

            {/* Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-6 mb-6"
              contentContainerStyle={{ gap: 8 }}
            >
              {filterOptions.map((option) => {
                const isSelected = selectedFilter === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setSelectedFilter(option)}
                    android_ripple={{ color: "rgba(255,255,255,0.1)" }}
                  >
                    <View
                      className={`px-4 py-2 rounded-full border ${
                        isSelected
                          ? "bg-[#1A293B] border-[#1A293B]"
                          : "bg-transparent border-[#1A293B]"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          isSelected ? "text-white" : "text-[#1A293B]"
                        }`}
                      >
                        {option}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Add button */}
            <Pressable
              onPress={handleOpenAdd}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}
              className="mb-6 self-end"
            >
              <View className="bg-[#1A293B] rounded-full px-4 py-2.5 flex-row items-center">
                <Ionicons name="add" size={18} color="white" />
                <Text className="text-white font-semibold text-sm ml-2">
                  Add container
                </Text>
              </View>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <Text className="text-center text-gray-500 mt-10">
              No containers found
            </Text>
          ) : (
            <ActivityIndicator size="large" color="#1A293B" className="mt-10" />
          )
        }
      />

      <AddContainerModal
        visible={showAddModal}
        onClose={handleCloseModal}
        containerId={editingContainer?._id}
        initialData={
          editingContainer
            ? {
                containerNumber: editingContainer.containerNumber,
                sizeType: editingContainer.sizeType,
                vesselName: editingContainer.vesselName,
                status: editingContainer.status,
                departureDate: editingContainer.departureDate,
                etaGhana: editingContainer.etaGhana,
                arrivalDate: editingContainer.arrivalDate,
                currentLocation: editingContainer.currentLocation,
                customerIds: editingContainer.customerIds as any,
                partnerIds: editingContainer.partnerIds as any,
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}
