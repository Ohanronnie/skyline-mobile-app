import { Box } from "@/components/ui/box";
import {
    Select,
    SelectBackdrop,
    SelectContent,
    SelectDragIndicator,
    SelectDragIndicatorWrapper,
    SelectIcon,
    SelectInput,
    SelectItem,
    SelectPortal,
    SelectScrollView,
    SelectTrigger,
} from "@/components/ui/select";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    Alert,
    Linking,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReportIssue() {
  const { trackingNumber } = useLocalSearchParams<{ trackingNumber: string }>();
  const [selectedIssue, setSelectedIssue] = useState<string>("");
  const [message, setMessage] = useState("");

  const handleSubmitReport = () => {
    if (!selectedIssue || !message.trim()) return;

    const phoneNumber = "23325356767"; // Skyline support number
    const text = `*Report Issue for Shipment ${trackingNumber || "Unknown"}*\n\n*Issue Type:* ${selectedIssue}\n*Message:* ${message}`;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;

    Linking.openURL(url).catch((err) => {
      console.error("Failed to open WhatsApp:", err);
      Alert.alert("Error", "Could not open WhatsApp");
    });
  };

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
            Report Issue
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView className="flex-1 px-6 pt-6">
          <Box className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <Text className="text-xl font-bold text-[#1A293B] mb-4">
              Submit a report
            </Text>
            <Text className="text-base text-gray-600 mb-6">
              Please describe the issue with shipment {trackingNumber}
            </Text>

            {/* Select Issue Type */}
            <View className="mb-4">
              <Text className="text-base font-medium text-[#1A293B] mb-2">
                Issue Type
              </Text>
              <Select
                selectedValue={selectedIssue}
                onValueChange={(value) => setSelectedIssue(value)}>
                <SelectTrigger
                  variant="outline"
                  size="lg"
                  className="bg-white border-gray-300">
                  <SelectInput
                    placeholder="Select issue type"
                    placeholderTextColor="rgba(0, 0, 0, 0.6)"
                    className="text-black"
                  />
                  <SelectIcon className="mr-3">
                    <Ionicons name="chevron-down" size={20} color="#1A293B" />
                  </SelectIcon>
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    <SelectScrollView>
                      <SelectItem label="Damaged items" value="damaged" />
                      <SelectItem label="Missing items" value="missing" />
                      <SelectItem label="Wrong items" value="wrong_items" />
                      <SelectItem label="Delivery delay" value="delay" />
                      <SelectItem label="Other" value="other" />
                    </SelectScrollView>
                  </SelectContent>
                </SelectPortal>
              </Select>
            </View>

            {/* Message Text Area */}
            <View className="mb-6">
              <Text className="text-base font-medium text-[#1A293B] mb-2">
                Description
              </Text>
              <View className="border border-gray-300 rounded-xl bg-white p-4 min-h-[120]">
                <TextInput
                  placeholder="Describe your issue in detail..."
                  placeholderTextColor="rgba(0, 0, 0, 0.6)"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                  className="text-black text-base"
                  style={{ textAlignVertical: "top", minHeight: 120 }}
                />
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmitReport}
              disabled={!selectedIssue || !message.trim()}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}>
              <Box
                className={`rounded-xl py-4 px-6 items-center flex-row justify-center ${
                  selectedIssue && message.trim()
                    ? "bg-primary"
                    : "bg-primary/50"
                }`}>
                <Ionicons name="logo-whatsapp" size={24} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-semibold text-lg">
                  Submit via WhatsApp
                </Text>
              </Box>
            </Pressable>
          </Box>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
