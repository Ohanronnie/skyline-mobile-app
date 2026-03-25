import { AddCustomerModal } from "@/components/add-customer-modal";
import { PartnerCustomerCard } from "@/components/partners/PartnerCustomerCard";
import { Box } from "@/components/ui/box";
import { useAuth, useRequireAuth } from "@/contexts/AuthContext";
import { useDeleteCustomer, usePartnerCustomers } from "@/hooks/useShipments";
import { Customer } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PartnersCustomersScreen() {
  useRequireAuth();
  const { user } = useAuth();
  const { data: customers = [], isLoading, error } = usePartnerCustomers();
  const deleteMutation = useDeleteCustomer();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  const handleEditCustomer = (customer: Customer) => {
    console.log("[PartnersCustomers] Editing customer:", customer);
    setSelectedCustomer(customer);
    setIsAddModalVisible(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    Alert.alert(
      "Delete Customer",
      `Are you sure you want to delete ${customer.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteMutation.mutate(customer._id, {
              onError: (error: any) => {
                Alert.alert(
                  "Error",
                  error?.response?.data?.message || "Failed to delete customer"
                );
              },
            });
          },
        },
      ]
    );
  };

  const handleCloseModal = () => {
    setIsAddModalVisible(false);
    setSelectedCustomer(null);
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

      <ScrollView
        contentContainerClassName="pb-24 px-6 pt-6"
        showsVerticalScrollIndicator={false}>
        {/* Header with Add Button */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-[#1A293B]">Customers</Text>
          <TouchableOpacity
            onPress={() => setIsAddModalVisible(true)}
            className="bg-[#1A293B] w-10 h-10 rounded-lg items-center justify-center">
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Customers List */}
        <View>
          {isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#1A293B" />
              <Text className="text-gray-500 mt-4">Loading customers...</Text>
            </View>
          ) : error ? (
            <View className="py-8 items-center">
              <Text className="text-red-500">Failed to load customers</Text>
              <Text className="text-red-400 text-sm mt-2">
                {(error as any)?.response?.data?.message ||
                  (error as Error)?.message ||
                  "Unknown error"}
              </Text>
            </View>
          ) : customers.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-gray-500">No customers found</Text>
            </View>
          ) : (
            customers.map((customer: Customer) => (
              <PartnerCustomerCard
                key={customer._id}
                name={customer.name}
                shipmentCount={0} // TODO: Get shipment count from API if available
                phone={customer.phone || "N/A"}
                email={customer.email || "N/A"}
                onViewDetails={() =>
                  router.push({
                    pathname: "/(partners)/customer-details",
                    params: { customerId: customer._id, name: customer.name },
                  })
                }
                onEdit={() => handleEditCustomer(customer)}
                onDelete={() => handleDeleteCustomer(customer)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <AddCustomerModal
        visible={isAddModalVisible}
        onClose={handleCloseModal}
        customerId={selectedCustomer?._id}
        hidePartnerField={true}
        initialData={
          selectedCustomer
            ? {
                name: selectedCustomer.name,
                type: selectedCustomer.type,
                location: selectedCustomer.location,
                email: selectedCustomer.email,
                phone: selectedCustomer.phone,
                address: selectedCustomer.address,
                paymentTerms: selectedCustomer.paymentTerms,
                notes: selectedCustomer.notes,
                partnerId: selectedCustomer.partnerId,
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}
