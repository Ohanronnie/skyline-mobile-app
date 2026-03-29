import { ShipmentStatus } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
  customers: CustomerOption[];
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
  customers,
  reportType,
  selectedCustomer,
  selectedStatus = "",
  onReportTypeChange,
  onSelectedCustomerChange,
  onStatusChange,
  onSubmit,
}: GenerateReportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Single selection: toggle the customer (select or deselect)
  const handleCustomerSelect = (customerId: string) => {
    if (selectedCustomer === customerId) {
      // Deselect if clicking on already selected customer
      onSelectedCustomerChange(null);
    } else {
      // Select the new customer (only one at a time)
      onSelectedCustomerChange(customerId);
    }
  };

  // Get unique customers by fullName
  const uniqueCustomers = customers.filter(
    (customer, index, self) =>
      index === self.findIndex((c) => c.fullName === customer.fullName)
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="w-full">
          <View className="bg-white rounded-3xl p-6 max-h-[85%] relative">
            <ScrollView showsVerticalScrollIndicator={true}>
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Pressable
                  onPress={isSubmitting ? undefined : onClose}
                  android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
                  <Ionicons name="close" size={24} color="#1A293B" />
                </Pressable>
              </View>

              {/* Report Type */}
              <View className="mb-6">
                <Text className="text-lg font-bold text-[#1A293B] mb-3">
                  Report type
                </Text>
                <CustomSelect
                  options={[
                    {
                      label: "Detailed report – all shipment information",
                      value: "detailed",
                    },
                    {
                      label: "Summary report – key metrics only",
                      value: "summary",
                    },
                  ]}
                  selectedValue={reportType || undefined}
                  onValueChange={(value) =>
                    onReportTypeChange(value as "detailed" | "summary" | "")
                  }
                  placeholder="Select report type"
                  className="mb-1"
                  variant="filled"
                  direction="down"
                />
              </View>

              {/* Shipment Status Filter */}
              <View className="mb-6">
                <Text className="text-lg font-bold text-[#1A293B] mb-3">
                  Shipment status
                </Text>
                <CustomSelect
                  options={statusOptions}
                  selectedValue={selectedStatus || undefined}
                  onValueChange={(value) =>
                    onStatusChange?.(value as ShipmentStatus | "")
                  }
                  placeholder="Select status (optional)"
                  className="mb-1"
                  variant="filled"
                  direction="down"
                />
              </View>

              {/* Select Customer (Single Selection) */}
              <View className="mb-6">
                <View className="flex-row justify-between items-center">
                  <Text className="text-base text-gray-600">
                    Select customer (optional)
                  </Text>
                  {selectedCustomer && (
                    <Pressable
                      onPress={() => onSelectedCustomerChange(null)}
                      android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
                      <Text className="text-primary-blue font-semibold text-base">
                        Clear
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Customer Radio Buttons - Single Selection */}
              <View className="mb-6">
                {uniqueCustomers.map((customer) => (
                  <Pressable
                    key={customer.id}
                    onPress={() => handleCustomerSelect(customer.id)}
                    className="mb-3">
                    <View className="border border-gray-300 rounded-xl p-4 flex-row items-start">
                      <View className="w-5 h-5 rounded-full border-2 border-[#1A293B] items-center justify-center mr-3 mt-0.5">
                        {selectedCustomer === customer.id && (
                          <View className="w-3 h-3 rounded-full bg-[#1A293B]" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-[#1A293B]">
                          {customer.fullName}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>

              {/* View Report Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                android_ripple={{ color: "rgba(255,255,255,0.2)" }}>
                <View
                  className={`bg-primary-blue rounded-full px-4 py-3 items-center flex-row justify-center ${
                    isSubmitting ? "opacity-80" : ""
                  }`}>
                  {isSubmitting ? (
                    <>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text className="text-white font-semibold text-base ml-2">
                        Generating...
                      </Text>
                    </>
                  ) : (
                    <Text className="text-white font-semibold text-base">
                      View report
                    </Text>
                  )}
                </View>
              </Pressable>
            </ScrollView>

            {isSubmitting && (
              <View className="absolute inset-0 bg-white/60 rounded-3xl items-center justify-center">
                <ActivityIndicator size="large" color="#1A293B" />
                <Text className="mt-2 text-sm font-semibold text-[#1A293B]">
                  Generating report...
                </Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
