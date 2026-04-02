import { ShipmentStatus } from "@/lib/api";
import { useInfiniteCustomers } from "@/hooks/useShipments";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { CustomSelect } from "./custom-select";

interface CustomerOption {
  id: string;
  fullName: string;
}

interface GenerateReportModalProps {
  visible: boolean;
  onClose: () => void;
  // Keep customers prop for backward compatibility, but we'll fetch our own if not provided or empty
  customers?: CustomerOption[];
  reportType: "detailed" | "summary" | "";
  selectedCustomer: string | null;
  selectedStatus?: ShipmentStatus | "";
  onReportTypeChange: (type: "detailed" | "summary" | "") => void;
  onSelectedCustomerChange: (customerId: string | null) => void;
  onStatusChange?: (status: ShipmentStatus | "") => void;
  onSubmit?: (data: {
    reportType: "detailed" | "summary" | "";
    customerId: string | null;
    status?: ShipmentStatus | "";
  }) => void | Promise<void>;
}

export function GenerateReportModal({
  visible,
  onClose,
  customers: propCustomers = [],
  reportType,
  selectedCustomer,
  selectedStatus = "",
  onReportTypeChange,
  onSelectedCustomerChange,
  onStatusChange,
  onSubmit,
}: GenerateReportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // Local state to cache the selected customer object so we don't lose its name
  const [selectedCustomerObject, setSelectedCustomerObject] = useState<CustomerOption | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync selectedCustomerObject when selectedCustomer ID changes from prop or after finding it in list
  useEffect(() => {
    if (!selectedCustomer) {
      setSelectedCustomerObject(null);
    }
  }, [selectedCustomer]);

  // Fetch customers from API
  const {
    data: customersData,
    isLoading: isLoadingCustomers,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCustomers(debouncedSearch);

  // Combine prop customers (if any) with fetched customers, prioritizing fetched ones for search
  const fetchedCustomers = useMemo(() => {
    return (
      customersData?.pages.flatMap((page) =>
        page.data.map((c: any) => ({ id: c._id, fullName: c.name }))
      ) ?? []
    );
  }, [customersData]);

  // If we have a search query, only show fetched results. 
  // Otherwise, if propCustomers exist, show them (though usually we want the full list).
  const displayCustomers = useMemo(() => {
    if (debouncedSearch || fetchedCustomers.length > 0) {
      return fetchedCustomers;
    }
    // Fallback to prop customers if no search and no fetched data yet
    return propCustomers;
  }, [debouncedSearch, fetchedCustomers, propCustomers]);

  // Status options for the select
  const statusOptions = [
    { label: "All Statuses", value: "" },
    ...Object.values(ShipmentStatus).map((status) => ({
      label: status
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      value: status,
    })),
  ];

  const handleSubmit = async () => {
    if (!onSubmit) {
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        reportType,
        customerId: selectedCustomer,
        status: selectedStatus,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerSelect = (customer: CustomerOption) => {
    if (selectedCustomer === customer.id) {
      onSelectedCustomerChange(null);
      setSelectedCustomerObject(null);
    } else {
      onSelectedCustomerChange(customer.id);
      setSelectedCustomerObject(customer);
    }
  };

  const renderCustomerItem = ({ item: customer }: { item: CustomerOption }) => (
    <Pressable
      onPress={() => handleCustomerSelect(customer)}
      className="mb-3">
      <View
        className={`border rounded-xl p-4 flex-row items-start ${
          selectedCustomer === customer.id
            ? "border-primary-blue bg-blue-50"
            : "border-gray-200"
        }`}>
        <View
          className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 mt-0.5 ${
            selectedCustomer === customer.id
              ? "border-primary-blue"
              : "border-[#1A293B]"
          }`}>
          {selectedCustomer === customer.id && (
            <View className="w-3 h-3 rounded-full bg-primary-blue" />
          )}
        </View>
        <View className="flex-1">
          <Text
            className={`text-base font-semibold ${
              selectedCustomer === customer.id ? "text-primary-blue" : "text-[#1A293B]"
            }`}>
            {customer.fullName}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  // Registry for resolving selected customer name even if search results change
  const allKnownCustomersRegistry = useMemo(() => {
    const registry = new Map<string, CustomerOption>();
    propCustomers.forEach(c => registry.set(c.id, c));
    fetchedCustomers.forEach(c => registry.set(c.id, c));
    if (selectedCustomerObject) registry.set(selectedCustomerObject.id, selectedCustomerObject);
    return registry;
  }, [propCustomers, fetchedCustomers, selectedCustomerObject]);

  // Unified list logic with deduplication and selection persistence
  const finalDisplayList = useMemo(() => {
    const seen = new Set<string>();
    const list: CustomerOption[] = [];

    // Always put selected customer first if we have its name registered
    if (selectedCustomer) {
      const selectedObj = allKnownCustomersRegistry.get(selectedCustomer);
      if (selectedObj) {
        list.push(selectedObj);
        seen.add(selectedObj.id);
      }
    }

    // Add search results / prop customers
    displayCustomers.forEach((customer) => {
      if (!seen.has(customer.id)) {
        list.push(customer);
        seen.add(customer.id);
      }
    });

    return list;
  }, [displayCustomers, selectedCustomer, allKnownCustomersRegistry]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        {/* iOS Handle Indicator */}
        <View className="items-center pt-3 pb-1">
          <View className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1">
          <View className="flex-1 relative overflow-hidden">
            {/* Stationary Settings Header (Ensures dropdowns overlap everything) */}
            <View className="p-6 pb-2" style={{ zIndex: 100, elevation: 10 }}>
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-2xl font-bold text-[#1A293B]">Generate Report</Text>
                <Pressable
                  onPress={isSubmitting ? undefined : onClose}
                  className="bg-gray-200 w-8 h-8 rounded-full items-center justify-center">
                  <Ionicons name="close" size={20} color="#1A293B" />
                </Pressable>
              </View>

              {/* Settings-like Sections */}
              <View className="space-y-4">
                {/* Report Type */}
                <View className="z-[50]">
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1 mb-2">
                    Report Settings
                  </Text>
                  <View className="bg-white rounded-xl border border-gray-100 p-1">
                    <CustomSelect
                      options={[
                        { label: "Detailed report – all shipment information", value: "detailed" },
                        { label: "Summary report – key metrics only", value: "summary" },
                      ]}
                      selectedValue={reportType || undefined}
                      onValueChange={(value) => onReportTypeChange(value as "detailed" | "summary" | "")}
                      placeholder="Select report type"
                      className="mb-1"
                      variant="filled"
                      direction="down"
                    />
                  </View>
                </View>

                {/* Shipment Status Filter */}
                <View className="z-[40] mt-4">
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1 mb-2">
                    Status Filter
                  </Text>
                  <View className="bg-white rounded-xl border border-gray-100 p-1">
                    <CustomSelect
                      options={statusOptions}
                      selectedValue={selectedStatus || undefined}
                      onValueChange={(value) => onStatusChange?.(value as ShipmentStatus | "")}
                      placeholder="Select status (optional)"
                      className="mb-1"
                      variant="filled"
                      direction="down"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Scrollable Customer List */}
            <FlatList
              data={finalDisplayList}
              keyExtractor={(item) => item.id}
              renderItem={renderCustomerItem}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              className="flex-1 px-6"
              ListHeaderComponent={
                <View className="mt-6 mb-4">
                  <View className="flex-row justify-between items-center ml-1 mb-2">
                    <Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                      Customer Selection
                    </Text>
                    {selectedCustomer && (
                      <Pressable
                        onPress={() => onSelectedCustomerChange(null)}
                        android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
                        <Text className="text-primary-blue font-semibold text-xs uppercase tracking-tight">Clear Selection</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Customer Search Input */}
                  <Input
                    variant="outline"
                    size="md"
                    className="bg-white rounded-xl border-gray-200 mb-2 h-12"
                  >
                    <InputSlot className="pl-3">
                      <Ionicons name="search" size={18} color="#999" />
                    </InputSlot>
                    <InputField
                      placeholder="Search customers..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      className="text-gray-900"
                    />
                  </Input>
                </View>
              }
              ListFooterComponent={
                <View className="py-6 items-center mb-10">
                  {isFetchingNextPage ? (
                    <ActivityIndicator size="small" color="#1A293B" />
                  ) : (
                    hasNextPage && (
                      <Pressable 
                        onPress={() => fetchNextPage()}
                        className="py-2"
                      >
                        <Text className="text-primary-blue font-semibold">Load more results...</Text>
                      </Pressable>
                    )
                  )}
                </View>
              }
            />

            {/* Fixed Footer with Submit Button */}
            <View className="pt-4 pb-8 px-6 bg-white border-t border-gray-100">
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                className="active:opacity-80">
                <View
                  className="bg-primary-blue rounded-xl px-4 py-4 items-center flex-row justify-center shadow-sm">
                  {isSubmitting ? (
                    <>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text className="text-white font-semibold text-lg ml-2">Generating...</Text>
                    </>
                  ) : (
                    <Text className="text-white font-bold text-lg">View Report</Text>
                  )}
                </View>
              </Pressable>
            </View>

            {/* Full Screen Loading Overlay */}
            {isSubmitting && (
              <View className="absolute inset-0 bg-white/60 items-center justify-center">
                <ActivityIndicator size="large" color="#1A293B" />
                <Text className="mt-2 text-sm font-semibold text-[#1A293B]">Generating report...</Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
