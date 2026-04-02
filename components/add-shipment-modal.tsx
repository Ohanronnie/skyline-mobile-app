import { CustomSelect } from "@/components/custom-select";
import { Box } from "@/components/ui/box";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface AddShipmentModalProps {
  visible: boolean;
  onClose: () => void;
  shipmentId?: string;
  initialData?: {
    trackingNumber?: string;
    customerIds?: string[];
    cbm?: string;
    status?: string;
    container?: string;
    originWarehouse?: string;
    currentWarehouse?: string;
    description?: string;
    partnerIds?: string[];
  };
}

import BarcodeScanner from "@/components/BarcodeScanner";
import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast,
} from "@/components/ui/toast";
import {
  useAllContainers,
  useCreateShipment,
  useCustomers,
  useInfiniteCustomers,
  useInfinitePartners,
  usePartners,
  useUpdateShipment,
  useWarehouses,
} from "@/hooks/useShipments";
import {
  Container,
  Customer,
  Partner,
  ShipmentStatus,
  Warehouse,
} from "@/lib/api";
import { customerMatchesSearchQuery } from "@/lib/customer-search";
import { z } from "zod";

// Validation schema - only tracking number and status are required
const shipmentSchema = z.object({
  trackingNumber: z.string().min(1, "Tracking number is required"),
  customerIds: z
    .array(z.string())
    .max(6, "Maximum 6 customers allowed")
    .optional(),
  partnerIds: z
    .array(z.string())
    .max(6, "Maximum 6 partners allowed")
    .optional(),
  status: z.nativeEnum(ShipmentStatus, { message: "Status is required" }),
  cbm: z.number().positive("CBM must be a positive number").optional(),
  containerId: z.string().optional(),
  originWarehouseId: z.string().optional(),
  currentWarehouseId: z.string().optional(),
  description: z.string().optional(),
});

export function AddShipmentModal({
  visible,
  onClose,
  shipmentId,
  initialData,
}: AddShipmentModalProps) {
  const [trackingNumber, setTrackingNumber] = useState(
    initialData?.trackingNumber || "",
  );
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>(
    initialData?.customerIds || [],
  );
  const [cbm, setCbm] = useState(initialData?.cbm || "");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedPartners, setSelectedPartners] = useState<string[]>(
    initialData?.partnerIds || [],
  );
  const [partnerSearch, setPartnerSearch] = useState("");
  const [status, setStatus] = useState(initialData?.status || "");
  const [container, setContainer] = useState(initialData?.container || "");
  const [originWarehouse, setOriginWarehouse] = useState(
    initialData?.originWarehouse || "",
  );
  const [currentWarehouse, setCurrentWarehouse] = useState(
    initialData?.currentWarehouse || "",
  );
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [showScanner, setShowScanner] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  // Cache for customer/partner names to avoid "Unknown" when search is cleared
  const [resolvedCustomers, setResolvedCustomers] = useState<Record<string, Customer>>({});
  const [resolvedPartners, setResolvedPartners] = useState<Record<string, Partner>>({});

  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState("");
  const [debouncedPartnerSearch, setDebouncedPartnerSearch] = useState("");

  // Debounce customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomerSearch(customerSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Debounce partner search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPartnerSearch(partnerSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [partnerSearch]);

  const {
    data: infiniteCustomers,
    fetchNextPage: fetchNextCustomers,
    hasNextPage: hasMoreCustomers,
    isFetchingNextPage: isFetchingMoreCustomers,
  } = useInfiniteCustomers(debouncedCustomerSearch);

  const {
    data: infinitePartners,
    fetchNextPage: fetchNextPartners,
    hasNextPage: hasMorePartners,
    isFetchingNextPage: isFetchingMorePartners,
  } = useInfinitePartners(debouncedPartnerSearch);

  const customers = React.useMemo(() => {
    return infiniteCustomers?.pages.flatMap((page) => page.data) || [];
  }, [infiniteCustomers]);

  const partnersList = React.useMemo(() => {
    return infinitePartners?.pages.flatMap((page) => page.data) || [];
  }, [infinitePartners]);

  const {
    data: containers,
    isLoading: isLoadingContainers,
    error: containersError,
  } = useAllContainers({ enabled: visible });
  const { data: warehouses } = useWarehouses({ enabled: visible });
  const { data: partners } = usePartners({ enabled: visible });
  const createMutation = useCreateShipment();
  const updateMutation = useUpdateShipment();
  const toast = useToast();

  // Update resolved customers/partners when any relevant data changes
  useEffect(() => {
    const allFetched = [...customers, ...partnersList];
    if (allFetched.length > 0) {
      setResolvedCustomers((prev) => {
        const next = { ...prev };
        customers.forEach((c) => {
          if (c?._id) next[c._id] = c;
        });
        return next;
      });
      setResolvedPartners((prev) => {
        const next = { ...prev };
        partnersList.forEach((p) => {
          if (p?._id) next[p._id] = p;
        });
        return next;
      });
    }
  }, [customers, partnersList]);

  // Also update from the static partners list if available
  useEffect(() => {
    if (partners && partners.length > 0) {
      setResolvedPartners((prev) => {
        const next = { ...prev };
        partners.forEach((p: Partner) => {
          if (p?._id) next[p?._id] = p;
        });
        return next;
      });
    }
  }, [partners]);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      // 1. Resolve IDs from enriched data if possible
      const rawCustomerIds = initialData.customerIds || [];
      const rawPartnerIds = initialData.partnerIds || [];

      // Extract IDs if they were objects
      const customerIds = (rawCustomerIds as any[]).map((c: any) => typeof c === 'string' ? c : c?._id);
      const partnerIds = (rawPartnerIds as any[]).map((p: any) => typeof p === 'string' ? p : p?._id);

      setTrackingNumber(initialData.trackingNumber || "");
      setSelectedCustomers(customerIds);
      setCbm(initialData.cbm || "");
      setSelectedPartners(partnerIds);
      setStatus(initialData.status || "");
      setContainer(initialData.container || "");
      setOriginWarehouse(initialData.originWarehouse || "");
      setCurrentWarehouse(initialData.currentWarehouse || "");
      setDescription(initialData.description || "");
      setErrors({});
      setGeneralError("");

      // 2. Populate the resolve cache from enriched objects in initialData
      setResolvedCustomers((prev) => {
        const next = { ...prev };
        rawCustomerIds.forEach((item: any) => {
          if (item && typeof item !== "string" && item._id) {
            next[item._id] = item;
          }
        });
        return next;
      });

      setResolvedPartners((prev) => {
        const next = { ...prev };
        rawPartnerIds.forEach((item: any) => {
          if (item && typeof item !== "string" && item._id) {
            next[item._id] = item;
          }
        });
        return next;
      });

    } else if (visible) {
      resetForm();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setTrackingNumber("");
    setSelectedCustomers([]);
    setCbm("");
    setCustomerSearch("");
    setSelectedPartners([]);
    setPartnerSearch("");
    setStatus("");
    setContainer("");
    setOriginWarehouse("");
    setCurrentWarehouse("");
    setDescription("");
    setShowScanner(false);
    setErrors({});
    setGeneralError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    // Clear previous errors
    setErrors({});
    setGeneralError("");

    // Build shipment data object
    const rawShipmentData = {
      trackingNumber,
      customerIds: selectedCustomers.length > 0 ? selectedCustomers : undefined,
      partnerIds: selectedPartners.length > 0 ? selectedPartners : undefined,
      cbm: cbm ? parseFloat(cbm) : undefined,
      status: status as ShipmentStatus,
      containerId: container || undefined,
      originWarehouseId: originWarehouse || undefined,
      currentWarehouseId: currentWarehouse || undefined,
      description: description || undefined,
    };

    // Remove empty strings and undefined values
    const shipmentData = Object.fromEntries(
      Object.entries(rawShipmentData).filter(
        ([_, value]) => value !== undefined && value !== "" && value !== null,
      ),
    ) as typeof rawShipmentData;

    // Validate with Zod
    const validation = shipmentSchema.safeParse(shipmentData);
    const fieldErrors: Record<string, string> = {};

    console.log("Validation result:", validation);

    if (!validation.success) {
      console.log("Validation error object:", validation.error);
      console.log("Validation error issues:", validation.error?.issues);

      // Map errors to field names
      validation.error?.issues?.forEach((issue: z.ZodIssue) => {
        const fieldName = issue.path[0] as string;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
    }

    // If there are any errors, set state and return
    if (Object.keys(fieldErrors).length > 0) {
      console.log("Field errors:", fieldErrors);
      setErrors(fieldErrors);
      setGeneralError("Please check the form for errors below");
      return;
    }

    console.log("Submitting shipment:", shipmentData);
    console.log("Is updating:", !!shipmentId);

    if (shipmentId) {
      // Update existing shipment
      console.log("Update mutation pending:", updateMutation.isPending);
      updateMutation.mutate(
        { id: shipmentId, data: shipmentData },
        {
          onSuccess: () => {
            console.log("Update success!");
            toast.show({
              placement: "top",
              render: ({ id }) => (
                <Toast
                  nativeID={"toast-" + id}
                  action="success"
                  variant="outline"
                  style={{ zIndex: 9999 }}
                >
                  <View>
                    <ToastTitle>Success</ToastTitle>
                    <ToastDescription>
                      Shipment updated successfully!
                    </ToastDescription>
                  </View>
                </Toast>
              ),
            });
            handleClose();
          },
          onError: (error: any) => {
            console.log("Update error (full):", JSON.stringify(error, null, 2));
            console.log(
              "Update error (response):",
              JSON.stringify(error.response, null, 2),
            );

            const errorMessage =
              error.response?.data?.message ||
              "An error occurred while updating the shipment. Please check your inputs and try again.";
            setGeneralError(errorMessage);
          },
        },
      );
    } else {
      // Create new shipment
      console.log("Create mutation pending:", createMutation.isPending);
      createMutation.mutate(shipmentData, {
        onSuccess: () => {
          console.log("Create success!");
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast
                nativeID={"toast-" + id}
                action="success"
                variant="outline"
                style={{ zIndex: 9999 }}
              >
                <View>
                  <ToastTitle>Success</ToastTitle>
                  <ToastDescription>
                    Shipment created successfully!
                  </ToastDescription>
                </View>
              </Toast>
            ),
          });
          handleClose();
        },
        onError: (error: any) => {
          console.log("Create error (full):", JSON.stringify(error, null, 2));
          console.log(
            "Create error (response):",
            JSON.stringify(error.response, null, 2),
          );

          const errorMessage =
            error.response?.data?.message ||
            "An error occurred while creating the shipment. Please check your inputs and try again.";
          setGeneralError(errorMessage);
        },
      });
    }
  };

  const handleBarcodeScan = (data: string, type: string) => {
    setTrackingNumber(data);
    setShowScanner(false);
  };

  // Filter customers/partners to hide already selected ones
  const displayCustomers = (customers || []).filter(
    (c: Customer) => c && c._id && !selectedCustomers.includes(c._id),
  );
  const displayPartners = (partnersList as Partner[] || []).filter(
    (p: Partner) => p && p._id && !selectedPartners.includes(p._id),
  );

  const containerOptions =
    containers?.map((c: Container) => ({
      label: c.containerNumber,
      value: c._id,
    })) || [];

  console.log(
    "[AddShipmentModal] containerOptions count:",
    containerOptions.length,
  );

  const warehouseOptions =
    warehouses?.map((w: Warehouse) => ({
      label: w.name,
      value: w._id,
    })) || [];

  const statusOptions = Object.values(ShipmentStatus).map((s) => ({
    label: s.replace(/_/g, " ").toUpperCase(),
    value: s,
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-white">
        {/* iOS Handle Indicator */}
        <View className="items-center pt-3 pb-1">
          <View className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <View className="flex-1 p-6 relative overflow-hidden">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-8">
              <Text className="text-2xl font-bold text-[#1A293B]">
                {initialData ? "Edit Shipment" : "New Shipment"}
              </Text>
              <TouchableOpacity 
                onPress={handleClose}
                className="bg-gray-200 w-8 h-8 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#1A293B" />
              </TouchableOpacity>
            </View>

            {/* Error Banner */}
            {(Object.keys(errors).length > 0 || generalError) && (
              <View className="mb-6 bg-red-50 p-4 rounded-xl flex-row items-center gap-3 border border-red-100">
                <View className="w-8 h-8 bg-red-100 rounded-full items-center justify-center">
                  <Ionicons name="alert" size={16} color="#EF4444" />
                </View>
                <Text className="text-red-800 font-medium flex-1">
                  {generalError || "Please check the errors below"}
                </Text>
              </View>
            )}

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerClassName="pb-10"
              keyboardShouldPersistTaps="handled"
            >
              <View onStartShouldSetResponder={() => true}>
                {/* SHIPMENT DETAILS SECTION */}
                <View className="mb-8">
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1 mb-2">
                    Shipment details
                  </Text>
                  <View className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
                    {/* Tracking Number */}
                    <View>
                      <Text className="text-gray-700 font-medium mb-2 text-sm">
                        Tracking number
                      </Text>
                      <View className="flex-row gap-3 items-center">
                        <View className="flex-1">
                          <Input
                            variant="outline"
                            size="md"
                            className="bg-gray-50 rounded-lg border-gray-200 h-11"
                          >
                            <InputField
                              placeholder="Enter tracking number"
                              placeholderTextColor="#999"
                              value={trackingNumber}
                              onChangeText={setTrackingNumber}
                              className="text-gray-900"
                            />
                          </Input>
                        </View>
                        <Pressable
                          onPress={() => setShowScanner(true)}
                          android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                        >
                          <View className="w-11 h-11 border border-gray-200 rounded-lg items-center justify-center bg-gray-50">
                            <Ionicons
                              name="camera-outline"
                              size={22}
                              color="#1A293B"
                            />
                          </View>
                        </Pressable>
                      </View>
                      {errors.trackingNumber && (
                        <Text className="text-red-500 text-xs mt-1">
                          {errors.trackingNumber}
                        </Text>
                      )}
                    </View>

                    {/* CBM */}
                    <View className="mt-4">
                      <Text className="text-gray-700 font-medium mb-2 text-sm">
                        CBM
                      </Text>
                      <Input
                        variant="outline"
                        size="md"
                        className="bg-gray-50 rounded-lg border-gray-200 h-11"
                      >
                        <InputField
                          placeholder="0.00"
                          placeholderTextColor="#999"
                          value={cbm.toString()}
                          onChangeText={setCbm}
                          keyboardType="numeric"
                          className="text-gray-900"
                        />
                      </Input>
                      {errors.cbm && (
                        <Text className="text-red-500 text-xs mt-1">
                          {errors.cbm}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* STATUS & LOGISTICS SECTION */}
                <View className="mb-8" style={{ zIndex: 100 }}>
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1 mb-2">
                    Status & Logistics
                  </Text>
                  <View className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
                    <View className="flex-row gap-4">
                      <View className="flex-1 z-[60]">
                        <Text className="text-gray-700 font-medium mb-2 text-sm">Status</Text>
                        <CustomSelect
                          options={statusOptions}
                          selectedValue={status}
                          onValueChange={setStatus}
                          placeholder="Select"
                          variant="filled"
                        />
                      </View>
                      <View className="flex-1 z-[60]">
                        <Text className="text-gray-700 font-medium mb-2 text-sm">Container</Text>
                        <CustomSelect
                          options={containerOptions.length > 0 ? containerOptions : [{ label: "Empty", value: "" }]}
                          selectedValue={container}
                          onValueChange={setContainer}
                          placeholder="Select"
                          variant="filled"
                        />
                      </View>
                    </View>

                    <View className="flex-row gap-4 mt-4">
                      <View className="flex-1 z-[50]">
                        <Text className="text-gray-700 font-medium mb-2 text-sm">Origin</Text>
                        <CustomSelect
                          options={warehouseOptions}
                          selectedValue={originWarehouse}
                          onValueChange={setOriginWarehouse}
                          placeholder="Select"
                          variant="filled"
                        />
                      </View>
                      <View className="flex-1 z-[50]">
                        <Text className="text-gray-700 font-medium mb-2 text-sm">Current</Text>
                        <CustomSelect
                          options={warehouseOptions}
                          selectedValue={currentWarehouse}
                          onValueChange={setCurrentWarehouse}
                          placeholder="Select"
                          variant="filled"
                        />
                      </View>
                    </View>
                  </View>
                </View>

                {/* CUSTOMERS SECTION */}
                <View className="mb-8">
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1 mb-2">
                    Customers ({selectedCustomers.length}/6)
                  </Text>
                  <View className="bg-white rounded-xl border border-gray-100 p-4">
                    <Input
                      variant="outline"
                      size="md"
                      className="bg-gray-50 rounded-lg border-gray-200 mb-2 h-11"
                    >
                      <InputSlot className="pl-3">
                        <Ionicons name="search" size={18} color="#999" />
                      </InputSlot>
                      <InputField
                        placeholder="Search customers..."
                        placeholderTextColor="#999"
                        value={customerSearch}
                        onChangeText={setCustomerSearch}
                        className="text-gray-900"
                      />
                    </Input>

                    {/* Customer Dropdown */}
                    {displayCustomers.length > 0 && selectedCustomers.length < 6 && (
                      <ScrollView
                        style={{ maxHeight: 180 }}
                        className="bg-white rounded-lg border border-gray-100 my-2"
                        nestedScrollEnabled
                      >
                        {displayCustomers.map((customer: Customer) => (
                          <TouchableOpacity
                            key={customer._id}
                            onPress={() => {
                              // Cache the object instantly to avoid 'Unknown' when search changes
                              setResolvedCustomers(prev => ({ ...prev, [customer._id]: customer }));
                              setSelectedCustomers([...selectedCustomers, customer._id]);
                              setCustomerSearch("");
                            }}
                            className="p-3 border-b border-gray-50 flex-row justify-between items-center"
                          >
                            <Text className="text-gray-800 font-medium">{customer.name}</Text>
                            <Ionicons name="add-circle" size={20} color="#3b82f6" />
                          </TouchableOpacity>
                        ))}
                        {hasMoreCustomers && (
                          <TouchableOpacity
                            onPress={() => fetchNextCustomers()}
                            className="p-3 items-center"
                          >
                            <Text className="text-blue-500 text-xs font-semibold">LOAD MORE</Text>
                          </TouchableOpacity>
                        )}
                      </ScrollView>
                    )}

                    {/* Customer Chips */}
                    <View className="flex-row flex-wrap gap-2 mt-2">
                      {selectedCustomers.map((id) => (
                        <View key={id} className="bg-blue-50 border border-blue-100 rounded-full px-3 py-1 flex-row items-center">
                          <Text className="text-blue-700 text-xs font-medium mr-1">
                            {resolvedCustomers[id]?.name || (customers?.find((c: Customer) => c?._id === id)?.name) || "Loading..."}
                          </Text>
                          <TouchableOpacity onPress={() => setSelectedCustomers(selectedCustomers.filter(sid => sid !== id))}>
                            <Ionicons name="close-circle" size={16} color="#3b82f6" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* PARTNERS SECTION */}
                <View className="mb-8">
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1 mb-2">
                    Partners ({selectedPartners.length}/6)
                  </Text>
                  <View className="bg-white rounded-xl border border-gray-100 p-4">
                    <Input
                      variant="outline"
                      size="md"
                      className="bg-gray-50 rounded-lg border-gray-200 mb-2 h-11"
                    >
                      <InputSlot className="pl-3">
                        <Ionicons name="search" size={18} color="#999" />
                      </InputSlot>
                      <InputField
                        placeholder="Search partners..."
                        placeholderTextColor="#999"
                        value={partnerSearch}
                        onChangeText={setPartnerSearch}
                        className="text-gray-900"
                      />
                    </Input>

                    {/* Partner Dropdown */}
                    {displayPartners.length > 0 && selectedPartners.length < 6 && (
                      <ScrollView
                        style={{ maxHeight: 180 }}
                        className="bg-white rounded-lg border border-gray-100 my-2"
                        nestedScrollEnabled
                      >
                        {displayPartners.map((partner: Partner) => (
                          <TouchableOpacity
                            key={partner._id}
                            onPress={() => {
                              // Cache the object instantly to avoid 'Unknown' when search changes
                              setResolvedPartners(prev => ({ ...prev, [partner._id]: partner }));
                              setSelectedPartners([...selectedPartners, partner._id]);
                              setPartnerSearch("");
                            }}
                            className="p-3 border-b border-gray-100 flex-row justify-between items-center"
                          >
                            <Text className="text-gray-800 font-medium">{partner.name}</Text>
                            <Ionicons name="add-circle" size={20} color="#10b981" />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    {/* Partner Chips */}
                    <View className="flex-row flex-wrap gap-2 mt-2">
                      {selectedPartners.map((id) => (
                        <View key={id} className="bg-green-50 border border-green-100 rounded-full px-3 py-1 flex-row items-center">
                          <Text className="text-green-700 text-xs font-medium mr-1">
                            {resolvedPartners[id]?.name || (partnersList?.find((p: Partner) => p?._id === id)?.name) || "Loading..."}
                          </Text>
                          <TouchableOpacity onPress={() => setSelectedPartners(selectedPartners.filter(sid => sid !== id))}>
                            <Ionicons name="close-circle" size={16} color="#10b981" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* DESCRIPTION SECTION */}
                <View className="mb-10">
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1 mb-2">
                    Notes
                  </Text>
                  <View className="bg-white rounded-xl border border-gray-100 p-4">
                    <Input
                      variant="outline"
                      size="md"
                      className="bg-gray-50 rounded-lg border-gray-200 min-h-[100px]"
                    >
                      <InputField
                        placeholder="Enter description..."
                        placeholderTextColor="#999"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        className="text-gray-900 py-2"
                        textAlignVertical="top"
                      />
                    </Input>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* FIXED FOOTER */}
            <View className="pt-4 pb-10 px-2 bg-white border-t border-gray-100 -mx-6">
              <View className="flex-row gap-4 px-6">
                <TouchableOpacity
                  onPress={handleClose}
                  className="flex-1 py-4 rounded-xl border border-gray-300 items-center bg-white"
                >
                  <Text className="text-gray-600 font-bold text-lg">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className={`flex-1 py-4 rounded-xl items-center flex-row justify-center shadow-sm ${
                    createMutation.isPending || updateMutation.isPending ? "bg-gray-400" : "bg-primary-blue"
                  }`}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name={initialData ? "save-outline" : "add-outline"} size={22} color="white" />
                      <Text className="text-white font-bold text-lg ml-2">
                        {initialData ? "Update" : "Create"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Barcode Scanner Overlay */}
        {showScanner && (
          <BarcodeScanner
            onClose={() => setShowScanner(false)}
            onScan={handleBarcodeScan}
          />
        )}
      </View>
    </Modal>
  );
}
