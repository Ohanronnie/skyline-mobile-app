import { CustomSelect } from "@/components/custom-select";
import { DatePickerField } from "@/components/date-picker-field";
import { Box } from "@/components/ui/box";
import { Input, InputField } from "@/components/ui/input";
import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast,
} from "@/components/ui/toast";
import {
  useCustomers,
  useInfiniteCustomers,
  useInfinitePartners,
  usePartners,
} from "@/hooks/useShipments";
import { CargoType, Customer, Partner, createCargo, updateCargo } from "@/lib/api";
import { customerMatchesSearchQuery } from "@/lib/customer-search";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { z } from "zod";

interface AddCargoModalProps {
  visible: boolean;
  onClose: () => void;
  cargoId?: string;
  initialData?: {
    cargoId?: string;
    type?: CargoType | string;
    weight?: number;
    origin?: string;
    destination?: string;
    vesselName?: string;
    eta?: string;
    customerId?: string;
    partnerId?: string;
  };
}

const cargoSchema = z
  .object({
    cargoId: z.string().min(1, "Cargo ID is required"),
    type: z.nativeEnum(CargoType, {
      message: "Cargo type is required",
    }),
    weight: z
      .string()
      .optional()
      .refine(
        (val) => !val || !Number.isNaN(Number(val)),
        "Weight must be a number",
      ),
    origin: z.string().optional(),
    destination: z.string().optional(),
    vesselName: z.string().optional(),
    eta: z.string().optional(),
    customerId: z.string().optional(),
    partnerId: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasCustomer = !!data.customerId;
      const hasPartner = !!data.partnerId;
      // Exactly one must be selected
      return (hasCustomer || hasPartner) && !(hasCustomer && hasPartner);
    },
    {
      message: "Select either a Customer or a Partner (exactly one).",
      path: ["customerId"],
    },
  );

export function AddCargoModal({
  visible,
  onClose,
  cargoId,
  initialData,
}: AddCargoModalProps) {
  const [id, setId] = useState("");
  const [cargoType, setCargoType] = useState<CargoType | "">("");
  const [weight, setWeight] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [eta, setEta] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedPartner, setSelectedPartner] = useState("");
  const [partnerSearch, setPartnerSearch] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cache for customer/partner names to avoid "Selected Customer" when search is cleared
  const [resolvedCustomers, setResolvedCustomers] = useState<Record<string, Customer>>({});
  const [resolvedPartners, setResolvedPartners] = useState<Record<string, Partner>>({});

  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState("");
  const [debouncedPartnerSearch, setDebouncedPartnerSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomerSearch(customerSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [customerSearch]);

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

  const partners = React.useMemo(() => {
    return infinitePartners?.pages.flatMap((page) => page.data) || [];
  }, [infinitePartners]);

  const queryClient = useQueryClient();
  const toast = useToast();

  // Update resolved customers/partners when list data changes
  useEffect(() => {
    if (customers.length > 0) {
      setResolvedCustomers((prev) => {
        const next = { ...prev };
        customers.forEach((c) => {
          if (c?._id) next[c._id] = c;
        });
        return next;
      });
    }
  }, [customers]);

  useEffect(() => {
    if (partners.length > 0) {
      setResolvedPartners((prev) => {
        const next = { ...prev };
        partners.forEach((p) => {
          if (p?._id) next[p._id] = p;
        });
        return next;
      });
    }
  }, [partners]);

  const createMutation = useMutation({
    mutationFn: createCargo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cargo"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateCargo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cargo"] });
    },
  });

  useEffect(() => {
    if (initialData) {
      setId(initialData.cargoId || "");
      setCargoType((initialData.type as CargoType) || "");
      setWeight(
        typeof initialData.weight === "number"
          ? String(initialData.weight)
          : initialData.weight
            ? String(initialData.weight)
            : "",
      );
      setOrigin(initialData.origin || "");
      setDestination(initialData.destination || "");
      setVesselName(initialData.vesselName || "");
      setEta(
        initialData.eta
          ? new Date(initialData.eta).toISOString().split("T")[0]
          : "",
      );
      
      const customerId = typeof (initialData as any).customerId === "string" 
        ? (initialData as any).customerId 
        : (initialData as any).customerId?._id || "";
      const partnerId = typeof (initialData as any).partnerId === "string" 
        ? (initialData as any).partnerId 
        : (initialData as any).partnerId?._id || "";

      setSelectedCustomer(customerId);
      setSelectedPartner(partnerId);

      // Cache objects if they were provided instead of just IDs
      if (typeof (initialData as any).customerId === "object" && (initialData as any).customerId?._id) {
        setResolvedCustomers(prev => ({...prev, [(initialData as any).customerId._id]: (initialData as any).customerId}));
      }
      if (typeof (initialData as any).partnerId === "object" && (initialData as any).partnerId?._id) {
        setResolvedPartners(prev => ({...prev, [(initialData as any).partnerId._id]: (initialData as any).partnerId}));
      }

      setErrors({});
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setId("");
    setCargoType("");
    setWeight("");
    setOrigin("");
    setDestination("");
    setVesselName("");
    setEta("");
    setSelectedCustomer("");
    setSelectedPartner("");
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

    const rawData = {
      cargoId: id,
      type: cargoType || undefined,
      weight,
      origin: origin || undefined,
      destination: destination || undefined,
      vesselName: vesselName || undefined,
      eta: eta || undefined,
      customerId: selectedCustomer || undefined,
      partnerId: selectedPartner || undefined,
    };

    const validation = cargoSchema.safeParse(rawData);
    const fieldErrors: Record<string, string> = {};

    if (!validation.success) {
      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        fieldErrors[fieldName] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const payload = {
      cargoId: validation.data.cargoId,
      type: validation.data.type,
      weight: validation.data.weight
        ? Number(validation.data.weight)
        : undefined,
      origin: validation.data.origin,
      destination: validation.data.destination,
      vesselName: validation.data.vesselName,
      eta: validation.data.eta
        ? new Date(validation.data.eta).toISOString()
        : undefined,
      customerId: validation.data.customerId,
      partnerId: validation.data.partnerId,
    };

    if (cargoId) {
      updateMutation.mutate(
        { id: cargoId, data: payload },
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
                      Cargo updated successfully!
                    </ToastDescription>
                  </View>
                </Toast>
              ),
            });
            handleClose();
          },
          onError: (error: any) => {
            console.log("[cargo] update error", {
              error: error?.response?.data,
              status: error?.response?.status,
              message: error?.message,
            });
            const errorMessage =
              error?.response?.data?.message ||
              error?.message ||
              "Failed to update cargo";
            Alert.alert("Error", errorMessage);
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
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
                    Cargo created successfully!
                  </ToastDescription>
                </View>
              </Toast>
            ),
          });
          handleClose();
        },
        onError: (error: any) => {
          console.log("[cargo] create error", {
            error: error?.response?.data,
            status: error?.response?.status,
            message: error?.message,
          });
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            "Failed to create cargo";
          Alert.alert("Error", errorMessage);
        },
      });
    }
  };

  const displayCustomers = (customers || []).filter((c: Customer) => c && c._id && c._id !== selectedCustomer);
  const displayPartners = (partners as Partner[] || []).filter((p: Partner) => p && p._id && p._id !== selectedPartner);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

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
                  {initialData ? "Edit cargo" : "New cargo"}
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
                  {/* Cargo ID */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Cargo ID *
                    </Text>
                    <Input
                      variant="outline"
                      size="lg"
                      className="bg-white rounded-xl border-gray-200"
                    >
                      <InputField
                        placeholder="Enter cargo ID"
                        value={id}
                        onChangeText={setId}
                        className="text-gray-900"
                      />
                    </Input>
                    {errors.cargoId && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.cargoId}
                      </Text>
                    )}
                  </View>

                  {/* Type & Weight */}
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">
                        Cargo type *
                      </Text>
                      <CustomSelect
                        options={[
                          { label: "FCL", value: CargoType.FCL },
                          { label: "LCL", value: CargoType.LCL },
                          { label: "Air", value: CargoType.AIR },
                        ]}
                        selectedValue={cargoType}
                        onValueChange={(val) => setCargoType(val as CargoType)}
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
                        Weight (kg)
                      </Text>
                      <Input
                        variant="outline"
                        size="lg"
                        className="bg-white rounded-xl border-gray-200"
                      >
                        <InputField
                          placeholder="e.g. 1200"
                          value={weight}
                          onChangeText={setWeight}
                          keyboardType="numeric"
                          className="text-gray-900"
                        />
                      </Input>
                      {errors.weight && (
                        <Text className="text-red-500 text-sm mt-1">
                          {errors.weight}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Origin & Destination */}
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">
                        Origin
                      </Text>
                      <Input
                        variant="outline"
                        size="lg"
                        className="bg-white rounded-xl border-gray-200"
                      >
                        <InputField
                          placeholder="e.g. Shanghai, China"
                          value={origin}
                          onChangeText={setOrigin}
                          className="text-gray-900"
                        />
                      </Input>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">
                        Destination
                      </Text>
                      <Input
                        variant="outline"
                        size="lg"
                        className="bg-white rounded-xl border-gray-200"
                      >
                        <InputField
                          placeholder="e.g. Tema, Ghana"
                          value={destination}
                          onChangeText={setDestination}
                          className="text-gray-900"
                        />
                      </Input>
                    </View>
                  </View>

                  {/* Vessel & ETA */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Vessel name
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
                  <DatePickerField
                    label="ETA"
                    value={eta}
                    onChange={setEta}
                    error={errors.eta}
                  />

                  {/* Customer / Partner */}
                  <View className="mb-6 bg-gray-50 p-4 rounded-xl">
                    <Text className="text-gray-900 font-bold mb-4">
                      Assign To (Optional)
                    </Text>

                    {/* Customer */}
                    <View className="mb-4">
                      <Text className="text-gray-700 font-medium mb-2">
                        Customer
                      </Text>
                      {!selectedCustomer ? (
                        <>
                          <Input
                            variant="outline"
                            size="lg"
                            className="bg-white rounded-xl border-gray-200 mb-2"
                          >
                            <InputField
                              placeholder="Search by name, email, or phone..."
                              value={customerSearch}
                              onChangeText={setCustomerSearch}
                              className="text-gray-900"
                            />
                          </Input>
                          
                          {displayCustomers.length > 0 && (
                            <ScrollView
                              style={{ maxHeight: 200 }}
                              className="bg-white rounded-xl border border-gray-200 mb-2 z-50"
                              showsVerticalScrollIndicator={true}
                            >
                              {displayCustomers.map((customer: Customer) => (
                                <TouchableOpacity
                                  key={customer._id}
                                  onPress={() => {
                                    setSelectedCustomer(customer._id);
                                    setSelectedPartner("");
                                    setCustomerSearch("");
                                  }}
                                  className="p-3 border-b border-gray-100 flex-row justify-between items-center"
                                >
                                  <View className="flex-1">
                                    <Text
                                      className="text-gray-900 font-medium"
                                      numberOfLines={1}
                                      ellipsizeMode="tail"
                                    >
                                      {customer.name}
                                    </Text>
                                    {customer.phone && (
                                      <Text className="text-gray-500 text-xs">
                                        {customer.phone}
                                      </Text>
                                    )}
                                  </View>
                                  <Ionicons
                                    name="checkmark-circle-outline"
                                    size={20}
                                    color="#3b82f6"
                                  />
                                </TouchableOpacity>
                              ))}
                              {hasMoreCustomers && (
                                <TouchableOpacity
                                  onPress={() => fetchNextCustomers()}
                                  className="p-3 items-center"
                                  disabled={isFetchingMoreCustomers}
                                >
                                  {isFetchingMoreCustomers ? (
                                    <ActivityIndicator size="small" color="#3b82f6" />
                                  ) : (
                                    <Text className="text-blue-500 font-medium">Load more...</Text>
                                  )}
                                </TouchableOpacity>
                              )}
                            </ScrollView>
                          )}
                        </>
                      ) : (
                        <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex-row justify-between items-center">
                          <Text className="text-blue-800 font-medium flex-1">
                            {resolvedCustomers[selectedCustomer]?.name || customers.find(c => c._id === selectedCustomer)?.name || "Selected Customer"}
                          </Text>
                          <TouchableOpacity onPress={() => setSelectedCustomer("")}>
                            <Ionicons name="close-circle" size={24} color="#3b82f6" />
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      {errors.customerId && (
                        <Text className="text-red-500 text-sm mt-1">
                          {errors.customerId}
                        </Text>
                      )}
                    </View>

                    <Text className="text-center text-gray-400 font-medium mb-4">
                      - OR -
                    </Text>

                    {/* Partner */}
                    <View>
                      <Text className="text-gray-700 font-medium mb-2">
                        Partner
                      </Text>
                      {!selectedPartner ? (
                        <>
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
                          
                          {displayPartners.length > 0 && (
                            <ScrollView
                              style={{ maxHeight: 200 }}
                              className="bg-white rounded-xl border border-gray-200 mb-2 z-50"
                              showsVerticalScrollIndicator={true}
                            >
                              {displayPartners.map((partner: Partner) => (
                                <TouchableOpacity
                                  key={partner._id}
                                  onPress={() => {
                                    setSelectedPartner(partner._id);
                                    setSelectedCustomer("");
                                    setPartnerSearch("");
                                  }}
                                  className="p-3 border-b border-gray-100 flex-row justify-between items-center"
                                >
                                  <View className="flex-1">
                                    <Text
                                      className="text-gray-900 font-medium"
                                      numberOfLines={1}
                                      ellipsizeMode="tail"
                                    >
                                      {partner.name}
                                    </Text>
                                    {partner.phoneNumber ? (
                                      <Text className="text-gray-500 text-xs">
                                        {partner.phoneNumber}
                                      </Text>
                                    ) : partner.email ? (
                                      <Text className="text-gray-500 text-xs">
                                        {partner.email}
                                      </Text>
                                    ) : null}
                                  </View>
                                  <Ionicons
                                    name="checkmark-circle-outline"
                                    size={20}
                                    color="#3b82f6"
                                  />
                                </TouchableOpacity>
                              ))}
                              {hasMorePartners && (
                                <TouchableOpacity
                                  onPress={() => fetchNextPartners()}
                                  className="p-3 items-center"
                                  disabled={isFetchingMorePartners}
                                >
                                  {isFetchingMorePartners ? (
                                    <ActivityIndicator size="small" color="#3b82f6" />
                                  ) : (
                                    <Text className="text-blue-500 font-medium">Load more...</Text>
                                  )}
                                </TouchableOpacity>
                              )}
                            </ScrollView>
                          )}
                        </>
                      ) : (
                        <View className="bg-green-50 border border-green-200 rounded-xl p-3 flex-row justify-between items-center">
                          <Text className="text-green-800 font-medium flex-1">
                            {resolvedPartners[selectedPartner]?.name || partners.find(p => p._id === selectedPartner)?.name || "Selected Partner"}
                          </Text>
                          <TouchableOpacity onPress={() => setSelectedPartner("")}>
                            <Ionicons name="close-circle" size={24} color="#10b981" />
                          </TouchableOpacity>
                        </View>
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
                    disabled={isSubmitting}
                    className={`flex-1 py-4 rounded-xl items-center flex-row justify-center ${
                      isSubmitting ? "bg-gray-400" : "bg-primary-blue"
                    }`}
                  >
                    {isSubmitting ? (
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
