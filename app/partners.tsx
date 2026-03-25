import { Input, InputField } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePartner, usePartners } from "@/hooks/useShipments";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const partnerStatsConfig = [
  { key: "total", label: "Total" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

export default function Partners() {
  const { data: partnersData, isLoading } = usePartners();
  const partners = Array.isArray(partnersData) ? partnersData : [];
  const createPartnerMutation = useCreatePartner();
  const { user, accessPartner } = useAuth();
  const [accessingPartnerId, setAccessingPartnerId] = useState<string | null>(
    null
  );

  const isAdmin = user?.userType === "admin" || user?.role === "admin";

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  const stats = useMemo(() => {
    const total = partners.length;
    const active = partners.filter((p: any) => p.isActive).length;
    return {
      total,
      active,
      inactive: total - active,
    };
  }, [partners]);

  const handleOpenCreate = () => {
    setErrors({});
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    if (createPartnerMutation.isPending) return;
    setIsCreateOpen(false);
  };

  const handleCreatePartner = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!phone.trim()) newErrors.phone = "Phone is required";
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      newErrors.email = "Enter a valid email";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const organization =
      (user as any)?.organization &&
      typeof (user as any)?.organization === "string"
        ? (user as any)?.organization
        : "skyline";

    createPartnerMutation.mutate(
      {
        name: name.trim(),
        phoneNumber: phone.trim(),
        email: email.trim() || undefined,
        organization,
      },
      {
        onSuccess: () => {
          console.log("mutate success");
          setName("");
          setEmail("");
          setPhone("");
          setErrors({});
          setIsCreateOpen(false);
        },
        onError: (error: any) => {
          console.log("mutate error", JSON.stringify(error));
          Alert.alert(
            "Error",
            error?.response?.data?.message || "Failed to create partner"
          );
        },
      }
    );
  };
  console.log(partners);
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <Pressable
          onPress={() => router.back()}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
          <Ionicons name="arrow-back" size={24} color="#1A293B" />
        </Pressable>
        <Text className="text-lg font-semibold text-[#1A293B]">Partners</Text>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={handleOpenCreate}
            android_ripple={{ color: "rgba(0,0,0,0.1)" }}
            className="mr-1">
            <View className="bg-primary rounded-full px-3 py-1.5 flex-row items-center">
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white text-sm font-semibold ml-1">New</Text>
            </View>
          </Pressable>
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
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-4 pt-6">
          {/* Stats */}
          <View className="flex-row justify-between mb-6">
            {partnerStatsConfig.map((stat) => (
              <View
                key={stat.label}
                className="bg-white rounded-2xl border border-gray-100 p-4 items-center"
                style={{ width: "32%" }}>
                <Text className="text-2xl font-bold text-primary-blue">
                  {stats[stat.key as keyof typeof stats] ?? 0}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Search */}
          <Text className="text-sm font-medium text-[#1A293B] mb-2">
            Search partners
          </Text>
          <Input>
            <InputField
              placeholder="Search by name, email or phone"
              placeholderTextColor="#9CA3AF"
              className="text-[#1A293B]"
            />
          </Input>

          {/* Partner List */}
          <View className="mt-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-semibold text-[#1A293B]">
                All partners ({partners.length})
              </Text>
            </View>

            {isLoading ? (
              <Text className="text-gray-500">Loading partners...</Text>
            ) : partners.length === 0 ? (
              <Text className="text-gray-500">
                No partners yet. Tap &quot;New&quot; to create one.
              </Text>
            ) : (
              partners.map((partner: any) => (
                <View
                  key={partner._id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-lg font-semibold text-[#1A293B]">
                      {partner.name}
                    </Text>
                    <View
                      className={`rounded-full px-3 py-1 ${
                        partner.isActive ? "bg-green-100" : "bg-gray-200"
                      }`}>
                      <Text
                        className={`text-xs font-semibold ${
                          partner.isActive ? "text-green-700" : "text-gray-700"
                        }`}>
                        {partner.isActive ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-sm text-gray-600 mb-1">
                    {partner.email || "No email"}
                  </Text>
                  <Text className="text-sm text-gray-600 mb-4">
                    {partner.phoneNumber || "No phone"}
                  </Text>

                  <View className="flex-row justify-between mb-4">
                    <View className="flex-1 mr-3">
                      <Text className="text-lg font-bold text-[#1A293B]">
                        {partner.shipmentCount ?? 0}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        Shipments
                      </Text>
                    </View>
                    <View className="flex-1 mr-3">
                      <Text className="text-lg font-bold text-[#1A293B]">
                        {partner.customerCount ?? 0}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        Customers
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-[#1A293B]">
                        {partner.containerCount ?? 0}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        Containers
                      </Text>
                    </View>
                  </View>

                  {/* Access Partner Button (Admin Only) */}
                  {isAdmin && (
                    <Pressable
                      onPress={async () => {
                        if (accessingPartnerId === partner._id) return;
                        try {
                          setAccessingPartnerId(partner._id);
                          await accessPartner(partner._id);
                        } catch (error: any) {
                          Alert.alert(
                            "Error",
                            error?.response?.data?.message ||
                              "Failed to access partner account"
                          );
                        } finally {
                          setAccessingPartnerId(null);
                        }
                      }}
                      disabled={accessingPartnerId === partner._id}
                      android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
                      <View className="bg-[#1A293B] rounded-xl py-2.5 px-4 flex-row items-center justify-center">
                        <Ionicons
                          name="person-outline"
                          size={16}
                          color="white"
                          style={{ marginRight: 6 }}
                        />
                        <Text className="text-white font-semibold text-sm">
                          {accessingPartnerId === partner._id
                            ? "Accessing..."
                            : "Access Partner"}
                        </Text>
                      </View>
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Create Partner Modal */}
      <Modal
        visible={isCreateOpen}
        transparent
        animationType="slide"
        onRequestClose={handleCloseCreate}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 bg-black/40"
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}>
          <View className="flex-1 justify-center items-center px-6">
            <View className="w-full max-w-md bg-white rounded-2xl p-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-semibold text-[#1A293B]">
                  New Partner
                </Text>
                <TouchableOpacity
                  onPress={handleCloseCreate}
                  disabled={createPartnerMutation.isPending}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 8 }}>
                <View className="space-y-4">
                  <View>
                    <Text className="text-sm font-medium text-[#1A293B] mb-1">
                      Name
                    </Text>
                    <Input>
                      <InputField
                        value={name}
                        onChangeText={(text) => {
                          setName(text);
                          if (errors.name)
                            setErrors((e) => ({ ...e, name: undefined }));
                        }}
                        placeholder="Partner name"
                        placeholderTextColor="#9CA3AF"
                        className="text-[#1A293B]"
                      />
                    </Input>
                    {errors.name && (
                      <Text className="text-xs text-red-500 mt-1">
                        {errors.name}
                      </Text>
                    )}
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-[#1A293B] mb-1">
                      Email
                    </Text>
                    <Input>
                      <InputField
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (errors.email)
                            setErrors((e) => ({ ...e, email: undefined }));
                        }}
                        placeholder="partner@example.com"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        className="text-[#1A293B]"
                      />
                    </Input>
                    {errors.email && (
                      <Text className="text-xs text-red-500 mt-1">
                        {errors.email}
                      </Text>
                    )}
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-[#1A293B] mb-1">
                      Phone
                    </Text>
                    <Input>
                      <InputField
                        value={phone}
                        onChangeText={(text) => {
                          setPhone(text);
                          if (errors.phone)
                            setErrors((e) => ({ ...e, phone: undefined }));
                        }}
                        placeholder="+233 54 123 4567"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                        className="text-[#1A293B]"
                      />
                    </Input>
                    {errors.phone && (
                      <Text className="text-xs text-red-500 mt-1">
                        {errors.phone}
                      </Text>
                    )}
                  </View>
                </View>
              </ScrollView>

              <Pressable
                onPress={handleCreatePartner}
                disabled={createPartnerMutation.isPending}
                className="mt-4">
                <View className="bg-primary rounded-xl py-3 items-center">
                  <Text className="text-white font-semibold text-base">
                    {createPartnerMutation.isPending ? "Creating..." : "Create"}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
