import { AddCustomerModal } from "@/components/add-customer-modal";
import { GenerateReportModal } from "@/components/generate-report-modal";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import {
    Customer,
    CustomerType,
    exportExcelReport,
    getCustomers,
} from "@/lib/api";
import { customerMatchesSearchQuery } from "@/lib/customer-search";
import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Platform,
    Pressable,
    RefreshControl,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const filterOptions = [
  "All customers",
  "Agents",
  "Active",
  "With shipments",
  "No email",
];

export default function Customers() {
  const [selectedFilter, setSelectedFilter] = useState("All customers");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<"detailed" | "summary" | "">("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["customers-infinite", debouncedSearch],
    queryFn: ({ pageParam = 1 }) => {
      return getCustomers(pageParam as number, 20, debouncedSearch);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const customers = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const customerStats = useMemo(() => {
    const total = data?.pages[0]?.total ?? customers.length;
    const active = total; // Assuming all fetched are active if activeCount is not provided
    const agents = data?.pages[0]?.agentsCount ?? customers.filter(
      (c) => c.type === CustomerType.AGENT
    ).length;

    return [
      { label: "Total", value: total },
      { label: "Active", value: active },
      { label: "Agents", value: agents },
    ];
  }, [data, customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (!customer) return false;
      
      const matchesSearch = true; // Handled by server
      switch (selectedFilter) {
        case "Agents":
          return customer.type === CustomerType.AGENT;
        case "No email":
          return !customer.email?.trim();
        case "Active":
        case "With shipments":
          return true;
        default:
          return true;
      }
    });
  }, [customers, selectedFilter]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setShowAddModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingCustomer(null);
  };

  // Map customers into the shape expected by GenerateReportModal
  const customerOptions = customers.map((customer) => ({
    id: customer._id,
    fullName: customer.name,
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
        <Text className="text-lg font-semibold text-[#1A293B]">Customers</Text>
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

      <FlatList
        className="flex-1"
        data={filteredCustomers}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#1A293B"
            colors={["#1A293B"]}
          />
        }
        ListHeaderComponent={
          <View className="px-4 pt-6">
            {/* Stats */}
            <View className="flex-row justify-between mb-6">
              {customerStats.map((stat) => (
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

            {/* Search */}
            <Input className="mb-4">
              <InputSlot className="pl-3">
                <Ionicons name="search" size={20} color="#999" />
              </InputSlot>
              <InputField
                placeholder="Search by name, email, or phone"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="text-[#1A293B]"
              />
            </Input>

            {/* Filters */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {filterOptions.map((option) => {
                const isSelected = selectedFilter === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setSelectedFilter(option)}
                    android_ripple={{ color: "rgba(255,255,255,0.1)" }}>
                    <View
                      className={`px-4 py-2 rounded-full border ${
                        isSelected
                          ? "bg-[#1A293B] border-[#1A293B]"
                          : "bg-transparent border-[#1A293B]"
                      }`}>
                      <Text
                        className={`text-sm font-medium ${
                          isSelected ? "text-white" : "text-[#1A293B]"
                        }`}>
                        {option}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={() => setShowReportModal(true)}
                android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                className="flex-1">
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
                onPress={handleOpenAdd}
                android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                className="flex-1">
                <View className="bg-[#1A293B] rounded-full px-3 py-2 flex-row items-center justify-center">
                  <Ionicons name="add" size={16} color="white" />
                  <Text className="text-white font-semibold text-xs ml-2">
                    Add customer
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item: customer }) => (
          <View className="px-4 mb-4">
            <View className="bg-white rounded-2xl border border-gray-100 p-4">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-[#1A293B]">
                    {customer.name}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Type:{" "}
                    {customer.type === CustomerType.AGENT ? "Agent" : "Client"}
                    {customer.type === CustomerType.AGENT && customer.agentsCount !== undefined && ` (${customer.agentsCount} agents)`}
                  </Text>
                </View>
                <View className="bg-green-100 rounded-lg px-3 py-1">
                  <Text className="text-xs font-semibold text-green-700">
                    {customer.location}
                  </Text>
                </View>
              </View>

              {/* Table Info */}
              <View className="mb-4">
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-sm text-gray-500">Email</Text>
                  <Text className="text-sm font-semibold text-[#1A293B]">
                    {customer.email || "N/A"}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-sm text-gray-500">Phone number</Text>
                  <Text className="text-sm font-semibold text-[#1A293B]">
                    {customer.phone || "N/A"}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => router.push(`/customer-details?id=${customer._id}`)}
                  android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                  className="flex-1">
                  <View className="bg-[#1A293B] rounded-full px-3 py-2 items-center">
                    <Text className="text-sm font-semibold text-white">View</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => handleEditCustomer(customer)}
                  android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                  className="flex-1">
                  <View className="bg-[#E5E7EB] rounded-full px-3 py-2 items-center">
                    <Text className="text-sm font-semibold text-[#1A293B]">
                      Edit
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          <>
            {isFetchingNextPage && (
              <View className="py-4">
                <ActivityIndicator color="#1A293B" />
              </View>
            )}
            {filteredCustomers.length === 0 && !isLoading && (
              <Text className="text-center text-gray-500 mt-4">
                No customers found
              </Text>
            )}
            <View style={{ height: 32 }} />
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="pt-10">
              <ActivityIndicator size="large" color="#1A293B" />
            </View>
          ) : null
        }
      />

      <AddCustomerModal
        visible={showAddModal}
        onClose={handleCloseModal}
        customerId={editingCustomer?._id}
        initialData={
          editingCustomer
            ? {
                name: editingCustomer.name,
                type: editingCustomer.type,
                email: editingCustomer.email,
                phone: editingCustomer.phone,
                address: editingCustomer.address,
                location: editingCustomer.location,
                paymentTerms: editingCustomer.paymentTerms,
                notes: editingCustomer.notes,
                partnerId: editingCustomer.partnerId,
              }
            : undefined
        }
      />

      {/* Generate Report Modal */}
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
              type: "customers" as const,
              mode,
            };
            
            // Add customerId if a customer is selected
            if (data.customerId) {
              payload.customerId = data.customerId;
            }

            console.log("[customers] Generating report with payload:", {
              payload,
              reportType: data.reportType,
              customerId: data.customerId,
              mode,
            });

            const buffer = await exportExcelReport(payload);

            const filename = `customers-${mode}-${new Date()
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
            console.log("[reports] export-excel error (customers)", {
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
