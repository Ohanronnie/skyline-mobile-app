import { CustomSelect } from "@/components/custom-select";
import { Box } from "@/components/ui/box";
import { Input, InputField } from "@/components/ui/input";
import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast,
} from "@/components/ui/toast";
import { useCreateWarehouse, useUpdateWarehouse } from "@/hooks/useShipments";
import { WarehouseLocation } from "@/lib/api";
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
import { validateAndFormatPhoneNumber } from "@/lib/phone";
import { z } from "zod";

// Validation schema
const warehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  location: z.nativeEnum(WarehouseLocation, {
    message: "Location is required",
  }),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional().refine((val) => {
    if (!val) return true;
    return !!validateAndFormatPhoneNumber(val);
  }, {
    message: "Invalid phone number"
  }),
  capacity: z.number().int().positive().optional(),
  currentUtilization: z.number().int().min(0).optional(),
});

interface AddWarehouseModalProps {
  visible: boolean;
  onClose: () => void;
  warehouseId?: string;
  initialData?: {
    name?: string;
    location?: WarehouseLocation;
    address?: string;
    contactPerson?: string;
    phone?: string;
    capacity?: number;
    currentUtilization?: number;
  };
}

export function AddWarehouseModal({
  visible,
  onClose,
  warehouseId,
  initialData,
}: AddWarehouseModalProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [location, setLocation] = useState<WarehouseLocation | "">(
    initialData?.location || ""
  );
  const [address, setAddress] = useState(initialData?.address || "");
  const [contactPerson, setContactPerson] = useState(
    initialData?.contactPerson || ""
  );
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [capacity, setCapacity] = useState(
    initialData?.capacity?.toString() || ""
  );
  const [currentUtilization, setCurrentUtilization] = useState(
    initialData?.currentUtilization?.toString() || ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const toast = useToast();

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setLocation(initialData.location || "");
      setAddress(initialData.address || "");
      setContactPerson(initialData.contactPerson || "");
      setPhone(initialData.phone || "");
      setCapacity(initialData.capacity?.toString() || "");
      setCurrentUtilization(initialData.currentUtilization?.toString() || "");
      setErrors({});
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setName("");
    setLocation("");
    setAddress("");
    setContactPerson("");
    setPhone("");
    setCapacity("");
    setCurrentUtilization("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    // Clear previous errors
    setErrors({});

    const warehouseData = {
      name,
      location: location as WarehouseLocation,
      address: address || undefined,
      contactPerson: contactPerson || undefined,
      phone: phone ? (validateAndFormatPhoneNumber(phone) || phone) : undefined,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      currentUtilization: currentUtilization
        ? parseInt(currentUtilization, 10)
        : undefined,
    };

    // Validate with Zod
    const validation = warehouseSchema.safeParse(warehouseData);
    const fieldErrors: Record<string, string> = {};

    if (!validation.success) {
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
      setErrors(fieldErrors);
      return;
    }

    if (warehouseId) {
      // Update existing warehouse
      updateMutation.mutate(
        { id: warehouseId, data: warehouseData },
        {
          onSuccess: () => {
            toast.show({
              placement: "top",
              render: ({ id }) => (
                <Toast
                  nativeID={"toast-" + id}
                  action="success"
                  variant="outline"
                  style={{ zIndex: 9999 }}>
                  <View>
                    <ToastTitle>Success</ToastTitle>
                    <ToastDescription>
                      Warehouse updated successfully!
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
              "An error occurred while updating the warehouse. Please check your inputs and try again.",
              [{ text: "OK" }]
            );
          },
        }
      );
    } else {
      // Create new warehouse
      createMutation.mutate(warehouseData, {
        onSuccess: () => {
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast
                nativeID={"toast-" + id}
                action="success"
                variant="outline"
                style={{ zIndex: 9999 }}>
                <View>
                  <ToastTitle>Success</ToastTitle>
                  <ToastDescription>
                    Warehouse created successfully!
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
            "An error occurred while creating the warehouse. Please check your inputs and try again.",
            [{ text: "OK" }]
          );
        },
      });
    }
  };

  const locationOptions = Object.values(WarehouseLocation).map((loc) => ({
    label: loc.charAt(0).toUpperCase() + loc.slice(1),
    value: loc,
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/50">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Box className="bg-white rounded-t-3xl h-[85%]">
            <View className="p-6 flex-1">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-bold text-gray-900">
                  {initialData ? "Edit warehouse" : "New warehouse"}
                </Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-6">
                <View onStartShouldSetResponder={() => true}>
                  {/* Warehouse Name - Full Width */}
                  <View className="mb-6">
                    <Text className="text-gray-700 font-medium mb-2">
                      Warehouse name
                    </Text>
                    <Input
                      variant="outline"
                      size="lg"
                      className="bg-white rounded-xl border-gray-200">
                      <InputField
                        placeholder="Enter warehouse name"
                        placeholderTextColor="#999"
                        value={name}
                        onChangeText={setName}
                        className="text-gray-900"
                      />
                    </Input>
                    {errors.name && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.name}
                      </Text>
                    )}
                  </View>

                  {/* Location & Contact Person - 50/50 */}
                  <View className="mb-6">
                    <View className="flex-row gap-3">
                      {/* Location - 50% width */}
                      <View className="flex-1">
                        <Text className="text-gray-700 font-medium mb-2">
                          Location
                        </Text>
                        <CustomSelect
                          options={locationOptions}
                          selectedValue={location}
                          onValueChange={(value) => {
                            if (value) {
                              setLocation(value as WarehouseLocation);
                            }
                          }}
                          placeholder="Select location"
                        />
                        {errors.location && (
                          <Text className="text-red-500 text-sm mt-1">
                            {errors.location}
                          </Text>
                        )}
                      </View>

                      {/* Contact Person - 50% width */}
                      <View className="flex-1">
                        <Text className="text-gray-700 font-medium mb-2">
                          Contact person
                        </Text>
                        <Input
                          variant="outline"
                          size="lg"
                          className="bg-white rounded-xl border-gray-200">
                          <InputField
                            placeholder="Enter contact person"
                            placeholderTextColor="#999"
                            value={contactPerson}
                            onChangeText={setContactPerson}
                            className="text-gray-900"
                          />
                        </Input>
                        {errors.contactPerson && (
                          <Text className="text-red-500 text-sm mt-1">
                            {errors.contactPerson}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Address & Phone - 50/50 */}
                  <View className="mb-6">
                    <View className="flex-row gap-3">
                      {/* Address - 50% width */}
                      <View className="flex-1">
                        <Text className="text-gray-700 font-medium mb-2">
                          Address
                        </Text>
                        <Input
                          variant="outline"
                          size="lg"
                          className="bg-white rounded-xl border-gray-200">
                          <InputField
                            placeholder="Enter address"
                            placeholderTextColor="#999"
                            value={address}
                            onChangeText={setAddress}
                            className="text-gray-900"
                          />
                        </Input>
                        {errors.address && (
                          <Text className="text-red-500 text-sm mt-1">
                            {errors.address}
                          </Text>
                        )}
                      </View>

                      {/* Phone - 50% width */}
                      <View className="flex-1">
                        <Text className="text-gray-700 font-medium mb-2">
                          Phone
                        </Text>
                        <Input
                          variant="outline"
                          size="lg"
                          className="bg-white rounded-xl border-gray-200">
                          <InputField
                            placeholder="Enter phone number"
                            placeholderTextColor="#999"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            className="text-gray-900"
                          />
                        </Input>
                        {errors.phone && (
                          <Text className="text-red-500 text-sm mt-1">
                            {errors.phone}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Capacity & Current Utilization - 50/50 */}
                  <View className="mb-6">
                    <View className="flex-row gap-3">
                      {/* Capacity - 50% width */}
                      <View className="flex-1">
                        <Text className="text-gray-700 font-medium mb-2">
                          Total capacity
                        </Text>
                        <Input
                          variant="outline"
                          size="lg"
                          className="bg-white rounded-xl border-gray-200">
                          <InputField
                            placeholder="Enter total capacity"
                            placeholderTextColor="#999"
                            value={capacity}
                            onChangeText={setCapacity}
                            keyboardType="numeric"
                            className="text-gray-900"
                          />
                        </Input>
                        {errors.capacity && (
                          <Text className="text-red-500 text-sm mt-1">
                            {errors.capacity}
                          </Text>
                        )}
                      </View>

                      {/* Current Utilization - 50% width */}
                      <View className="flex-1">
                        <Text className="text-gray-700 font-medium mb-2">
                          Current utilization
                        </Text>
                        <Input
                          variant="outline"
                          size="lg"
                          className="bg-white rounded-xl border-gray-200">
                          <InputField
                            placeholder="Enter current utilization"
                            placeholderTextColor="#999"
                            value={currentUtilization}
                            onChangeText={setCurrentUtilization}
                            keyboardType="numeric"
                            className="text-gray-900"
                          />
                        </Input>
                        {errors.currentUtilization && (
                          <Text className="text-red-500 text-sm mt-1">
                            {errors.currentUtilization}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row gap-4 mb-6">
                  <TouchableOpacity
                    onPress={handleClose}
                    className="flex-1 py-4 rounded-xl border border-gray-300 items-center">
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
                    }`}>
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
    </Modal>
  );
}
