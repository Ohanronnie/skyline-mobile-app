import { Box } from "@/components/ui/box";
import { useShipmentDetails } from "@/hooks/useShipments";
import { TrackingEntryDto, trackNumber } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

interface TimelineItem {
  icon: string;
  title: string;
  date: string;
  completed: boolean;
  isDelivered: boolean;
}

const formatStatusLabel = (status: string) =>
  status
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const entryToTimelineItem = (entry: TrackingEntryDto): TimelineItem => {
  const createdAt = entry.createdAt ? new Date(entry.createdAt) : null;
  const date = createdAt
    ? createdAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const normalizedStatus = entry.status.toLowerCase();

  let icon: string = "time-outline";
  if (normalizedStatus.includes("received")) {
    icon = "cube-outline";
  } else if (
    normalizedStatus.includes("loaded") ||
    normalizedStatus.includes("loading")
  ) {
    icon = "boat-outline";
  } else if (
    normalizedStatus.includes("arrived") ||
    normalizedStatus.includes("in_transit")
  ) {
    icon = "airplane-outline";
  } else if (
    normalizedStatus.includes("out_for_delivery") ||
    normalizedStatus.includes("dispatch")
  ) {
    icon = "car-outline";
  } else if (normalizedStatus.includes("delivered")) {
    icon = "checkmark-circle";
  }

  const isDelivered = normalizedStatus.includes("delivered");

  return {
    icon,
    title: formatStatusLabel(entry.status),
    date,
    completed: true,
    isDelivered,
  };
};

export default function ShipmentDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: shipment, isLoading } = useShipmentDetails(id || "");

  const handleCopy = async () => {
    if (!shipment?.trackingNumber) return;
    try {
      await Clipboard.setStringAsync(shipment.trackingNumber);
      Alert.alert("Copied", "Tracking number copied to clipboard");
    } catch (error) {
      Alert.alert("Tracking Number", shipment.trackingNumber);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const trackingNumber = shipment?.trackingNumber ?? "";

  const {
    data: trackingResult,
    isLoading: isTrackingLoading,
    error: trackingError,
  } = useQuery({
    queryKey: ["tracking", trackingNumber],
    queryFn: () => trackNumber(trackingNumber),
    enabled: !!trackingNumber,
  });

  const timelineItems: TimelineItem[] =
    trackingResult?.tracking?.map(entryToTimelineItem) ?? [];

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
        {/* Navbar */}
        <View className="px-6 flex-row items-center justify-between bg-white py-4 border-b border-gray-200">
          <Pressable
            onPress={() => router.back()}
            android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
            <Ionicons name="arrow-back" size={24} color="#1A293B" />
          </Pressable>
          <Text className="text-lg font-semibold text-[#1A293B] flex-1 text-center mx-4">
            {shipment?.trackingNumber ?? "Shipment details"}
          </Text>
          <Pressable
            onPress={handleCopy}
            android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
            <Ionicons name="copy-outline" size={24} color="#1A293B" />
          </Pressable>
        </View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center bg-gray-50">
            <ActivityIndicator size="large" color="#1A293B" />
          </View>
        ) : !shipment ? (
          <View className="flex-1 justify-center items-center bg-gray-50">
            <Text className="text-gray-500">Shipment not found</Text>
            <Pressable onPress={() => router.back()} className="mt-4">
              <Text className="text-[#1A293B] font-semibold">Go Back</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView className="flex-1 px-6 pt-6">
            <Box className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
              <Text className="text-xl font-bold text-[#1A293B] mb-6">
                Tracking timeline
              </Text>

              {isTrackingLoading ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#1A293B" />
                </View>
              ) : trackingError ? (
                <Text className="text-base text-red-500">
                  Failed to load tracking information
                </Text>
              ) : timelineItems.length === 0 ? (
                <Text className="text-base text-gray-500">
                  No tracking updates yet
                </Text>
              ) : (
                timelineItems.map((item, index) => (
                  <View
                    key={index}
                    className={
                      index === timelineItems.length - 1 ? "" : "mb-4"
                    }>
                    <View className="flex-row gap-4 items-start">
                      {/* Icon */}
                      <View
                        className="rounded-full items-center justify-center"
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: item.isDelivered
                            ? "rgba(37, 243, 138, 0.1)"
                            : item.completed
                            ? "#E5E7EB"
                            : "#F3F4F6",
                        }}>
                        <Ionicons
                          name={item.icon as any}
                          size={28}
                          color={
                            item.isDelivered
                              ? "#25F38A"
                              : item.completed
                              ? "#1A293B"
                              : "#9CA3AF"
                          }
                        />
                      </View>

                      {/* Content */}
                      <View className="flex-1">
                        <Text
                          className={`text-lg font-semibold mb-2 ${
                            item.completed || item.isDelivered
                              ? "text-[#1A293B]"
                              : "text-gray-400"
                          }`}>
                          {item.title}
                        </Text>
                        {item.date ? (
                          <Text className="text-base text-gray-500">
                            {item.date}
                          </Text>
                        ) : (
                          <Text className="text-base text-gray-400 italic">
                            {item.completed ? "Completed" : "Pending"}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </Box>

            {/* Shipment Details Box */}
            <Box className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
              <Text className="text-xl font-bold text-[#1A293B] mb-6">
                Shipment Details
              </Text>

              {/* Table */}
              <View className="space-y-4">
                <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                  <Text className="text-base text-gray-600">Origin:</Text>
                  <Text className="text-base font-semibold text-[#1A293B]">
                    China
                  </Text>
                </View>
                <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                  <Text className="text-base text-gray-600">Destination:</Text>
                  <Text className="text-base font-semibold text-[#1A293B]">
                    Ghana
                  </Text>
                </View>
                <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                  <Text className="text-base text-gray-600">Status:</Text>
                  <Text className="text-base font-semibold text-[#1A293B]">
                    {shipment.status.replace(/_/g, " ")}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center py-3">
                  <Text className="text-base text-gray-600">Created At:</Text>
                  <Text className="text-base font-semibold text-[#1A293B]">
                    {formatDate(shipment.createdAt)}
                  </Text>
                </View>
              </View>
            </Box>

            {/* Action Buttons */}
            <View className="mb-6">
              <Pressable
                onPress={() => router.push("/(customer)/(tabs)/support")}
                android_ripple={{ color: "rgba(255,255,255,0.2)" }}>
                <Box className="bg-primary rounded-xl py-4 px-6 items-center mb-4">
                  <Text className="text-white font-semibold text-lg">
                    Contact support
                  </Text>
                </Box>
              </Pressable>

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(customer)/report-issue",
                    params: { trackingNumber: shipment.trackingNumber },
                  })
                }
                android_ripple={{ color: "rgba(0,0,0,0.05)" }}>
                <Box className="border-2 border-[#1A293B] rounded-xl py-4 px-6 items-center">
                  <Text className="text-[#1A293B] font-semibold text-lg">
                    Report issue
                  </Text>
                </Box>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}
