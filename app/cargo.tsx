import { AddCargoModal } from "@/components/add-cargo-modal";
import { Input, InputField } from "@/components/ui/input";
import { Cargo, deleteCargo, getCargo } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export default function CargoScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);

  const {
    data: cargoList = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["cargo"],
    queryFn: getCargo,
  });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteCargo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cargo"] });
      Alert.alert("Success", "Cargo deleted successfully");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete cargo";
      Alert.alert("Error", errorMessage);
    },
  });

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Cargo",
      "Are you sure you want to delete this cargo? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(id),
        },
      ],
    );
  };

  const filteredCargo = useMemo(() => {
    return cargoList.filter((cargo) => {
      const q = searchQuery.toLowerCase();
      return (
        cargo.cargoId.toLowerCase().includes(q) ||
        (cargo.origin?.toLowerCase().includes(q) ?? false) ||
        (cargo.destination?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [cargoList, searchQuery]);

  const cargoStats = useMemo(() => {
    const total = cargoList.length;
    const withCustomer = cargoList.filter((c) => !!c.customerId).length;
    const withPartner = cargoList.filter((c) => !!c.partnerId).length;
    return [
      { label: "Total", value: total },
      { label: "With customer", value: withCustomer },
      { label: "With partner", value: withPartner },
    ];
  }, [cargoList]);

  const handleOpenAdd = () => {
    setEditingCargo(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (cargo: Cargo) => {
    setEditingCargo(cargo);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingCargo(null);
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
        <Text className="text-lg font-semibold text-[#1A293B]">Cargo</Text>
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        <View className="px-4 pt-6">
          {/* Stats */}
          <View className="flex-row justify-between mb-6">
            {cargoStats.map((stat) => (
              <View
                key={stat.label}
                className="bg-white rounded-2xl border border-gray-100 p-4 items-center"
                style={{ width: "32%" }}
              >
                <Text className="text-2xl font-bold text-primary-blue">
                  {stat.value}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Search */}
          <Text className="text-sm font-medium text-[#1A293B] mb-2">
            Search cargo
          </Text>
          <Input>
            <InputField
              placeholder="Search by ID, origin or destination"
              placeholderTextColor="#9CA3AF"
              className="text-[#1A293B]"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Input>

          {/* Add button */}
          <Pressable
            onPress={handleOpenAdd}
            android_ripple={{ color: "rgba(255,255,255,0.2)" }}
            className="mb-6 self-end mt-6"
          >
            <View className="bg-[#1A293B] rounded-full px-4 py-2.5 flex-row items-center">
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white font-semibold text-sm ml-2">
                Add cargo
              </Text>
            </View>
          </Pressable>

          {/* Cargo list */}
          {isLoading ? (
            <ActivityIndicator size="large" color="#1A293B" />
          ) : (
            <View className="space-y-4">
              {filteredCargo.map((cargo) => (
                <View
                  key={cargo._id}
                  className="bg-white rounded-2xl border border-gray-100 p-4"
                >
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <Image
                        source={require("@/assets/images/cargo-icon.png")}
                        className="w-8 h-8 mr-3"
                        resizeMode="contain"
                      />
                      <View>
                        <Text className="text-lg font-semibold text-[#1A293B]">
                          {cargo.cargoId}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {cargo.type?.toUpperCase() || "N/A"}
                        </Text>
                      </View>
                    </View>
                    <View className="bg-blue-100 rounded-lg px-3 py-1">
                      <Text className="text-xs font-semibold text-blue-700">
                        {cargo.origin && cargo.destination
                          ? `${cargo.origin} → ${cargo.destination}`
                          : "Route N/A"}
                      </Text>
                    </View>
                  </View>

                  <View className="mb-3">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-sm text-gray-500">Weight</Text>
                      <Text className="text-sm font-semibold text-[#1A293B]">
                        {cargo.weight ? `${cargo.weight} kg` : "N/A"}
                      </Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-sm text-gray-500">Vessel</Text>
                      <Text className="text-sm font-semibold text-[#1A293B]">
                        {cargo.vesselName || "N/A"}
                      </Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-sm text-gray-500">ETA</Text>
                      <Text className="text-sm font-semibold text-[#1A293B]">
                        {cargo.eta
                          ? new Date(cargo.eta).toLocaleDateString()
                          : "N/A"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2 flex-wrap">
                    {/* View can be extended later to a dedicated details screen */}
                    <Pressable
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
                      onPress={() => handleOpenEdit(cargo)}
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
                      onPress={() => handleDelete(cargo._id)}
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
              ))}
              {filteredCargo.length === 0 && !isLoading && (
                <Text className="text-center text-gray-500 mt-4">
                  No cargo found yet
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {showAddModal && (
        <AddCargoModal
          visible={showAddModal}
          onClose={handleCloseModal}
          cargoId={editingCargo?._id}
          initialData={
            editingCargo
              ? {
                  cargoId: editingCargo.cargoId,
                  type: editingCargo.type,
                  weight: editingCargo.weight,
                  origin: editingCargo.origin,
                  destination: editingCargo.destination,
                  vesselName: editingCargo.vesselName,
                  eta: editingCargo.eta,
                  customerId:
                    typeof editingCargo.customerId === "object"
                      ? editingCargo.customerId._id
                      : (editingCargo.customerId as string | undefined),
                  partnerId:
                    typeof editingCargo.partnerId === "object"
                      ? editingCargo.partnerId._id
                      : (editingCargo.partnerId as string | undefined),
                }
              : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}
