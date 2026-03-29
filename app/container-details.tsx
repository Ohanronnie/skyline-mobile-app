import { GenerateReportModal } from "@/components/generate-report-modal";
import { exportExcelReport, getContainerDetails, Shipment } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system/legacy";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import {
  Alert,
  Platform,
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

export default function ContainerDetails() {
  const params = useLocalSearchParams();
  const containerId = params.id as string;
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<"detailed" | "summary" | "">("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const {
    data: container,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["container", containerId],
    queryFn: () => getContainerDetails(containerId),
  });

  // Get shipments, customers and partners from container data
  const containerShipments: Shipment[] = container?.shipments || [];
  
  const containerCustomers = useMemo(() => {
    if (!container) return [];
    // Priority 1: customerIds array (populated objects)
    if (container.customerIds && container.customerIds.length > 0) {
      return container.customerIds.filter(c => typeof c === 'object') as any[];
    }
    // Priority 2: customers array
    if (container.customers && container.customers.length > 0) {
      return container.customers;
    }
    // Priority 3: single customer object
    if (container.customer && typeof container.customer === 'object') {
      return [container.customer];
    }
    return [];
  }, [container]);

  const containerPartners = useMemo(() => {
    if (!container) return [];
    // Priority 1: partnerIds array (populated objects)
    if (container.partnerIds && container.partnerIds.length > 0) {
      return container.partnerIds.filter(p => typeof p === 'object') as any[];
    }
    return [];
  }, [container]);

  const shipmentCount = container?.shipmentCount ?? containerShipments.length;

  // Calculate shipment count per customer (must be before early returns)
  const customerShipmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    containerShipments.forEach((shipment) => {
      const customerId =
        typeof shipment.customerId === "object"
          ? shipment.customerId?._id
          : shipment.customerId;
      if (customerId) {
        counts[customerId] = (counts[customerId] || 0) + 1;
      }
    });
    return counts;
  }, [containerShipments]);
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!container) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Container not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Create customer options for the report modal
  const customerOptions = containerShipments
    .filter((s) => typeof s.customerId === "object" && s.customerId?.name)
    .map((shipment) => ({
      id: typeof shipment.customerId === "object" ? shipment.customerId._id : shipment._id,
      fullName:
        typeof shipment.customerId === "object"
          ? shipment.customerId?.name
          : "Unknown Customer",
    }));

  const arrayBufferToBase64 = async (buffer: ArrayBuffer): Promise<string> => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    if (typeof btoa !== "undefined") {
      return btoa(binary);
    }
    throw new Error("Base64 encoding is not supported in this environment");
  };

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
          Container details
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#1A293B"
            colors={["#1A293B"]}
          />
        }>
        <View className="px-4 pt-4">
          {/* Generate report button */}
          <Pressable
            onPress={() => setShowReportModal(true)}
            android_ripple={{ color: "rgba(255,255,255,0.2)" }}
            className="self-end mb-4">
            <View className="bg-[#1A293B] rounded-full px-4 py-2.5 flex-row items-center">
              <Ionicons name="document-text-outline" size={18} color="white" />
              <Text className="text-white font-semibold text-sm ml-2">
                Generate report
              </Text>
            </View>
          </Pressable>

          {/* Basic information */}
          <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
            <Text className="text-lg font-semibold text-[#1A293B] mb-4">
              Basic information
            </Text>

            {[
              {
                label: "Container number",
                value: container.containerNumber,
              },
              { label: "Size & type", value: container.sizeType || "N/A" },
              { label: "Status", value: formatStatus(container.status) },
              {
                label: "Vessel name",
                value: container.vesselName || "N/A",
              },
              {
                label: "Departure date",
                value: container.departureDate
                  ? new Date(container.departureDate).toLocaleDateString()
                  : "N/A",
              },
              {
                label: "ETA Ghana",
                value: container.etaGhana
                  ? new Date(container.etaGhana).toLocaleDateString()
                  : "N/A",
              },
              {
                label: "Arrival date",
                value: container.arrivalDate
                  ? new Date(container.arrivalDate).toLocaleDateString()
                  : "N/A",
              },
              {
                label: "Current location",
                value: container.currentLocation || "N/A",
              },
            ]
              .filter(
                (item) => item.value !== "N/A" || item.label === "Size & type"
              )
              .map((item, index, array) => (
                <View
                  key={item.label}
                  className={`flex-row justify-between py-3 ${
                    index !== array.length - 1 ? "border-b border-gray-100" : ""
                  }`}>
                  <Text className="text-sm text-gray-500">{item.label}</Text>
                  <Text className="text-sm font-semibold text-[#1A293B] text-right max-w-[60%]">
                    {item.value}
                  </Text>
                </View>
              ))}
          </View>

          {/* Stat boxes */}
          <View className="flex-row justify-between mb-4">
            <View
              className="rounded-2xl p-4 items-start"
              style={{ width: "48%", backgroundColor: "#3D6DD64D" }}>
              <Text className="text-3xl font-bold text-[#0065EA]">
                {shipmentCount}
              </Text>
              <Text className="text-sm font-medium text-[#0065EA] mt-1">
                Shipments
              </Text>
            </View>
            <View
              className="rounded-2xl p-4 items-start"
              style={{ width: "48%", backgroundColor: "#10B9814D" }}>
              <Text className="text-3xl font-bold text-[#10B981]">
                {containerCustomers.length}
              </Text>
              <Text className="text-sm font-medium text-[#10B981] mt-1">
                Customers
              </Text>
            </View>
          </View>

          {/* Partners Section */}
          <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
            <Text className="text-lg font-semibold text-[#1A293B] mb-4">
              Partners ({containerPartners.length})
            </Text>
            {containerPartners.length === 0 ? (
              <Text className="text-sm text-gray-500 text-center py-2">
                No partners assigned
              </Text>
            ) : (
              containerPartners.map((partner, index) => (
                <View
                  key={partner._id}
                  className="bg-green-50 rounded-xl p-4 mb-3 flex-row items-center">
                  <View className="bg-green-100 p-2 rounded-full mr-3">
                    <Ionicons name="business" size={20} color="#10b981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-[#1A293B]">
                      {partner.name}
                    </Text>
                    {partner.phoneNumber && (
                      <Text className="text-sm text-gray-600">
                        {partner.phoneNumber}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Customers and Shipments Section */}
          <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
            <Text className="text-lg font-semibold text-[#1A293B] mb-4">
              Customers & Shipments
            </Text>

            {/* Customers List */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-[#1A293B] mb-3">
                Customers ({containerCustomers.length})
              </Text>
              {containerCustomers.length === 0 ? (
                <Text className="text-sm text-gray-500 text-center py-4">
                  No customers found
                </Text>
              ) : (
                containerCustomers.map((customer, index) => (
                  <Pressable
                    key={customer._id}
                    onPress={() =>
                      router.push(`/customer-details?id=${customer._id}`)
                    }
                    android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                    className="bg-blue-50 rounded-xl p-4 mb-3">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-[#1A293B] mb-1">
                          {customer.name}
                        </Text>
                        {customer.email && (
                          <View className="flex-row items-center mb-1">
                            <Ionicons
                              name="mail-outline"
                              size={14}
                              color="#6B7280"
                              style={{ marginRight: 6 }}
                            />
                            <Text className="text-sm text-gray-600">
                              {customer.email}
                            </Text>
                          </View>
                        )}
                        {customer.phone && (
                          <View className="flex-row items-center mb-2">
                            <Ionicons
                              name="call-outline"
                              size={14}
                              color="#6B7280"
                              style={{ marginRight: 6 }}
                            />
                            <Text className="text-sm text-gray-600">
                              {customer.phone}
                            </Text>
                          </View>
                        )}
                        <View className="flex-row items-center">
                          <View className="bg-blue-100 rounded-full px-2 py-1 mr-2">
                            <Text className="text-xs font-medium text-blue-700">
                              {customerShipmentCounts[customer._id] || 0}{" "}
                              shipments
                            </Text>
                          </View>
                          {customer.location && (
                            <View className="bg-gray-100 rounded-full px-2 py-1">
                              <Text className="text-xs font-medium text-gray-700">
                                {customer.location}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#9CA3AF"
                      />
                    </View>
                  </Pressable>
                ))
              )}
            </View>

            {/* Shipments List */}
            <View>
              <Text className="text-sm font-semibold text-[#1A293B] mb-3">
                Shipments ({containerShipments.length})
              </Text>
              {containerShipments.length === 0 ? (
                <Text className="text-sm text-gray-500 text-center py-4">
                  No shipments found
                </Text>
              ) : (
                containerShipments.map((shipment, index) => {
                  const customerName =
                    typeof shipment.customerId === "object"
                      ? shipment.customerId?.name
                      : "Unknown Customer";
                  const statusDisplay = formatStatus(shipment.status);
                  const getStatusColor = (status: string) => {
                    if (status.includes("Delivered")) return "green";
                    if (status.includes("Transit")) return "blue";
                    if (
                      status.includes("Warehouse") ||
                      status.includes("Received")
                    )
                      return "yellow";
                    return "gray";
                  };
                  const statusColor = getStatusColor(shipment.status);
                  const shipmentDate = shipment.receivedAt
                    ? new Date(shipment.receivedAt).toLocaleDateString()
                    : shipment.createdAt
                    ? new Date(shipment.createdAt).toLocaleDateString()
                    : "N/A";

                  return (
                    <Pressable
                      key={shipment._id}
                      onPress={() =>
                        router.push(
                          `/shipment-details?id=${shipment._id}`
                        )
                      }
                      android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                      className="bg-gray-50 rounded-xl p-4 mb-3">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <View className="flex-row items-center mb-2 flex-wrap">
                            <Text className="text-base font-semibold text-[#1A293B] mr-2">
                              {shipment.trackingNumber}
                            </Text>
                            <View
                              className={`rounded-full px-2 py-1 ${
                                statusColor === "green"
                                  ? "bg-green-100"
                                  : statusColor === "blue"
                                  ? "bg-blue-100"
                                  : statusColor === "yellow"
                                  ? "bg-yellow-100"
                                  : "bg-gray-100"
                              }`}>
                              <Text
                                className={`text-xs font-medium ${
                                  statusColor === "green"
                                    ? "text-green-700"
                                    : statusColor === "blue"
                                    ? "text-blue-700"
                                    : statusColor === "yellow"
                                    ? "text-yellow-700"
                                    : "text-gray-700"
                                }`}>
                                {statusDisplay}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-sm text-gray-600 mb-1">
                            {customerName}
                          </Text>
                          {typeof shipment.customerId === "object" &&
                            shipment.customerId?.location && (
                              <View className="flex-row items-center mb-1">
                                <Ionicons
                                  name="location-outline"
                                  size={14}
                                  color="#6B7280"
                                  style={{ marginRight: 6 }}
                                />
                                <Text className="text-sm text-gray-600">
                                  {shipment.customerId.location}
                                </Text>
                              </View>
                            )}
                          <View className="flex-row items-center">
                            <Ionicons
                              name="calendar-outline"
                              size={14}
                              color="#6B7280"
                              style={{ marginRight: 6 }}
                            />
                            <Text className="text-sm text-gray-600">
                              {shipmentDate}
                            </Text>
                          </View>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#9CA3AF"
                        />
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <GenerateReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        customers={customerOptions}
        reportType={reportType}
        selectedCustomer={selectedCustomer}
        onReportTypeChange={setReportType}
        onSelectedCustomerChange={setSelectedCustomer}
        onSubmit={async (data) => {
          try {
            const mode: "summary" | "detailed" =
              data.reportType === "summary" ? "summary" : "detailed";
            const payload: any = {
              type: "shipments" as const,
              mode,
              containerId: containerId,
            };
            
            // Add customerId if a customer is selected
            if (data.customerId) {
              payload.customerId = data.customerId;
            }

            console.log("[container-details] Generating report with payload:", {
              payload,
              containerId,
              reportType: data.reportType,
              customerId: data.customerId,
              mode,
            });

            const buffer = await exportExcelReport(payload);

            const filename = `shipments-${mode}-${new Date()
              .toISOString()
              .slice(0, 10)}.xlsx`;

            if (Platform.OS === "web") {
              const blobObj = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              });
              const url = URL.createObjectURL(blobObj);
              const link = document.createElement("a");
              link.href = url;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);

              Alert.alert(
                "Report ready",
                "Your report has been downloaded. Check your browser's Downloads folder."
              );
            } else {
              const base64 = await arrayBufferToBase64(buffer);
              const cacheDir =
                (FileSystem as any).cacheDirectory ??
                (FileSystem as any).documentDirectory ??
                "";
              const fileUri = cacheDir + filename;
              await FileSystem.writeAsStringAsync(fileUri, base64, {
                encoding:
                  (FileSystem as any).EncodingType?.Base64 ?? ("base64" as any),
              });
              const available = await Sharing.isAvailableAsync();
              if (available) {
                await Sharing.shareAsync(fileUri, {
                  mimeType:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });
                Alert.alert(
                  "Report ready",
                  "Choose where to save or share your report from the system sheet."
                );
              } else {
                Alert.alert(
                  "Report ready",
                  `The report file has been saved on your device at:\n\n${fileUri}`
                );
              }
            }
          } catch (error: any) {
            console.log("[reports] export-excel error", {
              error: error?.response?.data,
              status: error?.response?.status,
              message: error?.message,
            });
            const errorMessage =
              error?.response?.data?.message ||
              error?.message ||
              "Failed to generate report.";
            Alert.alert("Error", errorMessage);
          }
        }}
      />
    </SafeAreaView>
  );
}
