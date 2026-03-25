import { GenerateReportModal } from "@/components/generate-report-modal";
import { useRequireAuth } from "@/contexts/AuthContext";
import { useContainerDetails, useShipments } from "@/hooks/useShipments";
import { Shipment, exportExcelReport } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
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

export default function PartnerContainerDetails() {
  useRequireAuth();
  const params = useLocalSearchParams();
  const containerId = params.id as string;
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<"detailed" | "summary" | "">("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const {
    data: container,
    isLoading: isLoadingContainers,
    error: containersError,
  } = useContainerDetails(containerId);

  const { data: shipmentsData, isLoading: isLoadingShipments } = useShipments();

  const shipments =
    shipmentsData?.pages
      .flatMap((page: any) => (page && page.data ? page.data : page))
      .filter(Boolean) || [];

  if (isLoadingContainers || isLoadingShipments) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1A293B" />
          <Text className="text-gray-500 mt-4">
            Loading container details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (containersError || !container) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-500">Failed to load container</Text>
          <Text className="text-red-400 text-sm mt-2">
            {(containersError as any)?.response?.data?.message ||
              (containersError as Error)?.message ||
              "Container not found"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get shipments for this container
  const containerShipments = shipments.filter((s: Shipment) => {
    if (typeof s.containerId === "object") {
      return s.containerId._id === container._id;
    }
    return s.containerId === container._id;
  });

  // Use shipmentCount from container if available, otherwise use filtered shipments length
  const shipmentCount = container.shipmentCount ?? containerShipments.length;

  // Create customer options for the report modal
  const customerOptions = containerShipments
    .filter(
      (s: Shipment) => typeof s.customerId === "object" && s.customerId?.name,
    )
    .map((shipment: Shipment) => ({
      id:
        typeof shipment.customerId === "object"
          ? shipment.customerId._id
          : shipment._id,
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
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}
        >
          <Ionicons name="arrow-back" size={24} color="#1A293B" />
        </Pressable>
        <Text className="text-lg font-semibold text-[#1A293B]">
          Container details
        </Text>
        <Pressable
          onPress={() => router.push("/(partners)/notification")}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}
        >
          <Ionicons name="notifications-outline" size={24} color="#1A293B" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4">
          {/* Generate report button */}
          <Pressable
            onPress={() => setShowReportModal(true)}
            android_ripple={{ color: "rgba(255,255,255,0.2)" }}
            className="self-end mb-4"
          >
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
                (item) => item.value !== "N/A" || item.label === "Size & type",
              )
              .map((item, index, array) => (
                <View
                  key={item.label}
                  className={`flex-row justify-between py-3 ${
                    index !== array.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
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
              style={{ width: "48%", backgroundColor: "#3D6DD64D" }}
            >
              <Text className="text-3xl font-bold text-[#0065EA]">
                {shipmentCount}
              </Text>
              <Text className="text-sm font-medium text-[#0065EA] mt-1">
                Shipments
              </Text>
            </View>
            <View
              className="rounded-2xl p-4 items-start"
              style={{ width: "48%", backgroundColor: "#10B9814D" }}
            >
              <Text className="text-3xl font-bold text-[#10B981]">
                {container.customerIds?.length ||
                  new Set(
                    containerShipments.map((s: Shipment) =>
                      typeof s.customerId === "object"
                        ? s.customerId?._id
                        : s.customerId,
                    ),
                  ).size}
              </Text>
              <Text className="text-sm font-medium text-[#10B981] mt-1">
                Customers
              </Text>
            </View>
          </View>

          {/* Partners Section */}
          <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 mx-4">
            <Text className="text-lg font-semibold text-[#1A293B] mb-4">
              Partners ({container.partnerIds?.length || 0})
            </Text>
            {!container.partnerIds || container.partnerIds.length === 0 ? (
              <Text className="text-sm text-gray-500 text-center py-2">
                No partners assigned
              </Text>
            ) : (
              (container.partnerIds as any[]).map((partner, index) => (
                <View
                  key={typeof partner === "string" ? partner : partner._id}
                  className="bg-green-50 rounded-xl p-4 mb-3 flex-row items-center"
                >
                  <View className="bg-green-100 p-2 rounded-full mr-3">
                    <Ionicons name="business" size={20} color="#10b981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-[#1A293B]">
                      {typeof partner === "string" ? "Partner" : partner.name}
                    </Text>
                    {typeof partner !== "string" && partner.phoneNumber && (
                      <Text className="text-sm text-gray-600">
                        {partner.phoneNumber}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Customers List Section */}
          <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 mx-4">
            <Text className="text-lg font-semibold text-[#1A293B] mb-4">
              Customers ({container.customerIds?.length || 0})
            </Text>
            {!container.customerIds || container.customerIds.length === 0 ? (
              <Text className="text-sm text-gray-500 text-center py-2">
                No customers assigned
              </Text>
            ) : (
              (container.customerIds as any[]).map((customer, index) => (
                <View
                  key={typeof customer === "string" ? customer : customer._id}
                  className="bg-blue-50 rounded-xl p-4 mb-3 flex-row items-center"
                >
                  <View className="bg-blue-100 p-2 rounded-full mr-3">
                    <Ionicons name="people" size={20} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-[#1A293B]">
                      {typeof customer === "string"
                        ? "Customer"
                        : customer.name}
                    </Text>
                    {typeof customer !== "string" && customer.phone && (
                      <Text className="text-sm text-gray-600">
                        {customer.phone}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
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
              containerId,
            };

            // Add customerId if a customer is selected
            if (data.customerId) {
              payload.customerId = data.customerId;
            }

            console.log(
              "[partners/container-details] Generating report with payload:",
              {
                payload,
                containerId,
                reportType: data.reportType,
                customerId: data.customerId,
                mode,
              },
            );

            const buffer = await exportExcelReport(payload);

            const filename = `partner-shipments-${mode}-${new Date()
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
            console.log("[reports] export-excel error (partner container)", {
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
