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
    useCreateCustomer,
    usePartners,
    useUpdateCustomer,
} from "@/hooks/useShipments";
import { CustomerLocation, CustomerType, Partner } from "@/lib/api";
import { z } from "zod";

interface AddCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  customerId?: string;
  hidePartnerField?: boolean; // Hide partner selection for partners
  initialData?: {
    name?: string;
    type?: string;
    email?: string;
    phone?: string;
    address?: string;
    location?: string;
    paymentTerms?: string;
    notes?: string;
    partnerId?: string;
  };
}

// Validation schema
const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  type: z.nativeEnum(CustomerType, { message: "Invalid customer type" }),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  location: z.nativeEnum(CustomerLocation, { message: "Invalid location" }),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  partnerId: z.string().optional(),
});

export function AddCustomerModal({
  visible,
  onClose,
  customerId,
  hidePartnerField = false,
  initialData,
}: AddCustomerModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<string>("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedPartner, setSelectedPartner] = useState("");
  const [partnerSearch, setPartnerSearch] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: partners } = usePartners();
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const toast = useToast();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setType(initialData.type || "");
      setEmail(initialData.email || "");
      setPhone(initialData.phone || "");
      setAddress(initialData.address || "");
      setLocation(initialData.location || "");
      setPaymentTerms(initialData.paymentTerms || "");
      setNotes(initialData.notes || "");
      setSelectedPartner(initialData.partnerId || "");
      setErrors({});
    } else {
      resetForm();
    }
    console.log("[AddCustomerModal] useEffect:", {
      customerId,
      initialData,
      visible,
    });
  }, [initialData, visible, customerId]);

  const resetForm = () => {
    setName("");
    setType("");
    setEmail("");
    setPhone("");
    setAddress("");
    setLocation("");
    setPaymentTerms("");
    setNotes("");
    setSelectedPartner("");
    setPartnerSearch("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    setErrors({});

    const customerData = {
      name: name.trim(),
      type: type as CustomerType,
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      address: address?.trim() || undefined,
      location: location as CustomerLocation,
      paymentTerms: paymentTerms?.trim() || undefined,
      notes: notes?.trim() || undefined,
      ...(hidePartnerField ? {} : { partnerId: selectedPartner || undefined }),
    };

    // Zod Validation
    const validation = customerSchema.safeParse(customerData);
    const fieldErrors: Record<string, string> = {};

    if (!validation.success) {
      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        fieldErrors[fieldName] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (customerId) {
      console.log("[AddCustomerModal] Updating customer:", {
        customerId,
        customerData,
      });
      updateMutation.mutate(
        { id: customerId, data: customerData },
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
                      Customer updated successfully!
                    </ToastDescription>
                  </View>
                </Toast>
              ),
            });
            handleClose();
          },
          onError: (error: any) => {
            console.log("[AddCustomerModal] Update error:", {
              customerId,
              error: error?.response?.data,
              status: error?.response?.status,
              message: error?.message,
            });

            const errorData = error?.response?.data || {};

            // Handle validation errors from backend (errors object)
            if (errorData.errors && typeof errorData.errors === "object") {
              const backendErrors: Record<string, string> = {};
              Object.keys(errorData.errors).forEach((key) => {
                const fieldError = errorData.errors[key];
                backendErrors[key] = Array.isArray(fieldError)
                  ? fieldError[0]
                  : String(fieldError || "Invalid value");
              });
              setErrors(backendErrors);
              return;
            }

            // Handle message array (like ["phone must be a valid Ghana phone number"])
            if (Array.isArray(errorData.message)) {
              const errorMessages = errorData.message;

              // Try to extract field-specific errors from message array
              const fieldErrors: Record<string, string> = {};
              errorMessages.forEach((msg: string) => {
                // Check if message contains field name (e.g., "phone must be...")
                const fieldMatch = msg.match(/^(\w+)\s/);
                if (fieldMatch) {
                  const fieldName = fieldMatch[1];
                  fieldErrors[fieldName] = msg;
                }
              });

              if (Object.keys(fieldErrors).length > 0) {
                setErrors(fieldErrors);
                // Also show alert with the first error message
                const errorMessage = errorMessages[0] || "Validation failed";
                Alert.alert("Error", String(errorMessage));
                return;
              }

              // If no field-specific errors, show first message in alert
              const errorMessage = errorMessages[0] || "Validation failed";
              Alert.alert("Error", String(errorMessage));
              return;
            }

            // Handle single error message - use Alert
            const errorMessage =
              errorData.message ||
              errorData.error ||
              error?.message ||
              "Failed to update customer. Please check your input and try again.";

            Alert.alert("Error", String(errorMessage));
          },
        },
      );
    } else {
      createMutation.mutate(customerData, {
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
                    Customer created successfully!
                  </ToastDescription>
                </View>
              </Toast>
            ),
          });
          handleClose();
        },
        onError: (error: any) => {
          console.log("[AddCustomerModal] Create error:", {
            error: error?.response?.data,
            status: error?.response?.status,
            message: error?.message,
          });

          const errorData = error?.response?.data || {};

          // Handle validation errors from backend (errors object)
          if (errorData.errors && typeof errorData.errors === "object") {
            const backendErrors: Record<string, string> = {};
            Object.keys(errorData.errors).forEach((key) => {
              const fieldError = errorData.errors[key];
              backendErrors[key] = Array.isArray(fieldError)
                ? fieldError[0]
                : String(fieldError || "Invalid value");
            });
            setErrors(backendErrors);
            return;
          }

          // Handle message array (like ["phone must be a valid Ghana phone number"])
          if (Array.isArray(errorData.message)) {
            const errorMessages = errorData.message;

            // Try to extract field-specific errors from message array
            const fieldErrors: Record<string, string> = {};
            errorMessages.forEach((msg: string) => {
              // Check if message contains field name (e.g., "phone must be...")
              const fieldMatch = msg.match(/^(\w+)\s/);
              if (fieldMatch) {
                const fieldName = fieldMatch[1];
                fieldErrors[fieldName] = msg;
              }
            });

            if (Object.keys(fieldErrors).length > 0) {
              setErrors(fieldErrors);
              // Also show alert with the first error message
              const errorMessage = errorMessages[0] || "Validation failed";
              Alert.alert("Error", String(errorMessage));
              return;
            }

            // If no field-specific errors, show first message in alert
            const errorMessage = errorMessages[0] || "Validation failed";
            Alert.alert("Error", String(errorMessage));
            return;
          }

          // Handle single error message - use Alert
          const errorMessage =
            errorData.message ||
            errorData.error ||
            error?.message ||
            "Failed to create customer. Please check your input and try again.";

          Alert.alert("Error", String(errorMessage));
        },
      });
    }
  };

  // Filter partners
  const filteredPartners =
    partners?.filter((p: Partner) =>
      p.name.toLowerCase().includes(partnerSearch.toLowerCase()),
    ) || [];

  const partnerOptions = filteredPartners.map((p: Partner) => ({
    label: p.name,
    value: p._id,
  }));

  const typeOptions = Object.values(CustomerType).map((t) => ({
    label: t.charAt(0).toUpperCase() + t.slice(1),
    value: t,
  }));

  const locationOptions = Object.values(CustomerLocation).map((l) => ({
    label: l
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    value: l,
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
                  {initialData ? "Edit customer" : "New customer"}
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
                  {/* Customer Name */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Customer Name *
                    </Text>
                    <Input
                      variant="outline"
                      size="lg"
                      className="bg-white rounded-xl border-gray-200"
                    >
                      <InputField
                        placeholder="Enter full name"
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

                  {/* Type & Location */}
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">
                        Type *
                      </Text>
                      <CustomSelect
                        options={typeOptions}
                        selectedValue={type}
                        onValueChange={setType}
                        placeholder="Select type"
                      />
                      {errors.type && (
                        <Text className="text-red-500 text-sm mt-1">
                          {errors.type}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">
                        Location *
                      </Text>
                      <CustomSelect
                        options={locationOptions}
                        selectedValue={location}
                        onValueChange={setLocation}
                        placeholder="Select location"
                      />
                      {errors.location && (
                        <Text className="text-red-500 text-sm mt-1">
                          {errors.location}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Email & Phone */}
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">
                        Email
                      </Text>
                      <Input
                        variant="outline"
                        size="lg"
                        className="bg-white rounded-xl border-gray-200"
                      >
                        <InputField
                          placeholder="Email address"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          className="text-gray-900"
                        />
                      </Input>
                      {errors.email && (
                        <Text className="text-red-500 text-sm mt-1">
                          {errors.email}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">
                        Phone
                      </Text>
                      <Input
                        variant="outline"
                        size="lg"
                        className="bg-white rounded-xl border-gray-200"
                      >
                        <InputField
                          placeholder="Phone number"
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

                  {/* Payment Terms */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Payment Terms
                    </Text>
                    <Input
                      variant="outline"
                      size="lg"
                      className="bg-white rounded-xl border-gray-200"
                    >
                      <InputField
                        placeholder="e.g. Prepaid"
                        value={paymentTerms}
                        onChangeText={setPaymentTerms}
                        className="text-gray-900"
                      />
                    </Input>
                  </View>

                  {/* Address */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Address
                    </Text>
                    <Input
                      variant="outline"
                      size="lg"
                      className="bg-white rounded-xl border-gray-200"
                    >
                      <InputField
                        placeholder="Enter address"
                        value={address}
                        onChangeText={setAddress}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        className="text-gray-900 min-h-[60px] py-2"
                      />
                    </Input>
                  </View>

                  {/* Notes */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Notes
                    </Text>
                    <Input
                      variant="outline"
                      size="lg"
                      className="bg-white rounded-xl border-gray-200"
                    >
                      <InputField
                        placeholder="Add notes"
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        className="text-gray-900 min-h-[80px] py-2"
                      />
                    </Input>
                  </View>

                  {/* Partner Selection (Optional) - Hidden for partners */}
                  {!hidePartnerField && (
                    <View className="mb-6">
                      <Text className="text-gray-700 font-medium mb-2">
                        Associated Partner (Optional)
                      </Text>
                      <Input
                        variant="outline"
                        size="lg"
                        className="bg-white rounded-xl border-gray-200 mb-2"
                      >
                        <InputField
                          placeholder="Search partner..."
                          value={partnerSearch}
                          onChangeText={setPartnerSearch}
                          className="text-gray-900"
                        />
                      </Input>
                      <CustomSelect
                        options={
                          partnerOptions.length > 0
                            ? partnerOptions
                            : [{ label: "No partners found", value: "" }]
                        }
                        selectedValue={selectedPartner}
                        onValueChange={setSelectedPartner}
                        placeholder="Select partner"
                        direction="up"
                      />
                    </View>
                  )}
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
