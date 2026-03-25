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
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    Linking,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CustomerSupport() {
  const [selectedIssue, setSelectedIssue] = useState<string>("");
  const [message, setMessage] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I track my shipment?",
      answer:
        "You can track your shipment by going to the Shipments tab and clicking on your shipment. You'll see the full tracking timeline there.",
    },
    {
      question: "What should I do if my package is delayed?",
      answer:
        "If your package is delayed, please contact our support team via WhatsApp or phone. We'll help you track down your shipment.",
    },
    {
      question: "How long does delivery take?",
      answer:
        "Delivery times vary depending on the origin and destination. Typically, shipments from China to Ghana take 2-4 weeks.",
    },
  ];

  const handleWhatsApp = () => {
    const url = "https://wa.me/23325356767";
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open WhatsApp:", err)
    );
  };

  const handleCall = () => {
    Linking.openURL("tel:+23325356767").catch((err) =>
      console.error("Failed to make call:", err)
    );
  };

  const handleSubmitTicket = () => {
    if (selectedIssue && message.trim()) {
      console.log("Submitting ticket:", { selectedIssue, message });
      // Handle ticket submission
      setSelectedIssue("");
      setMessage("");
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
        {/* Navbar */}
        <View className="px-6 flex-row items-center justify-center bg-white py-4 border-b border-gray-200">
          <Text className="text-lg font-semibold text-[#1A293B]">Support</Text>
        </View>

        <ScrollView className="flex-1 px-6 pt-6">
          {/* Contact Us Box */}
          <Box className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
            <Text className="text-xl font-bold text-[#1A293B] mb-4">
              Contact us
            </Text>

            {/* WhatsApp */}
            <Pressable
              onPress={handleWhatsApp}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}>
              <Box
                className="rounded-xl p-4 mb-4 flex-row items-center"
                style={{ backgroundColor: "#25D366" }}>
                <Ionicons name="logo-whatsapp" size={28} color="white" />
                <View className="ml-4 flex-1">
                  <Text className="text-white font-semibold text-base">
                    WhatsApp chat with us
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </Box>
            </Pressable>

            {/* Phone */}
            <Pressable
              onPress={handleCall}
              android_ripple={{ color: "rgba(0,0,0,0.05)" }}>
              <Box className="bg-gray-100 rounded-xl p-4 flex-row items-center">
                <Ionicons name="call-outline" size={28} color="#1A293B" />
                <View className="ml-4 flex-1">
                  <Text className="text-[#1A293B] font-semibold text-base">
                    Call us
                  </Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    +23325356767
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#1A293B" />
              </Box>
            </Pressable>
          </Box>

          {/* FAQs Box */}
          <Box className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
            <Text className="text-xl font-bold text-[#1A293B] mb-4">FAQs</Text>

            {faqs.map((faq, index) => (
              <Pressable
                key={index}
                onPress={() =>
                  setExpandedFaq(expandedFaq === index ? null : index)
                }
                android_ripple={{ color: "rgba(0,0,0,0.05)" }}>
                <View
                  className={`py-4 ${
                    index < faqs.length - 1 ? "border-b border-gray-200" : ""
                  }`}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-semibold text-[#1A293B] flex-1 mr-2">
                      {faq.question}
                    </Text>
                    <Ionicons
                      name={
                        expandedFaq === index ? "chevron-up" : "chevron-down"
                      }
                      size={20}
                      color="#1A293B"
                    />
                  </View>
                  {expandedFaq === index && (
                    <Text className="text-sm text-gray-600 mt-3">
                      {faq.answer}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </Box>

          {/* Submit Ticket Box */}
          <Box className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <Text className="text-xl font-bold text-[#1A293B] mb-4">
              Submit a ticket
            </Text>
            <Text className="text-base text-gray-600 mb-6">
              submit a ticket
            </Text>

            {/* Select Issue Type */}
            <View className="mb-4">
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
                      <SelectItem label="Delivery issue" value="delivery" />
                      <SelectItem label="Payment issue" value="payment" />
                      <SelectItem label="Shipment tracking" value="tracking" />
                      <SelectItem label="Other" value="other" />
                    </SelectScrollView>
                  </SelectContent>
                </SelectPortal>
              </Select>
            </View>

            {/* Message Text Area */}
            <View className="mb-6">
              <Text className="text-base font-medium text-[#1A293B] mb-2">
                Message
              </Text>
              <View className="border border-gray-300 rounded-xl bg-white p-4 min-h-[120]">
                <TextInput
                  placeholder="describe your issue...."
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
              onPress={handleSubmitTicket}
              disabled={!selectedIssue || !message.trim()}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}>
              <Box
                className={`rounded-xl py-4 px-6 items-center ${
                  selectedIssue && message.trim()
                    ? "bg-primary"
                    : "bg-primary/50"
                }`}>
                <Text className="text-white font-semibold text-lg">
                  Submit ticket
                </Text>
              </Box>
            </Pressable>
          </Box>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
