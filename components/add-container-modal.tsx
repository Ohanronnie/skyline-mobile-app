import { CustomSelect } from "@/components/custom-select";
import { Box } from "@/components/ui/box";
import { Input, InputField } from "@/components/ui/input";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast,
} from "@/components/ui/toast";
import {
  useCreateContainer,
  useCustomers,
  usePartners,
  useUpdateContainer,
} from "@/hooks/useShipments";
import { ContainerStatus, Customer, Partner } from "@/lib/api";
import { z } from "zod";

interface AddContainerModalProps {
  visible: boolean;
  onClose: () => void;
  containerId?: string;
  initialData?: {
    containerNumber?: string;
    sizeType?: string;
    vesselName?: string;
    status?: string;
    departureDate?: string;
    etaGhana?: string;
    arrivalDate?: string;
    currentLocation?: string;
    customerIds?: string[];
    partnerIds?: string[];
  };
}

// Validation schema
const containerSchema = z.object({
  containerNumber: z.string().min(1, "Container number is required"),
  sizeType: z.string().optional(),
  vesselName: z.string().optional(),
  status: z.nativeEnum(ContainerStatus).optional(),
  departureDate: z.string().optional(),
  etaGhana: z.string().optional(),
  arrivalDate: z.string().optional(),
  currentLocation: z.string().optional(),
  customerIds: z
    .array(z.string())
    .max(6, "Maximum 6 customers allowed")
    .optional(),
  partnerIds: z
    .array(z.string())
    .max(6, "Maximum 6 partners allowed")
    .optional(),
});

export function AddContainerModal({
  visible,
  onClose,
  containerId,
  initialData,
}: AddContainerModalProps) {
  const [containerNumber, setContainerNumber] = useState("");
  const [sizeType, setSizeType] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [status, setStatus] = useState<string>("");
  const [departureDate, setDepartureDate] = useState("");
  const [etaGhana, setEtaGhana] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");

  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [partnerSearch, setPartnerSearch] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: customers } = useCustomers();
  const { data: partners } = usePartners();

  const createMutation = useCreateContainer();
  const updateMutation = useUpdateContainer();
  const toast = useToast();

  useEffect(() => {
    if (initialData) {
      setContainerNumber(initialData.containerNumber || "");
      setSizeType(initialData.sizeType || "");
      setVesselName(initialData.vesselName || "");
      setStatus(initialData.status || "");
      setDepartureDate(
        initialData.departureDate
          ? new Date(initialData.departureDate).toISOString().split("T")[0]
          : "",
      );
      setEtaGhana(
        initialData.etaGhana
          ? new Date(initialData.etaGhana).toISOString().split("T")[0]
          : "",
      );
      setArrivalDate(
        initialData.arrivalDate
          ? new Date(initialData.arrivalDate).toISOString().split("T")[0]
          : "",
      );
      setCurrentLocation(initialData.currentLocation || "");

      // Handle multiple IDs from initialData, falling back to legacy single ID if needed
      const getIds = (ids?: any[], singleId?: any) => {
        if (ids && ids.length > 0) {
          return ids.map((item) =>
            typeof item === "string" ? item : item._id,
          );
        }
        if (singleId) {
          return [typeof singleId === "string" ? singleId : singleId._id];
        }
        return [];
      };

      setSelectedCustomers(
        getIds(initialData.customerIds, (initialData as any).customerId),
      );
      setSelectedPartners(
        getIds(initialData.partnerIds, (initialData as any).partnerId),
      );
      setErrors({});
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setContainerNumber("");
    setSizeType("");
    setVesselName("");
    setStatus("");
    setDepartureDate("");
    setEtaGhana("");
    setArrivalDate("");
    setCurrentLocation("");
    setSelectedCustomers([]);
    setSelectedPartners([]);
    setCustomerSearch("");
    setPartnerSearch("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    setErrors({});

    // Build container data object
    const rawContainerData = {
      containerNumber,
      sizeType: sizeType || undefined,
      vesselName: vesselName || undefined,
      status: (status as ContainerStatus) || undefined,
      departureDate: departureDate || undefined,
      etaGhana: etaGhana || undefined,
      arrivalDate: arrivalDate || undefined,
      currentLocation: currentLocation || undefined,
      customerIds: selectedCustomers.length > 0 ? selectedCustomers : undefined,
      partnerIds: selectedPartners.length > 0 ? selectedPartners : undefined,
    };

    // Remove empty strings and undefined values
    const containerData = Object.fromEntries(
      Object.entries(rawContainerData).filter(
        ([_, value]) => value !== undefined && value !== "" && value !== null,
      ),
    ) as typeof rawContainerData;

    // Zod Validation
    const validation = containerSchema.safeParse(containerData);
    const fieldErrors: Record<string, string> = {};

    if (!validation.success) {
      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        // Handle the refinement error specifically
        if (issue.code === "custom") {
          fieldErrors["customerIds"] = issue.message;
          fieldErrors["partnerIds"] = issue.message;
        } else {
          fieldErrors[fieldName] = issue.message;
        }
      });
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    if (containerId) {
      updateMutation.mutate(
        { id: containerId, data: containerData },
        {
          onSuccess: () => {
            toast.show({
              placement: "top",
              render: ({ id }) => (
                <Toast
                  nativeID={"toast-" + id}
                  action="success"
                  variant="outline"
                >
                  <View>
                    <ToastTitle>Success</ToastTitle>
                    <ToastDescription>
                      Container updated successfully!
                    </ToastDescription>
                  </View>
                </Toast>
              ),
            });
            handleClose();
          },
          onError: (error: any) => {
            Alert.alert(
              "Error",
              error?.response?.data?.message || "Failed to update container",
            );
            console.log(error?.response?.data?.message);
          },
        },
      );
    } else {
      createMutation.mutate(containerData, {
        onSuccess: () => {
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast
                nativeID={"toast-" + id}
                action="success"
                variant="outline"
              >
                <View>
                  <ToastTitle>Success</ToastTitle>
                  <ToastDescription>
                    Container created successfully!
                  </ToastDescription>
                </View>
              </Toast>
            ),
          });
          handleClose();
        },
        onError: () => {
          Alert.alert("Error", "Failed to create container");
        },
      });
    }
  };

  // Filter customers
  const filteredCustomers =
    customers?.filter((c: Customer) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()),
    ) || [];

  const customerOptions = filteredCustomers.map((c: Customer) => ({
    label: c.name,
    value: c._id,
  }));

  // Filter partners
  const filteredPartners =
    partners?.filter((p: Partner) =>
      p.name.toLowerCase().includes(partnerSearch.toLowerCase()),
    ) || [];

  const partnerOptions = filteredPartners.map((p: Partner) => ({
    label: p.name,
    value: p._id,
  }));

  const statusOptions = Object.values(ContainerStatus).map((s) => ({
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
          <Box className="bg-white rounded-t-3xl h-[90%]">
            <View className="p-6 flex-1">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-bold text-gray-900">
                  {initialData ? "Edit container" : "New container"}
                </Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-6"
              >
                <View onStartShouldSetResponder={() => true}>
                  {/* Container Number */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Container Number *
                    </Text>
                    <Input
                      variant="outline"
                      size="lg"
                      className="bg-white rounded-xl border-gray-200"
                    >
                      <InputField
                        placeholder="Enter container number"
                        value={containerNumber}
                        onChangeText={setContainerNumber}
                        className="text-gray-900"
                      />
                    </Input>
                    {errors.containerNumber && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.containerNumber}
                      </Text>
                    )}
                  </View>

                  {/* Size/Type & Vessel */}
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">
                        Size / Type
                      </Text>
                      <Input
                        variant="outline"
                        size="lg"
                        className="bg-white rounded-xl border-gray-200"
                      >
                        <InputField
                          placeholder="e.g. 40ft"
                          value={sizeType}
                          onChangeText={setSizeType}
                          className="text-gray-900"
                        />
                      </Input>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">
                        Vessel Name
                      </Text>
                      <Input
                        variant="outline"
                        size="lg"
                        className="bg-white rounded-xl border-gray-200"
                      >
                        <InputField
                          placeholder="Vessel name"
                          value={vesselName}
                          onChangeText={setVesselName}
                          className="text-gray-900"
                        />
                      </Input>
                    </View>
                  </View>

                  {/* Status & Current Location */}
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">
                        Status
                      </Text>
                      <CustomSelect
                        options={statusOptions}
                        selectedValue={status}
                        onValueChange={setStatus}
                        placeholder="Select status"
                        direction="up"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">
                        Location
                      </Text>
                      <Input
                        variant="outline"
                        size="lg"
                        className="bg-white rounded-xl border-gray-200"
                      >
                        <InputField
                          placeholder="Location"
                          value={currentLocation}
                          onChangeText={setCurrentLocation}
                          className="text-gray-900"
                        />
                      </Input>
                    </View>
                  </View>

                  {/* Dates */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Dates (YYYY-MM-DD)
                    </Text>
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <Input
                          variant="outline"
                          size="lg"
                          className="bg-white rounded-xl border-gray-200"
                        >
                          <InputField
                            placeholder="Departure"
                            value={departureDate}
                            onChangeText={setDepartureDate}
                            className="text-gray-900"
                          />
                        </Input>
                      </View>
                      <View className="flex-1">
                        <Input
                          variant="outline"
                          size="lg"
                          className="bg-white rounded-xl border-gray-200"
                        >
                          <InputField
                            placeholder="ETA Ghana"
                            value={etaGhana}
                            onChangeText={setEtaGhana}
                            className="text-gray-900"
                          />
                        </Input>
                      </View>
                    </View>
                  </View>

                  {/* Customer / Partner Selection */}
                  <View className="mb-6 bg-gray-50 p-4 rounded-xl">
                    <Text className="text-gray-900 font-bold mb-4">
                      Assign To
                    </Text>

                    {/* Customers */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-700 font-medium">
                          Customers ({selectedCustomers.length}/6)
                        </Text>
                      </View>

                      {/* Search and Add Customer */}
                      <Input
                        variant="outline"
                        size="lg"
                        className="bg-white rounded-xl border-gray-200 mb-2"
                      >
                        <InputField
                          placeholder="Search or browse customers..."
                          value={customerSearch}
                          onChangeText={setCustomerSearch}
                          className="text-gray-900"
                        />
                      </Input>

                      {/* Customer Dropdown List */}
                      {filteredCustomers.filter(
                        (c: Customer) => !selectedCustomers.includes(c._id),
                      ).length > 0 &&
                        selectedCustomers.length < 6 && (
                          <ScrollView
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
                        <View className="flex-row flex-wrap gap-2 mt-2">
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
                    </View>

                    {/* Partners */}
                    <View>
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-700 font-medium">
                          Partners ({selectedPartners.length}/6)
                        </Text>
                      </View>

                      {/* Search and Add Partner */}
                      <Input
                        variant="outline"
                        size="lg"
                        className="bg-white rounded-xl border-gray-200 mb-2"
                      >
                        <InputField
                          placeholder="Search or browse partners..."
                          value={partnerSearch}
                          onChangeText={setPartnerSearch}
                          className="text-gray-900"
                        />
                      </Input>

                      {/* Partner Dropdown List */}
                      {filteredPartners.filter(
                        (p: Partner) => !selectedPartners.includes(p._id),
                      ).length > 0 &&
                        selectedPartners.length < 6 && (
                          <ScrollView
                            style={{ maxHeight: 150 }}
                            className="bg-white rounded-xl border border-gray-200 mb-2 z-50"
                            showsVerticalScrollIndicator={true}
                          >
                            {filteredPartners
                              .filter(
                                (p: Partner) =>
                                  !selectedPartners.includes(p._id),
                              )
                              .map((partner: Partner) => (
                                <TouchableOpacity
                                  key={partner._id}
                                  onPress={() => {
                                    if (
                                      !selectedPartners.includes(partner._id)
                                    ) {
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
                    className={`flex-1 py-4 rounded-xl items-center flex-row justify-center ${
                      createMutation.isPending || updateMutation.isPending
                        ? "bg-gray-400"
                        : "bg-primary-blue"
                    }`}
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="text-white font-bold text-lg ml-2">
                        {initialData ? "Update" : "Save"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </Box>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
