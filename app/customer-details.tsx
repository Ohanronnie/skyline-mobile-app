import {
    Customer,
    getCustomers,
    getCustomerShipments,
    Shipment,
    ShipmentStatus,
} from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getStatusColor = (status: ShipmentStatus) => {
  switch (status) {
    case ShipmentStatus.DELIVERED:
    case ShipmentStatus.DELIVERED_ACCRA:
    case ShipmentStatus.DELIVERED_KUMASI:
    case ShipmentStatus.DELIVERED_NKORANZA:
      return { bg: "bg-green-100", text: "text-green-700" };
    case ShipmentStatus.IN_TRANSIT:
      return { bg: "bg-blue-100", text: "text-blue-700" };
    case ShipmentStatus.RECEIVED:
    case ShipmentStatus.RECEIVED_CHINA:
    case ShipmentStatus.RECEIVED_ACCRA:
    case ShipmentStatus.RECEIVED_KUMASI:
    case ShipmentStatus.RECEIVED_NKORANZA:
      return { bg: "bg-yellow-100", text: "text-yellow-700" };
    case ShipmentStatus.LOADED:
    case ShipmentStatus.LOADED_CHINA:
      return { bg: "bg-purple-100", text: "text-purple-700" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-700" };
  }
};

const formatStatus = (status: string) => {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function CustomerDetails() {
  const params = useLocalSearchParams();
  const customerId = params.id as string;
  const [shipmentsExpanded, setShipmentsExpanded] = useState(true);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  const { data: shipments = [], isLoading: isLoadingShipments } = useQuery({
    queryKey: ["customer-shipments", customerId],
    queryFn: () => getCustomerShipments(customerId),
    enabled: !!customerId,
  });

  const customer = customers.find((c: Customer) => c._id === customerId);

  if (!customer) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Customer not found</Text>
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
          onPress={() => router.push("/notification")}
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

          {/* Shipments Section */}
          <View className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
            <Pressable
              onPress={() => setShipmentsExpanded(!shipmentsExpanded)}
              className="flex-row items-center justify-between p-5"
              android_ripple={{ color: "rgba(0,0,0,0.05)" }}>
              <View className="flex-row items-center">
                <Ionicons name="cube-outline" size={20} color="#1A293B" />
                <Text className="text-lg font-semibold text-[#1A293B] ml-2">
                  Shipments
                </Text>
                <View className="bg-[#2196F3] rounded-full px-2 py-0.5 ml-2">
                  <Text className="text-xs text-white font-medium">
                    {shipments.length}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={shipmentsExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6B7280"
              />
            </Pressable>

            {shipmentsExpanded && (
              <View className="px-5 pb-5 border-t border-gray-100">
                {isLoadingShipments ? (
                  <View className="py-8 items-center">
                    <ActivityIndicator size="small" color="#2196F3" />
                    <Text className="text-sm text-gray-500 mt-2">
                      Loading shipments...
                    </Text>
                  </View>
                ) : shipments.length === 0 ? (
                  <View className="py-8 items-center">
                    <Ionicons
                      name="cube-outline"
                      size={40}
                      color="#D1D5DB"
                    />
                    <Text className="text-sm text-gray-400 mt-2">
                      No shipments found for this customer
                    </Text>
                  </View>
                ) : (
                  <View className="mt-4 space-y-3">
                    {shipments.map((shipment: Shipment) => {
                      const statusColor = getStatusColor(shipment.status);
                      return (
                        <Pressable
                          key={shipment._id}
                          onPress={() =>
                            router.push({
                              pathname: "/shipment-details",
                              params: { id: shipment._id },
                            })
                          }
                          className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                          android_ripple={{ color: "rgba(0,0,0,0.05)" }}>
                          <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-sm font-semibold text-[#1A293B]">
                              {shipment.trackingNumber}
                            </Text>
                            <View
                              className={`px-2 py-1 rounded-full ${statusColor.bg}`}>
                              <Text
                                className={`text-xs font-medium ${statusColor.text}`}>
                                {formatStatus(shipment.status)}
                              </Text>
                            </View>
                          </View>
                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                              <Ionicons
                                name="calendar-outline"
                                size={14}
                                color="#6B7280"
                              />
                              <Text className="text-xs text-gray-500 ml-1">
                                Created: {formatDate(shipment.createdAt)}
                              </Text>
                            </View>
                            {shipment.cbm && (
                              <Text className="text-xs text-gray-500">
                                CBM: {shipment.cbm}
                              </Text>
                            )}
                          </View>
                          {shipment.description && (
                            <Text
                              className="text-xs text-gray-500 mt-2"
                              numberOfLines={1}>
                              {shipment.description}
                            </Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

