import { AddCustomerModal } from "@/components/add-customer-modal";
import { PartnerCustomerCard } from "@/components/partners/PartnerCustomerCard";
import { Box } from "@/components/ui/box";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { useAuth, useRequireAuth } from "@/contexts/AuthContext";
import { useDeleteCustomer, useInfinitePartnerCustomers } from "@/hooks/useShipments";
import { Customer } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PartnersCustomersScreen() {
  useRequireAuth();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: customersData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePartnerCustomers(debouncedSearch);

  const deleteMutation = useDeleteCustomer();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  const customers = useMemo(() => {
    return customersData?.pages.flatMap((page) => page.data) ?? [];
  }, [customersData]);

  const handleEditCustomer = (customer: Customer) => {
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

  const renderItem = ({ item }: { item: Customer }) => (
    <PartnerCustomerCard
      name={item.name}
      shipmentCount={0}
      phone={item.phone || "N/A"}
      email={item.email || "N/A"}
      onViewDetails={() =>
        router.push({
          pathname: "/(partners)/customer-details",
          params: { customerId: item._id, name: item.name },
        })
      }
      onEdit={() => handleEditCustomer(item)}
      onDelete={() => handleDeleteCustomer(item)}
    />
  );

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

      <FlatList
        data={customers}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View className="px-6 pt-6">
            {/* Search Input */}
            <View className="mb-4">
              <Input
                variant="outline"
                size="lg"
                className="bg-white rounded-xl border-gray-200"
              >
                <InputSlot className="pl-3">
                  <Ionicons name="search" size={20} color="#999" />
                </InputSlot>
                <InputField
                  placeholder="Search customers"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="text-gray-900"
                />
              </Input>
            </View>

            {/* Header with Add Button */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-[#1A293B]">Customers</Text>
              <TouchableOpacity
                onPress={() => setIsAddModalVisible(true)}
                className="bg-[#1A293B] w-10 h-10 rounded-lg items-center justify-center">
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {isLoading && customers.length === 0 && (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#1A293B" />
                <Text className="text-gray-500 mt-4">Loading customers...</Text>
              </View>
            )}

            {error && (
              <View className="py-8 items-center">
                <Text className="text-red-500">Failed to load customers</Text>
              </View>
            )}

            {!isLoading && customers.length === 0 && (
              <View className="py-8 items-center">
                <Text className="text-gray-500">No customers found</Text>
              </View>
            )}
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator size="small" color="#1A293B" />
            </View>
          ) : (
            <View className="h-24" />
          )
        }
        showsVerticalScrollIndicator={false}
      />

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
