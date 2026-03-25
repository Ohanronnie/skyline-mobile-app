import { AddShipmentModal } from "@/components/add-shipment-modal";
import { GenerateReportModal } from "@/components/generate-report-modal";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { useDeleteShipment, useShipments } from "@/hooks/useShipments";
import { Shipment, ShipmentStatus, exportExcelReport } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Shipments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<"detailed" | "summary" | "">("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedReportStatus, setSelectedReportStatus] = useState<
    ShipmentStatus | ""
  >("");
  const [selectedShipmentDropdown, setSelectedShipmentDropdown] = useState("");
  const [showAddShipmentModal, setShowAddShipmentModal] = useState(false);
  const [editingShipment, setEditingShipment] = useState<{
    id: string;
    trackingNumber?: string;
    customerIds?: string[];
    cbm?: string;
    status?: string;
    container?: string;
    originWarehouse?: string;
    currentWarehouse?: string;
    description?: string;
    partnerIds?: string[];
  } | null>(null);

  const {
    data: shipmentsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useShipments();
  const deleteMutation = useDeleteShipment();

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Shipment",
      "Are you sure you want to delete this shipment? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteMutation.mutate(id, {
              onSuccess: () => {
                Alert.alert("Success", "Shipment deleted successfully");
              },
              onError: (error: any) => {
                const errorMessage =
                  error?.response?.data?.message ||
                  error?.message ||
                  "Failed to delete shipment";
                Alert.alert("Error", errorMessage);
              },
            });
          },
        },
      ],
    );
  };

  const filters = [
    { id: "all", label: "All shipments" },
    { id: ShipmentStatus.RECEIVED, label: "Received" },
    { id: ShipmentStatus.INSPECTED, label: "Inspected" },
    { id: ShipmentStatus.LOADED, label: "Loaded" },
    { id: ShipmentStatus.IN_TRANSIT, label: "In Transit" },
    { id: ShipmentStatus.ARRIVED_GHANA, label: "Arrived Ghana" },
    { id: ShipmentStatus.DELIVERED, label: "Delivered" },
  ];

  const allShipments =
    shipmentsData?.pages
      .flatMap((page: any) => (page && page.data ? page.data : page))
      .filter(Boolean) || [];

  const filteredShipments =
    allShipments.filter((shipment: Shipment) => {
      if (!shipment) return false;
      // Handle containerId - can be string or populated object
      const containerNumber =
        typeof shipment.containerId === "object"
          ? shipment.containerId.containerNumber
          : "";
      const matchesContainer = containerNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesSearch =
        shipment.trackingNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        shipment.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        matchesContainer;

      if (selectedFilter === "all") return matchesSearch;

      // Filter by status
      const matchesFilter = shipment.status === selectedFilter;
      return matchesSearch && matchesFilter;
    }) || [];

  const renderShipmentItem = ({ item }: { item: Shipment }) => {
    return (
      <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-200">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
              <Ionicons name="cube" size={20} color="#666" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-[#1A293B] mb-1">
                {item.trackingNumber}
              </Text>
              <Text className="text-sm text-gray-700">
                {typeof item.customerId === "object"
                  ? item.customerId?.name
                  : "Unknown Customer"}
              </Text>
            </View>
          </View>
          <View className="bg-green-100 rounded-full px-3 py-1">
            <Text className="text-xs uppercase font-semibold text-green-700 text-center">
              {item.status.replace(/_/g, " ")}
            </Text>
          </View>
        </View>

        {/* Container */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-base text-gray-600">Container</Text>
          <Text className="text-base font-medium text-[#1A293B]">
            {typeof item.containerId === "object"
              ? item.containerId.containerNumber
              : item.containerId || "N/A"}
          </Text>
        </View>

        {/* Date */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-base text-gray-600">Created At</Text>
          <Text className="text-base font-medium text-[#1A293B]">
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Description */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base text-gray-600">Description</Text>
          <Text className="text-base font-medium text-[#1A293B]">
            {item.description || "N/A"}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-2 mt-2">
          <Pressable
            onPress={() => router.push(`/shipment-details?id=${item._id}`)}
            android_ripple={{ color: "rgba(0,0,0,0.1)" }}
            className="flex-1"
          >
            <View className="bg-[#1A293B] rounded-full px-3 py-2 items-center">
              <Text className="text-sm font-semibold text-white">View</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => {
              // Map shipment data to form fields
              setEditingShipment({
                id: item._id,
                trackingNumber: item.trackingNumber,
                customerIds:
                  item.customerIds?.map((c: any) =>
                    typeof c === "object" ? c._id : c,
                  ) ||
                  (item.customerId
                    ? [
                        typeof item.customerId === "object"
                          ? item.customerId._id
                          : item.customerId,
                      ]
                    : []),
                partnerIds:
                  item.partnerIds?.map((p: any) =>
                    typeof p === "object" ? p._id : p,
                  ) ||
                  (item.partnerId
                    ? [
                        typeof item.partnerId === "object"
                          ? item.partnerId._id
                          : item.partnerId,
                      ]
                    : []),
                status: item.status,
                container:
                  typeof item.containerId === "object"
                    ? item.containerId._id
                    : item.containerId,
                description: item.description,
                cbm: item.cbm?.toString(),
                originWarehouse: item.originWarehouseId,
                currentWarehouse: item.currentWarehouseId,
              });
              setShowAddShipmentModal(true);
            }}
            android_ripple={{ color: "rgba(0,0,0,0.1)" }}
            className="flex-1"
          >
            <View className="bg-[#E5E7EB] rounded-full px-3 py-2 items-center">
              <Text className="text-sm font-semibold text-[#1A293B]">Edit</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => handleDelete(item._id)}
            android_ripple={{ color: "rgba(0,0,0,0.1)" }}
            className="flex-1"
          >
            <View className="bg-[#FF12124D] rounded-full px-3 py-2 items-center">
              <Text className="text-sm font-semibold text-red-500">Delete</Text>
            </View>
          </Pressable>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#1A293B" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-red-500">Error loading shipments</Text>
      </SafeAreaView>
    );
  }

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

  // Create customer options for the report modal
  const reportCustomers = filteredShipments
    .filter(
      (s: Shipment) => typeof s.customerId === "object" && s.customerId?.name,
    )
    .map((s: Shipment) => ({
      id: typeof s.customerId === "object" ? s.customerId._id : s._id,
      fullName:
        typeof s.customerId === "object"
          ? s.customerId?.name
          : "Unknown Customer",
    }));

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Custom Navbar */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <Pressable
          onPress={() => router.back()}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}
        >
          <Ionicons name="arrow-back" size={24} color="#1A293B" />
        </Pressable>
        <Text className="text-2xl font-semibold text-[#1A293B]">Shipments</Text>
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
        data={filteredShipments}
        renderItem={renderShipmentItem}
        keyExtractor={(item) => item._id}
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
        contentContainerStyle={{
          paddingBottom: Platform.OS === "ios" ? 88 : 100,
        }}
        showsVerticalScrollIndicator={true}
        ListHeaderComponent={
          <View className="px-4 pt-4">
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
                  placeholder="Search shipments"
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="text-gray-900"
                />
              </Input>
            </View>

            {/* Filter Pills */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {filters.map((filter) => (
                <Pressable
                  key={filter.id}
                  onPress={() => setSelectedFilter(filter.id)}
                  android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                >
                  <View
                    className={`rounded-full px-4 py-2 ${
                      selectedFilter === filter.id
                        ? "bg-[#1A293B]"
                        : "bg-white border border-gray-300"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selectedFilter === filter.id
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {filter.label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={() => setShowReportModal(true)}
                android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                className="flex-1"
              >
                <View className="bg-[#1A293B] rounded-full px-3 py-2 flex-row items-center justify-center">
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color="white"
                  />
                  <Text className="text-white font-semibold text-xs ml-2">
                    Generate report
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => {
                  setEditingShipment(null);
                  setShowAddShipmentModal(true);
                }}
                android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                className="flex-1"
              >
                <View className="bg-[#1A293B] rounded-full px-3 py-2 flex-row items-center justify-center">
                  <Ionicons name="add" size={16} color="white" />
                  <Text className="text-white font-semibold text-xs ml-2">
                    Add shipment
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        }
      />

      {/* Report Modal */}
      {showReportModal && (
        <GenerateReportModal
          visible={showReportModal}
          onClose={() => setShowReportModal(false)}
          customers={reportCustomers}
          reportType={reportType}
          selectedCustomer={selectedCustomer}
          selectedStatus={selectedReportStatus}
          onReportTypeChange={setReportType}
          onSelectedCustomerChange={setSelectedCustomer}
          onStatusChange={setSelectedReportStatus}
          onSubmit={async (data) => {
            try {
              const mode: "summary" | "detailed" =
                data.reportType === "summary" ? "summary" : "detailed";

              // Build payload with optional status and customer filters
              const payload: any = {
                type: "shipments" as const,
                mode,
              };

              // Add status filter if selected
              if (data.status) {
                payload.shipmentStatuses = [data.status];
              }

              // Add customerId if a customer is selected
              if (data.customerId) {
                payload.customerId = data.customerId;
              }

              console.log("[shipments] Generating report with payload:", {
                payload,
                reportType: data.reportType,
                customerId: data.customerId,
                status: data.status,
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
                  "Your report has been downloaded. Check your browser's Downloads folder.",
                );
              } else {
                const base64 = await arrayBufferToBase64(buffer);
                const cacheDir =
                  (FileSystem as any).cacheDirectory ??
                  (FileSystem as any).documentDirectory ??
                  "";
                const fileUri = cacheDir + filename;
                await FileSystem.writeAsStringAsync(fileUri, base64, {
                  // Some Expo versions expose EncodingType, others accept raw "base64"
                  encoding:
                    (FileSystem as any).EncodingType?.Base64 ??
                    ("base64" as any),
                });
                const available = await Sharing.isAvailableAsync();
                if (available) {
                  await Sharing.shareAsync(fileUri, {
                    mimeType:
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  });
                  // Let user know they can choose where to save/share
                  Alert.alert(
                    "Report ready",
                    "Choose where to save or share your report from the system sheet.",
                  );
                } else {
                  Alert.alert(
                    "Report ready",
                    `The report file has been saved on your device at:\n\n${fileUri}`,
                  );
                }
              }
            } catch (error: any) {
              console.log("[reports] export-excel error (shipments list)", {
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
      )}

      {/* Add Shipment Modal */}
      {showAddShipmentModal && (
        <AddShipmentModal
          visible={showAddShipmentModal}
          onClose={() => {
            setShowAddShipmentModal(false);
            setEditingShipment(null);
          }}
          shipmentId={editingShipment?.id}
          initialData={editingShipment || undefined}
        />
      )}
    </SafeAreaView>
  );
}
