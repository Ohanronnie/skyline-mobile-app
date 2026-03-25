import { CustomSelect } from "@/components/custom-select";
import { Box } from "@/components/ui/box";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast,
} from "@/components/ui/toast";
import { useCreateUser } from "@/hooks/useShipments";
import { UserOrganization, UserRole } from "@/lib/api";
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
import { z } from "zod";

interface AddStaffModalProps {
  visible: boolean;
  onClose: () => void;
}

const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organization: z.nativeEnum(UserOrganization, {
    message: "Organization is required",
  }),
  role: z.nativeEnum(UserRole, {
    message: "Role is required",
  }),
});

export function AddStaffModal({ visible, onClose }: AddStaffModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState<UserOrganization | "">("");
  const [role, setRole] = useState<UserRole | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const createMutation = useCreateUser();
  const toast = useToast();

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setOrganization("");
    setRole("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    setErrors({});

    const data = {
      name,
      email,
      password,
      organization: organization as UserOrganization,
      role: role as UserRole,
    };

    const validation = staffSchema.safeParse(data);
    const fieldErrors: Record<string, string> = {};

    if (!validation.success) {
      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        fieldErrors[fieldName] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    createMutation.mutate(data, {
      onSuccess: () => {
        toast.show({
          placement: "top",
          render: ({ id }) => (
            <Toast nativeID={"toast-" + id} action="success" variant="outline">
              <View>
                <ToastTitle>Success</ToastTitle>
                <ToastDescription>
                  Staff user created successfully!
                </ToastDescription>
              </View>
            </Toast>
          ),
        });
        handleClose();
      },
      onError: () => {
        Alert.alert(
          "Error",
          "Failed to create staff user. Please check your inputs and try again.",
        );
      },
    });
  };

  const organizationOptions = Object.values(UserOrganization).map((org) => ({
    label: org.charAt(0).toUpperCase() + org.slice(1),
    value: org,
  }));

  const roleOptions = Object.values(UserRole).map((r) => ({
    label:
      r === UserRole.ADMIN
        ? "Admin"
        : r === UserRole.CHINA_STAFF
          ? "China Staff"
          : "Ghana Staff",
    value: r,
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
          <Box className="bg-white rounded-t-3xl max-h-[90%]">
            <View className="p-6">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-bold text-gray-900">
                  New staff / admin
                </Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-6"
              >
                <View onStartShouldSetResponder={() => true}>
                  {/* Name */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Full name *
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

                  {/* Email */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Email *
                    </Text>
                    <Input
                      variant="outline"
                      size="lg"
                      className="bg-white rounded-xl border-gray-200"
                    >
                      <InputField
                        placeholder="Enter email address"
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

                  {/* Password */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Password *
                    </Text>
                    <Input
                      variant="outline"
                      size="lg"
                      className="bg-white rounded-xl border-gray-200"
                    >
                      <InputField
                        placeholder="Minimum 8 characters"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        className="text-gray-900 flex-1"
                      />
                      <InputSlot
                        className="pr-3"
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons
                          name={showPassword ? "eye-off" : "eye"}
                          size={20}
                          color="#6B7280"
                        />
                      </InputSlot>
                    </Input>
                    {errors.password && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.password}
                      </Text>
                    )}
                  </View>

                  {/* Organization & Role */}
                  <View className="flex-row gap-3 mb-6">
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">
                        Organization *
                      </Text>
                      <CustomSelect
                        options={organizationOptions}
                        selectedValue={organization}
                        onValueChange={(value) =>
                          setOrganization(value as UserOrganization)
                        }
                        placeholder="Select organization"
                        direction="up"
                        variant="filled"
                      />
                      {errors.organization && (
                        <Text className="text-red-500 text-sm mt-1">
                          {errors.organization}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">
                        Role *
                      </Text>
                      <CustomSelect
                        options={roleOptions}
                        selectedValue={role}
                        onValueChange={(value) => setRole(value as UserRole)}
                        placeholder="Select role"
                        direction="up"
                        variant="filled"
                      />
                      {errors.role && (
                        <Text className="text-red-500 text-sm mt-1">
                          {errors.role}
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
                    disabled={createMutation.isPending}
                    className={`flex-1 py-4 rounded-xl items-center flex-row justify-center ${
                      createMutation.isPending
                        ? "bg-gray-400"
                        : "bg-primary-blue"
                    }`}
                  >
                    {createMutation.isPending ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Ionicons name="save" size={20} color="white" />
                        <Text className="text-white font-bold text-lg ml-2">
                          Save
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
