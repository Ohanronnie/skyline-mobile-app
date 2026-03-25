import { LegalLinksRow } from "@/components/legal-links-row";
import { CompanyInfoModal } from "@/components/partners/CompanyInfoModal";
import { SMSManagementModal } from "@/components/partners/SMSManagementModal";
import { Box } from "@/components/ui/box";
import { useAuth, useRequireAuth } from "@/contexts/AuthContext";
import { useUpdatePartnerProfile } from "@/hooks/useShipments";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PartnerProfile() {
  useRequireAuth();
  const { user, logout, refetchUser } = useAuth();
  const updatePartnerMutation = useUpdatePartnerProfile();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [companyName, setCompanyName] = useState(user?.name || "");
  const [isCompanyInfoModalVisible, setIsCompanyInfoModalVisible] =
    useState(false);
  const [isSMSModalVisible, setIsSMSModalVisible] = useState(false);

  // Update company name when user data loads
  useEffect(() => {
    if (user?.name) {
      setCompanyName(user.name);
    }
  }, [user?.name]);

  const handleSaveName = async () => {
    if (!companyName.trim()) {
      Alert.alert("Error", "Company name cannot be empty");
      return;
    }

    try {
      await updatePartnerMutation.mutateAsync({ name: companyName });
      setIsEditingName(false);
      await refetchUser(); // Refresh user data
      Alert.alert("Success", "Company name updated successfully");
    } catch (error: any) {
      console.error("Update name error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update company name";
      Alert.alert("Error", errorMessage);
    }
  };

  const handleSaveCompanyInfo = async (data: any) => {
    try {
      await updatePartnerMutation.mutateAsync({
        name: data.companyName,
        businessRegistrationNumber: data.registrationNumber,
        email: data.email,
        phoneNumber: data.phone,
        businessAddress: data.address,
      });
      setIsCompanyInfoModalVisible(false);
      await refetchUser(); // Refresh user data
      Alert.alert("Success", "Company information updated successfully");
    } catch (error: any) {
      console.error("Update company info error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update company information";
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <Text className="text-lg font-bold text-[#1A293B]">
          {user?.name || "Partner"}
        </Text>
        <Pressable
          onPress={() => router.push("/(partners)/notification")}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
          <Box className="p-2 bg-gray-50 rounded-full">
            <Image
              source={require("@/assets/images/notification-icon.png")}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </Box>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-6"
        contentContainerClassName="pb-24">
        <View className="bg-white rounded-2xl p-6 border border-gray-100 items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-primary-blue items-center justify-center mb-4">
            <Image
              source={require("@/assets/images/profile-dummy.png")}
              className="w-16 h-16"
              resizeMode="contain"
            />
          </View>

          {/* Editable Company Name */}
          <View className="flex-row items-center justify-center mb-1">
            {isEditingName ? (
              <View className="flex-row items-center">
                <TextInput
                  value={companyName}
                  onChangeText={setCompanyName}
                  className="text-2xl font-bold text-[#1A293B] border-b border-primary-blue min-w-[150px] text-center mr-2"
                  autoFocus
                />
                <TouchableOpacity
                  onPress={handleSaveName}
                  disabled={updatePartnerMutation.isPending}>
                  {updatePartnerMutation.isPending ? (
                    <Ionicons name="hourglass" size={24} color="#9CA3AF" />
                  ) : (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#0065EA"
                    />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setIsEditingName(true)}
                className="flex-row items-center">
                <Text className="text-2xl font-bold text-[#1A293B] mr-2">
                  {companyName}
                </Text>
                <Ionicons name="pencil" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <Text className="text-sm text-gray-600 mb-6">
            {user?.role || "Partner"} • {user?.organization || "Organization"}
          </Text>

          <View className="flex-row w-full justify-between">
            {[
              {
                label: "Shipments",
                value: user?.shipmentCount?.toString() || "0",
              },
              {
                label: "Containers",
                value: user?.containerCount?.toString() || "0",
              },
              {
                label: "Customers",
                value: user?.customerCount?.toString() || "0",
              },
            ].map((item) => (
              <View key={item.label} className="items-center flex-1">
                <Text className="text-2xl font-bold text-primary-blue">
                  {item.value}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Preferences */}
        <View className="mb-8">
          {/* Company Info (Only Name Editable above) */}
          <TouchableOpacity
            onPress={() => setIsCompanyInfoModalVisible(true)}
            className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                <Ionicons name="business" size={20} color="#0065EA" />
              </View>
              <View>
                <Text className="text-base font-semibold text-[#1A293B]">
                  Company Info
                </Text>
                <Text className="text-sm text-gray-500">
                  Manage company details
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Image
                source={require("@/assets/images/translation-icon.png")}
                className="w-10 h-10 mr-3"
                resizeMode="contain"
              />
              <View>
                <Text className="text-base font-semibold text-[#1A293B]">
                  Language
                </Text>
                <Text className="text-sm text-gray-500">English (US)</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>

          <View className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Image
                source={require("@/assets/images/notification-bell.png")}
                className="w-10 h-10 mr-3"
                resizeMode="contain"
              />
              <View>
                <Text className="text-base font-semibold text-[#1A293B]">
                  Notifications
                </Text>
                <Text className="text-sm text-gray-500">
                  Manage notifications
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#D1D5DB", true: "#9CC9FF" }}
              thumbColor={notificationsEnabled ? "#0065EA" : "#F4F4F5"}
            />
          </View>

          <TouchableOpacity
            onPress={() => setIsSMSModalVisible(true)}
            className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center justify-between">
            <View>
              <Text className="text-base font-semibold text-[#1A293B]">
                SMS
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                Manage SMS sent to your customers
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <LegalLinksRow />

        {/* Sign out */}
        <Pressable
          onPress={async () => {
            try {
              await logout();
            } catch (error) {
              console.error("Logout error:", error);
              // Force navigation even if logout fails
              router.replace("/(auth)");
            }
          }}
          android_ripple={{ color: "rgba(255,0,0,0.1)" }}
          className="mt-4 mb-8">
          <View className="bg-red-100 rounded-full py-3 items-center border border-red-200">
            <Text className="text-red-600 font-semibold text-base">
              Sign out
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      <CompanyInfoModal
        isVisible={isCompanyInfoModalVisible}
        onClose={() => setIsCompanyInfoModalVisible(false)}
        onSave={handleSaveCompanyInfo}
        initialData={{
          companyName: user?.name || "",
          registrationNumber: user?.businessRegistrationNumber || "",
          email: user?.email || "",
          phone: user?.phoneNumber || "",
          address: user?.businessAddress || "",
        }}
      />

      <SMSManagementModal
        isVisible={isSMSModalVisible}
        onClose={() => setIsSMSModalVisible(false)}
      />
    </SafeAreaView>
  );
}
