import { CustomerCard } from "@/components/partners/CustomerCard";
import { Box } from "@/components/ui/box";
import { useRequireAuth } from "@/contexts/AuthContext";
import {
    useAssignCustomerToContainer,
    useAssignCustomerToShipment,
    usePartnerCustomers,
} from "@/hooks/useShipments";
import { Customer } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AssignCustomerScreen() {
  useRequireAuth();
  const { shipmentId, trackingNumber, containerId } = useLocalSearchParams<{
    shipmentId?: string;
    trackingNumber?: string;
    containerId?: string;
  }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );

  const {
    data: customers,
    isLoading: isLoadingCustomers,
    error: customersError,
  } = usePartnerCustomers();

  const assignShipmentMutation = useAssignCustomerToShipment();
  const assignContainerMutation = useAssignCustomerToContainer();

  // Determine if we're assigning to a shipment or container
  const isContainer = !!containerId;
  const isShipment = !!shipmentId;
  const assignMutation = isContainer
    ? assignContainerMutation
    : assignShipmentMutation;

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];

    return customers.filter((customer: Customer) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower)
      );
    });
  }, [customers, searchQuery]);

  const handleAssign = async () => {
    if (!selectedCustomerId) {
      Alert.alert("Error", "Please select a customer");
      return;
    }

    try {
      if (isContainer) {
        // Assign to container
        if (!containerId) {
          Alert.alert("Error", "Container ID is missing");
          return;
        }
        await assignContainerMutation.mutateAsync({
          containerId: containerId as string,
          data: {
            customerId: selectedCustomerId,
          },
        });
      } else if (isShipment) {
        // Assign to shipment
        if (!shipmentId || !trackingNumber) {
          Alert.alert("Error", "Shipment information is missing");
          return;
        }
        await assignShipmentMutation.mutateAsync({
          shipmentId: shipmentId as string,
          data: {
            trackingNumber: trackingNumber as string,
            customerId: selectedCustomerId,
          },
        });
      } else {
        Alert.alert("Error", "Invalid assignment type");
        return;
      }

      Alert.alert(
        "Success",
        `Customer assigned to ${
          isContainer ? "container" : "shipment"
        } successfully`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error("Assign customer error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to assign customer";
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#1A293B" />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-bold text-[#1A293B]">
              Assign customer
            </Text>
            <Text className="text-gray-500 text-xs">
              {isContainer
                ? `Container: ${containerId || "N/A"}`
                : `Shipment: ${trackingNumber || shipmentId || "N/A"}`}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/(partners)/notification")}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
          <Box className="p-2 bg-gray-50 rounded-full">
            <Image
              source={require("@/assets/images/notification-icon.png")}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </Box>
        </Pressable>
      </View>

      <View className="flex-1">
        <ScrollView
          contentContainerClassName="pb-32"
          showsVerticalScrollIndicator={false}>
          {/* Search */}
          <View className="px-6 mt-6 mb-6">
            <View className="bg-white rounded-xl px-4 py-3 flex-row items-center border border-gray-200">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-base text-gray-900"
                placeholder="Search customer by name, email or phone"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Customers List */}
          <View className="px-6">
            {isLoadingCustomers ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#1A293B" />
                <Text className="text-gray-500 mt-4">Loading customers...</Text>
              </View>
            ) : customersError ? (
              <View className="py-8 items-center">
                <Text className="text-red-500">Failed to load customers</Text>
                <Text className="text-red-400 text-sm mt-2">
                  {(customersError as any)?.response?.data?.message ||
                    (customersError as Error)?.message ||
                    "Unknown error"}
                </Text>
              </View>
            ) : filteredCustomers.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-gray-500">No customers found</Text>
              </View>
            ) : (
              filteredCustomers.map((customer: Customer) => (
                <CustomerCard
                  key={customer._id}
                  id={customer._id}
                  name={customer.name}
                  shipmentCount={0} // TODO: Get from API if available
                  phone={customer.phone || ""}
                  email={customer.email || ""}
                  location={customer.location || ""}
                  isSelected={selectedCustomerId === customer._id}
                  onSelect={() => setSelectedCustomerId(customer._id)}
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* Bottom Action Button */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6">
          <TouchableOpacity
            onPress={handleAssign}
            disabled={!selectedCustomerId || assignMutation.isPending}
            className={`w-full py-4 rounded-xl items-center ${
              selectedCustomerId && !assignMutation.isPending
                ? "bg-primary-blue"
                : "bg-gray-300"
            }`}>
            {assignMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">
                Assign customer
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
