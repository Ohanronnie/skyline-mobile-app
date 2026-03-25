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

  const { data: customers } = useCustomers({ enabled: visible });
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

  console.log("[AddShipmentModal] Visible:", visible);
  console.log("[AddShipmentModal] isLoadingContainers:", isLoadingContainers);
  console.log(
    "[AddShipmentModal] containers raw data:",
    JSON.stringify(containers),
  );
  console.log("[AddShipmentModal] containers data type:", typeof containers);
  console.log(
    "[AddShipmentModal] containers is array:",
    Array.isArray(containers),
  );
  console.log("[AddShipmentModal] containers length:", containers?.length);
  if (containersError)
    console.error("[AddShipmentModal] containersError:", containersError);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setTrackingNumber(initialData.trackingNumber || "");
      setSelectedCustomers(initialData.customerIds || []);
      setCbm(initialData.cbm || "");
      setSelectedPartners(initialData.partnerIds || []);
      setStatus(initialData.status || "");
      setContainer(initialData.container || "");
      setOriginWarehouse(initialData.originWarehouse || "");
      setCurrentWarehouse(initialData.currentWarehouse || "");
      setDescription(initialData.description || "");
      setErrors({});
      setGeneralError("");
    } else {
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

  // Filter customers based on search
  const filteredCustomers =
    customers?.filter((c: Customer) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()),
    ) || [];

  const customerOptions = filteredCustomers.map((c: Customer) => ({
    label: c.name,
    value: c._id,
  }));

  // Filter partners based on search
  const filteredPartners =
    partners?.filter((p: Partner) =>
      p.name.toLowerCase().includes(partnerSearch.toLowerCase()),
    ) || [];

  const partnerOptions = filteredPartners.map((p: Partner) => ({
    label: p.name,
    value: p._id,
  }));

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
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/50"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Box className="bg-white rounded-t-3xl h-[85%]">
            <View className="p-6 flex-1">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-bold text-gray-900">
                  {initialData ? "Edit shipment" : "New shipment"}
                </Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Error Banner */}
              {(Object.keys(errors).length > 0 || generalError) && (
                <View className="mb-4 bg-red-50 p-4 rounded-xl flex-row items-center gap-3 border border-red-100">
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
                contentContainerClassName="pb-6"
              >
                <View onStartShouldSetResponder={() => true}>
                  {/* Tracking Number */}
                  <View className="mb-6">
                    <Text className="text-gray-700 font-medium mb-2">
                      Tracking number
                    </Text>
                    <View className="flex-row gap-3 items-center">
                      <View className="flex-1">
                        <Input
                          variant="outline"
                          size="lg"
                          className="bg-white rounded-xl border-gray-200"
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
                        <View className="w-12 h-12 border-2 border-gray-300 rounded-xl items-center justify-center bg-white">
                          <Ionicons
                            name="camera-outline"
                            size={24}
                            color="#1A293B"
                          />
                        </View>
                      </Pressable>
                    </View>
                    {errors.trackingNumber && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.trackingNumber}
                      </Text>
                    )}
                  </View>

                  {/* Customer Group */}
                  <View className="mb-6">
                    <View className="mb-3">
                      <Text className="text-gray-700 font-medium mb-2">
                        Customers ({selectedCustomers.length}/6)
                      </Text>
                      <Input
                        variant="outline"
                        size="lg"
                        className="bg-white rounded-xl border-gray-200 mb-2"
                      >
                        <InputSlot className="pl-3">
                          <Ionicons name="search" size={20} color="#999" />
                        </InputSlot>
                        <InputField
                          placeholder="Search customer..."
                          placeholderTextColor="#999"
                          value={customerSearch}
                          onChangeText={setCustomerSearch}
                          className="text-gray-900"
                        />
                      </Input>
                    </View>

                    {/* Customer Dropdown List */}
                    {filteredCustomers.filter(
                      (c: Customer) => !selectedCustomers.includes(c._id),
                    ).length > 0 &&
                      selectedCustomers.length < 6 && (
                        <ScrollView
                          onStartShouldSetResponder={() => true}
                          style={{ maxHeight: 150 }}
                          className="bg-white rounded-xl border border-gray-200 mb-2 z-50"
                          showsVerticalScrollIndicator={true}
                        >
                          {filteredCustomers
                            .filter(
                              (c: Customer) =>
                                !selectedCustomers.includes(c._id),
                            )
                            .map((customer: Customer) => (
                              <TouchableOpacity
                                key={customer._id}
                                onPress={() => {
                                  if (
                                    !selectedCustomers.includes(customer._id)
                                  ) {
                                    setSelectedCustomers([
                                      ...selectedCustomers,
                                      customer._id,
                                    ]);
                                    setCustomerSearch("");
                                  }
                                }}
                                className="p-3 border-b border-gray-100 flex-row justify-between items-center"
                              >
                                <Text
                                  className="text-gray-900 flex-1"
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                >
                                  {customer.name}
                                </Text>
                                <Ionicons
                                  name="add-circle-outline"
                                  size={20}
                                  color="#3b82f6"
                                />
                              </TouchableOpacity>
                            ))}
                        </ScrollView>
                      )}

                    {/* Selected Customers Chips */}
                    {selectedCustomers.length > 0 && (
                      <View className="flex-row flex-wrap gap-2 mt-2 mb-2">
                        {selectedCustomers.map((customerId) => {
                          const customer = customers?.find(
                            (c: Customer) => c._id === customerId,
                          );
                          return (
                            <View
                              key={customerId}
                              className="bg-blue-100 rounded-full px-3 py-1.5 flex-row items-center max-w-[200px]"
                            >
                              <Text
                                className="text-blue-800 font-medium mr-1.5"
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {customer?.name || "Unknown"}
                              </Text>
                              <TouchableOpacity
                                onPress={() => {
                                  setSelectedCustomers(
                                    selectedCustomers.filter(
                                      (id) => id !== customerId,
                                    ),
                                  );
                                }}
                              >
                                <Ionicons
                                  name="close-circle"
                                  size={18}
                                  color="#1e40af"
                                />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    )}
                    {errors.customerIds && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.customerIds}
                      </Text>
                    )}

                    {/* CBM Input */}
                    <View className="mt-3">
                      <Text className="text-gray-700 font-medium mb-2">
                        CBM
                      </Text>
                      <Input
                        variant="outline"
                        size="lg"
                        className="bg-white rounded-xl border-gray-200"
                      >
                        <InputField
                          placeholder="CBM"
                          placeholderTextColor="#999"
                          value={cbm}
                          onChangeText={setCbm}
                          keyboardType="numeric"
                          className="text-gray-900"
                        />
                      </Input>
                    </View>
                  </View>

                  {/* Partners Section */}
                  <View className="mb-6">
                    <View className="mb-3">
                      <Text className="text-gray-700 font-medium mb-2">
                        Partners ({selectedPartners.length}/6)
                      </Text>
                      <Input
                        variant="outline"
                        size="lg"
                        className="bg-white rounded-xl border-gray-200 mb-2"
                      >
                        <InputSlot className="pl-3">
                          <Ionicons name="search" size={20} color="#999" />
                        </InputSlot>
                        <InputField
                          placeholder="Search partner..."
                          placeholderTextColor="#999"
                          value={partnerSearch}
                          onChangeText={setPartnerSearch}
                          className="text-gray-900"
                        />
                      </Input>
                    </View>

                    {/* Partner Dropdown List */}
                    {filteredPartners.filter(
                      (p: Partner) => !selectedPartners.includes(p._id),
                    ).length > 0 &&
                      selectedPartners.length < 6 && (
                        <ScrollView
                          onStartShouldSetResponder={() => true}
                          style={{ maxHeight: 150 }}
                          className="bg-white rounded-xl border border-gray-200 mb-2 z-50"
                          showsVerticalScrollIndicator={true}
                        >
                          {filteredPartners
                            .filter(
                              (p: Partner) => !selectedPartners.includes(p._id),
                            )
                            .map((partner: Partner) => (
                              <TouchableOpacity
                                key={partner._id}
                                onPress={() => {
                                  if (!selectedPartners.includes(partner._id)) {
                                    setSelectedPartners([
                                      ...selectedPartners,
                                      partner._id,
                                    ]);
                                    setPartnerSearch("");
                                  }
                                }}
                                className="p-3 border-b border-gray-100 flex-row justify-between items-center"
                              >
                                <Text
                                  className="text-gray-900 flex-1"
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                >
                                  {partner.name}
                                </Text>
                                <Ionicons
                                  name="add-circle-outline"
                                  size={20}
                                  color="#10b981"
                                />
                              </TouchableOpacity>
                            ))}
                        </ScrollView>
                      )}

                    {/* Selected Partners Chips */}
                    {selectedPartners.length > 0 && (
                      <View className="flex-row flex-wrap gap-2 mt-2">
                        {selectedPartners.map((partnerId) => {
                          const partner = partners?.find(
                            (p: Partner) => p._id === partnerId,
                          );
                          return (
                            <View
                              key={partnerId}
                              className="bg-green-100 rounded-full px-3 py-1.5 flex-row items-center max-w-[200px]"
                            >
                              <Text
                                className="text-green-800 font-medium mr-1.5"
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {partner?.name || "Unknown"}
                              </Text>
                              <TouchableOpacity
                                onPress={() => {
                                  setSelectedPartners(
                                    selectedPartners.filter(
                                      (id) => id !== partnerId,
                                    ),
                                  );
                                }}
                              >
                                <Ionicons
                                  name="close-circle"
                                  size={18}
                                  color="#15803d"
                                />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    )}
                    {errors.partnerIds && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.partnerIds}
                      </Text>
                    )}
                  </View>

                  {/* Status & Container Group (2 columns) */}
                  <View className="mb-6">
                    <View className="flex-row gap-3 mb-3">
                      {/* Status - 50% width */}
                      <View className="flex-1">
                        <Text className="text-gray-700 font-medium mb-2">
                          Status
                        </Text>
                        <CustomSelect
                          options={statusOptions}
                          selectedValue={status}
                          onValueChange={(value) => {
                            console.log("Status selected:", value);
                            setStatus(value);
                          }}
                          placeholder="Select status"
                          direction="up"
                        />
                        {errors.status && (
                          <Text className="text-red-500 text-sm mt-1">
                            {errors.status}
                          </Text>
                        )}
                      </View>

                      {/* Container - 50% width */}
                      <View className="flex-1">
                        <Text className="text-gray-700 font-medium mb-2">
                          Container
                        </Text>
                        <CustomSelect
                          options={
                            isLoadingContainers
                              ? [{ label: "Loading containers...", value: "" }]
                              : containersError
                                ? [
                                    {
                                      label: "Error loading containers",
                                      value: "",
                                    },
                                  ]
                                : containerOptions.length > 0
                                  ? containerOptions
                                  : [
                                      {
                                        label: "No containers found (empty)",
                                        value: "",
                                      },
                                    ]
                          }
                          selectedValue={container}
                          onValueChange={(value) => {
                            if (value) {
                              console.log("Container selected:", value);
                              setContainer(value);
                            }
                          }}
                          placeholder={
                            containers?.length === 0
                              ? "No containers yet"
                              : "Select container"
                          }
                        />
                        {errors.containerId && (
                          <Text className="text-red-500 text-sm mt-1">
                            {errors.containerId}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View className="flex-row gap-3">
                      {/* Origin Warehouse Select - 50% width */}
                      <View className="flex-1">
                        <Text className="text-gray-700 font-medium mb-2">
                          Origin warehouse
                        </Text>
                        <CustomSelect
                          options={
                            warehouseOptions.length > 0
                              ? warehouseOptions
                              : [{ label: "No warehouses found", value: "" }]
                          }
                          selectedValue={originWarehouse}
                          onValueChange={(value) => {
                            if (value) {
                              console.log("Origin warehouse selected:", value);
                              setOriginWarehouse(value);
                            }
                          }}
                          placeholder={
                            warehouses?.length === 0
                              ? "No warehouses yet"
                              : "Select warehouse"
                          }
                          direction="up"
                        />
                        {errors.originWarehouseId && (
                          <Text className="text-red-500 text-sm mt-1">
                            {errors.originWarehouseId}
                          </Text>
                        )}
                      </View>

                      {/* Current Warehouse Select - 50% width */}
                      <View className="flex-1">
                        <Text className="text-gray-700 font-medium mb-2">
                          Current warehouse
                        </Text>
                        <CustomSelect
                          options={
                            warehouseOptions.length > 0
                              ? warehouseOptions
                              : [{ label: "No warehouses found", value: "" }]
                          }
                          selectedValue={currentWarehouse}
                          onValueChange={(value) => {
                            if (value) {
                              console.log("Current warehouse selected:", value);
                              setCurrentWarehouse(value);
                            }
                          }}
                          placeholder={
                            warehouses?.length === 0
                              ? "No warehouses yet"
                              : "Select warehouse"
                          }
                          direction="up"
                        />
                        {errors.currentWarehouseId && (
                          <Text className="text-red-500 text-sm mt-1">
                            {errors.currentWarehouseId}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Description - Textarea */}
                  <View className="mb-6">
                    <Text className="text-gray-700 font-medium mb-2">
                      Description
                    </Text>
                    <Input
                      variant="outline"
                      size="lg"
                      className="bg-white rounded-xl border-gray-200"
                    >
                      <InputField
                        placeholder="Enter description"
                        placeholderTextColor="#999"
                        value={description}
                        onChangeText={setDescription}
                        className="text-gray-900 min-h-[100px] py-3"
                      />
                    </Input>
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row gap-4 mb-6">
                  <TouchableOpacity
                    onPress={handleClose}
                    className="flex-1 py-4 rounded-xl border border-gray-300 items-center"
                  >
                    <Text className="text-gray-700 font-bold text-lg">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    style={{
                      opacity:
                        createMutation.isPending || updateMutation.isPending
                          ? 0.7
                          : 1,
                    }}
                    className={`flex-1 py-4 rounded-xl items-center flex-row justify-center ${
                      createMutation.isPending || updateMutation.isPending
                        ? "bg-gray-400"
                        : "bg-primary-blue"
                    }`}
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <View className="flex-row items-center gap-2">
                        <ActivityIndicator color="white" size="small" />
                        <Text className="text-white font-bold text-lg">
                          Processing...
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Ionicons
                          name={initialData ? "save" : "add"}
                          size={24}
                          color="white"
                          className="mr-2"
                        />
                        <Text className="text-white font-bold text-lg ml-2">
                          {initialData ? "Update" : "Save"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </Box>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onClose={() => setShowScanner(false)}
          onScan={handleBarcodeScan}
        />
      )}
    </Modal>
  );
}
