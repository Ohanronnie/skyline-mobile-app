import { TrackingEntryDto, trackNumber } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TimelineItem {
  id: string;
  status: "completed" | "in-progress";
  title: string;
  description?: string;
  date: string;
  time: string;
}

const formatStatusLabel = (status: string) =>
  status
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const entryToTimelineItem = (
  entry: TrackingEntryDto,
  index: number,
  all: TrackingEntryDto[]
): TimelineItem => {
  const createdAt = entry.createdAt ? new Date(entry.createdAt) : null;
  const date = createdAt ? createdAt.toLocaleDateString() : "";
  const time = createdAt
    ? createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  const state: TimelineItem["status"] =
    all.length === 1 || index === all.length - 1 ? "in-progress" : "completed";

  const description =
    typeof entry.metadata?.description === "string"
      ? entry.metadata.description
      : typeof entry.metadata?.message === "string"
      ? entry.metadata.message
      : undefined;

  return {
    id: entry.id,
    status: state,
    title: formatStatusLabel(entry.status),
    description,
    date,
    time,
  };
};

export default function ShipmentTimeline() {
  const { trackingNumber } = useLocalSearchParams<{
    trackingNumber?: string;
  }>();

  // Timeline data
  const {
    data: trackingResult,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["tracking", trackingNumber],
    queryFn: () => trackNumber(trackingNumber as string),
    enabled: !!trackingNumber,
  });

  const timelineData: TimelineItem[] =
    trackingResult?.tracking?.map(entryToTimelineItem) ?? [];

  const renderTimelineItem = (item: TimelineItem, index: number) => {
    const isCompleted = item.status === "completed";
    const isInProgress = item.status === "in-progress";
    const isLast = index === timelineData.length - 1;
    const hasActiveLine = isCompleted || isInProgress;

    return (
      <View key={item.id} className="flex-row items-start mb-4">
        {/* Icon with connecting line */}
        <View className="items-center mr-3">
          {/* Icon */}
          {isCompleted ? (
            <View className="w-12 h-12 rounded-full bg-green-500 items-center justify-center">
              <Image
                source={require("@/assets/images/completed-checkmark.png")}
                className="w-6 h-6"
                resizeMode="contain"
              />
            </View>
          ) : isInProgress ? (
            <View className="w-12 h-12 rounded-full bg-primary-blue items-center justify-center">
              <Image
                source={require("@/assets/images/time-icon.png")}
                className="w-6 h-6"
                resizeMode="contain"
              />
            </View>
          ) : (
            <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center">
              <Image
                source={require("@/assets/images/time-icon.png")}
                className="w-6 h-6"
                resizeMode="contain"
                style={{ tintColor: "#666" }}
              />
            </View>
          )}

          {/* Connecting Line - Vertical */}
          {!isLast && (
            <View
              style={{
                width: 2,
                height: 40,
                backgroundColor: hasActiveLine ? "#0065EA" : "#D1D5DB",
                marginTop: 4,
              }}
            />
          )}
        </View>

        {/* Content */}
        <View className="flex-1 pt-1">
          {/* Title */}
          <Text
            className={`text-base font-medium mb-1 ${
              isCompleted || isInProgress ? "text-[#1A293B]" : "text-gray-500"
            }`}>
            {item.title}
          </Text>

          {/* Status Text */}
          {isInProgress && (
            <Text className="text-sm font-medium text-primary-blue mb-1">
              In progress
            </Text>
          )}

          {/* Optional metadata description */}
          {item.description && (
            <Text className="text-sm text-gray-600 mb-1">
              {item.description}
            </Text>
          )}

          {/* Date and Time */}
          {item.date && item.time && (
            <Text className="text-sm text-gray-500">
              {item.date} • {item.time}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center flex-1">
          <Pressable
            onPress={() => router.back()}
            android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
            <Ionicons name="arrow-back" size={24} color="#1A293B" />
          </Pressable>
          <Text className="text-lg font-semibold text-[#1A293B] ml-3 flex-1">
            {trackingNumber || "Shipment Timeline"}
          </Text>
        </View>
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
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              if (trackingNumber) {
                refetch();
              }
            }}
            tintColor="#1A293B"
            colors={["#1A293B"]}
          />
        }>
        <View className="px-4 pt-4">
          {/* Box: Tracking History */}
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-base font-semibold text-[#1A293B] mb-4">
              Tracking history
            </Text>

            {/* Vertical Timeline */}
            {isLoading ? (
              <ActivityIndicator size="large" color="#1A293B" />
            ) : error ? (
              <Text className="text-red-500">Failed to load tracking info</Text>
            ) : trackingResult?.type === "unknown" ? (
              <Text className="text-gray-500">
                No tracking information found
              </Text>
            ) : timelineData.length === 0 ? (
              <Text className="text-gray-500">No tracking updates yet</Text>
            ) : (
              <View>
                {timelineData.map((item, index) =>
                  renderTimelineItem(
                    { ...item, id: `${item.id}-${index}` },
                    index
                  )
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
