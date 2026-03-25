import { Box } from "@/components/ui/box";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUMMARY_CARDS = [
  {
    icon: "cube-outline",
    label: "Total Shipments",
    value: 200,
  },
  {
    icon: "briefcase-outline",
    label: "Total Containers",
    value: 23,
  },
  {
    icon: "checkmark-done-outline",
    label: "Delivered",
    value: 23,
  },
  {
    icon: "stats-chart-outline",
    label: "Success Rate",
    value: "80%",
  },
];

const REPORT_TABS = [
  "Shipment Report",
  "Container Report",
  "Financial Report",
] as const;
type ReportTab = (typeof REPORT_TABS)[number];

export default function ReportsScreen() {
  const [activeTab, setActiveTab] = useState<ReportTab>("Shipment Report");

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        bounces={true}
        alwaysBounceVertical={false}>
        <View className="bg-white px-4 pt-4 pb-3">
          {/* Header */}
          <View className="flex-row items-center mb-4">
            <Pressable
              onPress={() => router.back()}
              className="mr-3"
              android_ripple={{ color: "rgba(0,0,0,0.1)", borderless: true }}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </Pressable>
            <Text className="text-lg font-semibold text-[#1A293B]">
              Reports &amp; Analytics
            </Text>
            <View className="flex-1 items-end">
              <Pressable
                onPress={() => router.push("/notification")}
                className="w-9 h-9 rounded-full bg-white items-center justify-center"
                android_ripple={{
                  color: "rgba(0,0,0,0.05)",
                  borderless: true,
                }}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color="#F59E0B"
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View className="px-4 pt-4">
          {/* Summary cards */}
          <View className="flex-row flex-wrap justify-between">
            {SUMMARY_CARDS.map((card, index) => (
              <Box
                key={card.label}
                className="bg-white rounded-2xl p-4 mb-3"
                style={[styles.cardShadow, { width: "48%" }]}>
                <View className="flex-row items-center mb-3">
                  <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mr-2">
                    <Ionicons
                      name={card.icon as any}
                      size={18}
                      color="#1D4ED8"
                    />
                  </View>
                </View>
                <Text className="text-xl font-bold text-[#111827] mb-1">
                  {card.value}
                </Text>
                <Text className="text-xs text-gray-500">{card.label}</Text>
              </Box>
            ))}
          </View>

          {/* Report type tabs */}
          <View className="flex-row mt-4 mb-3">
            {REPORT_TABS.map((tab) => {
              const isActive = tab === activeTab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-full mr-2 ${
                    isActive
                      ? "bg-[#111827]"
                      : "bg-white border border-gray-300"
                  }`}>
                  <Text
                    className={`text-xs font-medium ${
                      isActive ? "text-white" : "text-gray-600"
                    }`}>
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Export button */}
          <View className="items-end mb-4">
            <Pressable
              className="w-52 h-11 rounded-full bg-[#111827] flex-row items-center justify-center"
              android_ripple={{ color: "rgba(255,255,255,0.1)" }}
              onPress={() => {
                // TODO: hook into real export logic
              }}>
              <Ionicons name="download-outline" size={18} color="#FFFFFF" />
              <Text className="text-white font-semibold text-sm ml-2">
                Export Report
              </Text>
            </Pressable>
          </View>

          {/* Monthly performance header */}
          <View className="mb-2">
            <Text className="text-sm font-semibold text-[#111827]">
              Monthly Performance
            </Text>
          </View>

          {/* Monthly performance card */}
          <Box
            className="bg-white rounded-2xl p-4 mb-6"
            style={styles.cardShadow}>
            <View className="flex-row justify-between items-center mb-3">
              <View>
                <Text className="text-base font-semibold text-[#111827]">
                  October 2023
                </Text>
              </View>
              <View className="bg-emerald-50 rounded-full px-3 py-1">
                <Text className="text-xs font-semibold text-emerald-600">
                  92.5%
                </Text>
              </View>
            </View>

            <View className="flex-row mt-2">
              <View className="flex-1 pr-4">
                <Text className="text-xs text-gray-500 mb-1">Received</Text>
                <Text className="text-2xl font-bold text-[#111827]">145</Text>
              </View>
              <View className="flex-1 pl-4 border-l border-gray-100">
                <Text className="text-xs text-gray-500 mb-1">Containers</Text>
                <Text className="text-2xl font-bold text-[#111827]">8</Text>
              </View>
            </View>

            <View className="flex-row mt-4">
              <View className="flex-1 pr-4">
                <Text className="text-xs text-gray-500 mb-1">Delivered</Text>
                <Text className="text-xl font-semibold text-[#111827]">89</Text>
              </View>
              <View className="flex-1 pl-4 border-l border-gray-100">
                <Text className="text-xs text-gray-500 mb-1">In Transit</Text>
                <Text className="text-xl font-semibold text-[#111827]">53</Text>
              </View>
            </View>
          </Box>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
});
