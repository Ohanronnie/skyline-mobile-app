import { AddStaffModal } from "@/components/add-staff-modal";
import { useDeleteUser, useUsers } from "@/hooks/useShipments";
import { UserOrganization, UserRole } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Staffs() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users = [], isLoading, refetch } = useUsers();
  const deleteMutation = useDeleteUser();

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getTagsForUser = (user: {
    role: UserRole;
    isActive: boolean;
    emailVerified: boolean;
    organization: UserOrganization;
  }) => {
    const tags: string[] = [];

    if (user.role === UserRole.ADMIN) tags.push("Admin");
    if (user.role === UserRole.CHINA_STAFF) tags.push("China Staff");
    if (user.role === UserRole.GHANA_STAFF) tags.push("Ghana Staff");

    if (user.emailVerified) tags.push("Verified");
    if (user.isActive) tags.push("Active");

    return tags;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F3F4F6]">
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <Pressable
          onPress={() => router.back()}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
          <Ionicons name="arrow-back" size={24} color="#1A293B" />
        </Pressable>
        <Text className="text-lg font-semibold text-[#1A293B]">Staffs</Text>
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

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }>
        <View className="px-4 pt-4">
          {/* Search */}
          <View className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex-row items-center mb-4">
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              className="ml-3 flex-1 text-sm text-[#111827]"
              placeholder="Search staff members ......"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Header with Add Staff */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-semibold text-[#111827]">
              Team Members ({filteredUsers.length})
            </Text>
            <Pressable
              onPress={() => setShowAddModal(true)}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}
              className="rounded-full overflow-hidden">
              <View className="flex-row items-center bg-[#111827] px-4 py-2 rounded-full">
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text className="text-white font-semibold text-sm ml-2">
                  Add Staff
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Staff list */}
          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#1A293B" />
            </View>
          ) : filteredUsers.length === 0 ? (
            <Text className="text-center text-gray-500 mt-8">
              No staff members found
            </Text>
          ) : (
            <View className="space-y-3">
              {filteredUsers.map((user) => {
                const initials = getInitials(user.name);
                const tags = getTagsForUser(user);

                return (
                  <View
                    key={user._id}
                    className="bg-white rounded-2xl flex-row items-center px-4 py-3 mb-2">
                    {/* Avatar */}
                    <View className="w-12 h-12 rounded-xl bg-emerald-200 items-center justify-center mr-4">
                      <Text className="text-sm font-semibold text-[#1A293B]">
                        {initials}
                      </Text>
                    </View>

                    {/* Info */}
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-[#111827]">
                        {user.name}
                      </Text>
                      <Text className="text-xs text-gray-500 mb-2">
                        {user.email}
                      </Text>
                      <View className="flex-row flex-wrap">
                        {tags.map((tag) => {
                          const isAdmin = tag === "Admin";
                          const isVerified = tag === "Verified";
                          const isActive = tag === "Active";

                          let bgClass = "bg-emerald-100";
                          let textClass = "text-emerald-700";

                          if (isAdmin) {
                            bgClass = "bg-emerald-100";
                            textClass = "text-emerald-700";
                          } else if (isVerified) {
                            bgClass = "bg-blue-100";
                            textClass = "text-blue-700";
                          } else if (isActive) {
                            bgClass = "bg-emerald-100";
                            textClass = "text-emerald-700";
                          } else {
                            bgClass = "bg-amber-100";
                            textClass = "text-amber-700";
                          }

                          return (
                            <View
                              key={tag}
                              className={`px-3 py-1 rounded-full mr-2 mb-1 ${bgClass}`}>
                              <Text
                                className={`text-xs font-semibold ${textClass}`}>
                                {tag}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Delete icon */}
                    <Pressable
                      android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                      onPress={() => {
                        Alert.alert(
                          "Delete staff",
                          "Are you sure you want to delete this staff member?",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: () => deleteMutation.mutate(user._id),
                            },
                          ]
                        );
                      }}>
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#EF4444"
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <AddStaffModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </SafeAreaView>
  );
}
