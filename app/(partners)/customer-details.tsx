import { useRequireAuth } from "@/contexts/AuthContext";
import { usePartnerCustomers } from "@/hooks/useShipments";
import { Customer } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CustomerDetailsScreen() {
  useRequireAuth();
  const params = useLocalSearchParams();
  const customerId = params.customerId as string;

  const { data: customers = [], isLoading, error } = usePartnerCustomers();

  const customer = customers.find((c: Customer) => c._id === customerId);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1A293B" />
          <Text className="text-gray-500 mt-4">
            Loading customer details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !customer) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-500">Customer not found</Text>
          {(error as any)?.response?.data?.message && (
            <Text className="text-red-400 text-sm mt-2">
              {(error as any)?.response?.data?.message}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <Pressable
          onPress={() => router.back()}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
          <Ionicons name="arrow-back" size={24} color="#1A293B" />
        </Pressable>
        <Text className="text-lg font-semibold text-[#1A293B]">
          Customer details
        </Text>
        <Pressable
          onPress={() => router.push("/(partners)/notification")}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
          <Ionicons name="notifications-outline" size={24} color="#1A293B" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4">
          {/* Basic information */}
          <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
            <Text className="text-lg font-semibold text-[#1A293B] mb-4">
              Basic information
            </Text>

            {[
              { label: "Name", value: customer.name },
              {
                label: "Type",
                value:
                  customer.type.charAt(0).toUpperCase() +
                  customer.type.slice(1),
              },
              {
                label: "Location",
                value:
                  customer.location.charAt(0).toUpperCase() +
                  customer.location.slice(1),
              },
              {
                label: "Status",
                value: "Active", // Assuming active if customer exists
              },
            ].map((item, index) => (
              <View
                key={item.label}
                className={`flex-row justify-between py-3 ${
                  index !== 3 ? "border-b border-gray-100" : ""
                }`}>
                <Text className="text-sm text-gray-500">{item.label}</Text>
                <Text className="text-sm font-semibold text-[#1A293B] text-right max-w-[60%]">
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Contact information box */}
          <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
            <Text className="text-lg font-semibold text-[#1A293B] mb-4">
              Contact information
            </Text>
            <View className="space-y-3">
              <View>
                <Text className="text-sm text-gray-500 mb-1">Email</Text>
                <Text className="text-sm font-semibold text-[#1A293B]">
                  {customer.email || "N/A"}
                </Text>
              </View>
              <View>
                <Text className="text-sm text-gray-500 mb-1">Phone</Text>
                <Text className="text-sm font-semibold text-[#1A293B]">
                  {customer.phone || "N/A"}
                </Text>
              </View>
              {customer.address && (
                <View>
                  <Text className="text-sm text-gray-500 mb-1">Address</Text>
                  <Text className="text-sm font-semibold text-[#1A293B]">
                    {customer.address}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Additional information */}
          {(customer.paymentTerms || customer.notes) && (
            <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
              <Text className="text-lg font-semibold text-[#1A293B] mb-4">
                Additional information
              </Text>
              <View className="space-y-3">
                {customer.paymentTerms && (
                  <View>
                    <Text className="text-sm text-gray-500 mb-1">
                      Payment terms
                    </Text>
                    <Text className="text-sm font-semibold text-[#1A293B]">
                      {customer.paymentTerms}
                    </Text>
                  </View>
                )}
                {customer.notes && (
                  <View>
                    <Text className="text-sm text-gray-500 mb-1">Notes</Text>
                    <Text className="text-sm font-semibold text-[#1A293B]">
                      {customer.notes}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
