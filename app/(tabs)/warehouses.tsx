import { AddWarehouseModal } from "@/components/add-warehouse-modal";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { useDeleteWarehouse } from "@/hooks/useShipments";
import { getWarehouses, Warehouse } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Warehouses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null
  );

  const deleteWarehouseMutation = useDeleteWarehouse();

  const {
    data: warehouses = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["warehouses"],
    queryFn: getWarehouses,
  });

  const handleDeleteWarehouse = (warehouse: Warehouse) => {
    Alert.alert(
      "Delete warehouse",
      `Are you sure you want to delete "${warehouse.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteWarehouseMutation.mutate(warehouse._id, {
              onError: (error: unknown) => {
                const err = error as { response?: { data?: { message?: string } }; message?: string };
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

  const warehouseStats = useMemo(() => {
    const total = warehouses.length;
    const active = warehouses.filter((w) => w.isActive).length;
    // Summing up capacity or utilization as "Items" for now, or just a placeholder if "Items" refers to shipments inside.
    // Since we don't have shipment count per warehouse in the Warehouse model yet, I'll use currentUtilization as a proxy or just 0.
    // Let's assume "Items" means total utilization for now.
    const items = warehouses.reduce(
      (acc, w) => acc + (w.currentUtilization || 0),
      0
    );

    return [
      { label: "Total", value: total },
      { label: "Active", value: active },
      { label: "Items", value: items },
    ];
  }, [warehouses]);

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((warehouse) => {
      return (
        warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        warehouse.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [warehouses, searchQuery]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <Pressable
          onPress={() => router.back()}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
          <Ionicons name="arrow-back" size={24} color="#1A293B" />
        </Pressable>
        <Text className="text-lg font-semibold text-[#1A293B]">Warehouses</Text>
        <Pressable
          onPress={() => router.push("/notification")}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
          <Image
            source={require("@/assets/images/notification-icon.png")}
            className="w-8 h-8"
            resizeMode="contain"
          />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#1A293B"
            colors={["#1A293B"]}
          />
        }>
        <View className="px-4 pt-6">
          {/* Stats */}
          <View className="flex-row justify-between mb-6">
            {warehouseStats.map((stat) => (
              <View
                key={stat.label}
                className="bg-white rounded-2xl border border-gray-100 p-4 items-center"
                style={{ width: "32%" }}>
                <Text className="text-2xl font-bold text-primary-blue">
                  {stat.value}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Add Button and Search */}
          <View className="mb-6">
            <View className="flex-row justify-end mb-3">
              <Pressable
                onPress={() => {
                  setEditingWarehouse(null);
                  setShowModal(true);
                }}
                android_ripple={{ color: "rgba(255,255,255,0.2)" }}>
                <View className="bg-[#1A293B] rounded-xl px-3 py-2 flex-row items-center justify-center">
                  <Ionicons name="add" size={16} color="white" />
                  <Text className="text-white"> Add Warehouse</Text>
                </View>
              </Pressable>
            </View>
            <Input className="bg-white rounded-xl border-gray-200">
              <InputSlot className="pl-3">
                <Ionicons name="search" size={20} color="#999" />
              </InputSlot>
              <InputField
                placeholder="Search warehouses"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="text-[#1A293B]"
              />
            </Input>
          </View>

          {/* Warehouse List */}
          {isLoading ? (
            <ActivityIndicator size="large" color="#1A293B" />
          ) : (
            <View className="space-y-4">
              {filteredWarehouses.map((warehouse) => (
                <View
                  key={warehouse._id}
                  className="bg-white rounded-2xl border border-gray-100 p-4">
                  {/* Header */}
                  <View className="flex-row items-center justify-between mb-4">
                    <View>
                      <Text className="text-lg font-semibold text-[#1A293B]">
                        {warehouse.name}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-0.5">
                        ID: {warehouse._id.substring(0, 8).toUpperCase()}
                      </Text>
                    </View>
                    <View
                      className={`rounded-lg px-3 py-1 ${
                        warehouse.isActive ? "bg-green-100" : "bg-gray-100"
                      }`}>
                      <Text
                        className={`text-xs font-semibold ${
                          warehouse.isActive
                            ? "text-green-700"
                            : "text-gray-700"
                        }`}>
                        {warehouse.isActive ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>

                  {/* Table Info */}
                  <View className="mb-4 bg-gray-50 rounded-xl p-3">
                    <View className="flex-row justify-between py-2 border-b border-gray-200/50">
                      <Text className="text-sm text-gray-500">Location</Text>
                      <Text className="text-sm font-medium text-[#1A293B] capitalize">
                        {warehouse.location}
                      </Text>
                    </View>
                    <View className="flex-row justify-between py-2 border-b border-gray-200/50">
                      <Text className="text-sm text-gray-500">Address</Text>
                      <Text
                        className="text-sm font-medium text-[#1A293B] max-w-[60%] text-right"
                        numberOfLines={1}>
                        {warehouse.address}
                      </Text>
                    </View>
                    <View className="flex-row justify-between py-2 border-b border-gray-200/50">
                      <Text className="text-sm text-gray-500">Contact</Text>
                      <Text className="text-sm font-medium text-[#1A293B]">
                        {warehouse.contactPerson}
                      </Text>
                    </View>
                    <View className="flex-row justify-between py-2">
                      <Text className="text-sm text-gray-500">Capacity</Text>
                      <Text className="text-sm font-medium text-[#1A293B]">
                        {warehouse.capacity.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() =>
                        router.push(
                          `/warehouse-details?id=${warehouse._id}`,
                        )
                      }
                      android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                      className="flex-1">
                      <View className="bg-[#1A293B] rounded-xl py-3 items-center">
                        <Text className="text-xs font-semibold text-white">
                          View
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setEditingWarehouse(warehouse);
                        setShowModal(true);
                      }}
                      android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                      className="flex-1">
                      <View className="bg-[#F3F4F6] rounded-xl py-3 items-center border border-gray-200">
                        <Text className="text-xs font-semibold text-[#1A293B]">
                          Edit
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteWarehouse(warehouse)}
                      disabled={deleteWarehouseMutation.isPending}
                      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                      className="flex-1">
                      <View className="bg-red-50 rounded-xl py-3 items-center border border-red-200">
                        <Text className="text-xs font-semibold text-red-700">
                          Delete
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              ))}
              {filteredWarehouses.length === 0 && (
                <Text className="text-center text-gray-500 mt-4">
                  No warehouses found
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Warehouse Modal */}
      <AddWarehouseModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingWarehouse(null);
        }}
        warehouseId={editingWarehouse?._id}
        initialData={
          editingWarehouse
            ? {
                name: editingWarehouse.name,
                location: editingWarehouse.location,
                address: editingWarehouse.address,
                contactPerson: editingWarehouse.contactPerson,
                phone: editingWarehouse.phone,
                capacity: editingWarehouse.capacity,
                currentUtilization: editingWarehouse.currentUtilization,
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}
