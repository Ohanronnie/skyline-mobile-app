import { Box } from "@/components/ui/box";
import {
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    Notification,
    NotificationType,
} from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CustomerNotifications() {
  const [activeFilter, setActiveFilter] = useState("All");
  const queryClient = useQueryClient();
  const hasMarkedAllRead = useRef(false);

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  // Mark single notification as read mutation
  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  // Mark all as read when page loads (only once after data is loaded)
  useEffect(() => {
    if (
      !hasMarkedAllRead.current &&
      !isLoading &&
      notifications.length > 0 &&
      notifications.some((n) => !n.read)
    ) {
      hasMarkedAllRead.current = true;
      markAllReadMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, notifications.length]);

  // Get icon based on notification type
  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case "success":
        return "checkmark-circle-outline";
      case "warning":
        return "warning-outline";
      case "error":
        return "close-circle-outline";
      default:
        return "information-circle-outline";
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  // Filter notifications
  const filteredNotifications =
    activeFilter === "All"
      ? notifications
      : notifications.filter((n) => {
          // Map notification types to filter categories
          if (activeFilter === "shipments") {
            return (
              n.metadata?.shipmentId ||
              n.title.toLowerCase().includes("shipment")
            );
          }
          if (activeFilter === "alerts") {
            return n.type === "warning" || n.type === "error";
          }
          return true;
        });

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      markReadMutation.mutate(notification._id);
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
        {/* Navbar */}
        <View className="px-6 flex-row items-center bg-white py-4 border-b border-gray-200">
          <Pressable
            onPress={() => router.back()}
            className="mr-3"
            android_ripple={{ color: "rgba(0,0,0,0.1)", borderless: true }}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-lg font-semibold text-[#1A293B]">
            Notification
          </Text>
        </View>

        {/* Filters */}
        <View className="px-6 py-4 bg-white border-b border-gray-200 flex-row gap-3">
          <Pressable
            onPress={() => setActiveFilter("All")}
            android_ripple={{ color: "rgba(0,0,0,0.05)" }}>
            <View
              className={`px-4 py-2 rounded-full ${
                activeFilter === "All" ? "bg-primary" : "bg-gray-100"
              }`}>
              <Text
                className={`font-semibold ${
                  activeFilter === "All" ? "text-white" : "text-gray-600"
                }`}>
                All
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setActiveFilter("shipments")}
            android_ripple={{ color: "rgba(0,0,0,0.05)" }}>
            <View
              className={`px-4 py-2 rounded-full ${
                activeFilter === "shipments" ? "bg-primary" : "bg-gray-100"
              }`}>
              <Text
                className={`font-semibold ${
                  activeFilter === "shipments" ? "text-white" : "text-gray-600"
                }`}>
                shipments
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setActiveFilter("alerts")}
            android_ripple={{ color: "rgba(0,0,0,0.05)" }}>
            <View
              className={`px-4 py-2 rounded-full ${
                activeFilter === "alerts" ? "bg-primary" : "bg-gray-100"
              }`}>
              <Text
                className={`font-semibold ${
                  activeFilter === "alerts" ? "text-white" : "text-gray-600"
                }`}>
                alerts
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Notifications List */}
        <ScrollView
          className="flex-1 px-6 pt-6"
          contentInsetAdjustmentBehavior="automatic"
          bounces={true}
          alwaysBounceVertical={false}>
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#1A293B" />
              <Text className="text-gray-600 mt-4">
                Loading notifications...
              </Text>
            </View>
          ) : filteredNotifications.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons
                name="notifications-outline"
                size={64}
                color="#9CA3AF"
              />
              <Text className="text-gray-600 mt-4 text-center">
                No notifications found
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notification) => (
              <Pressable
                key={notification._id}
                onPress={() => handleNotificationPress(notification)}
                android_ripple={{ color: "rgba(0,0,0,0.05)" }}>
                <Box
                  className={`bg-white rounded-xl p-4 border mb-4 ${
                    notification.read
                      ? "border-gray-200"
                      : "border-primary bg-blue-50"
                  }`}>
                  <View className="flex-row items-start gap-4">
                    {/* Icon */}
                    <View
                      className={`w-12 h-12 rounded-full items-center justify-center ${
                        notification.read ? "bg-gray-100" : "bg-primary/10"
                      }`}>
                      <Ionicons
                        name={getIconForType(notification.type) as any}
                        size={24}
                        color={notification.read ? "#1A293B" : "#1A293B"}
                      />
                    </View>

                    {/* Content */}
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text
                          className={`text-base font-semibold ${
                            notification.read
                              ? "text-[#1A293B]"
                              : "text-[#1A293B]"
                          }`}>
                          {notification.title}
                        </Text>
                        {!notification.read && (
                          <View className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </View>
                      <Text className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {formatTimeAgo(notification.createdAt)}
                      </Text>
                    </View>
                  </View>
                </Box>
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
