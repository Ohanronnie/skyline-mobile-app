import { Box } from "@/components/ui/box";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Text, TouchableOpacity, View } from "react-native";

interface TemplatePreviewModalProps {
  isVisible: boolean;
  onClose: () => void;
  template: {
    title: string;
    content: string;
  } | null;
}

export const TemplatePreviewModal = ({
  isVisible,
  onClose,
  template,
}: TemplatePreviewModalProps) => {
  if (!template) return null;

  // Helper to populate template with mock data
  // Handle both {{variable}} and (variable) formats for backward compatibility
  const getPopulatedContent = (content: string) => {
    return content
      .replace(/\{\{customerName\}\}/g, "John Doe")
      .replace(/\{\{trackingNumber\}\}/g, "TRACK-123456")
      .replace(/\{\{companyName\}\}/g, "Skyline Logistics")
      .replace(/\(customer name\)/gi, "John Doe")
      .replace(/\(tracking number\)/gi, "TRACK-123456")
      .replace(/\(company name\)/gi, "Skyline Logistics");
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        <Box className="bg-white rounded-2xl w-full max-w-md p-6">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-gray-900">
              Template Preview
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Template Title */}
          <Text className="text-lg font-semibold text-[#1A293B] mb-4">
            Template: {template.title}
          </Text>

          {/* Preview Box */}
          <View className="bg-[#E5E7EB] rounded-xl p-4 mb-6">
            <Text className="font-bold text-gray-700 mb-2">
              Partner Co (Skyline Logistics)
            </Text>
            <Text className="text-gray-800 leading-5">
              {getPopulatedContent(template.content)}
            </Text>
          </View>

          {/* Note Box */}
          <View className="bg-[#83590A] rounded-xl p-4 flex-row items-start">
            <Ionicons
              name="information-circle"
              size={20}
              color="white"
              style={{ marginTop: 2, marginRight: 8 }}
            />
            <Text className="text-white text-sm flex-1 leading-5">
              Note: variables like {"{"}
              {"{"} customerName {"}"}
              {"}"}, {"{"}
              {"{"} trackingNumber {"}"}
              {"}"}, and {"{"}
              {"{"} companyName {"}"}
              {"}"} will be automatically replaced with actual data.
            </Text>
          </View>
        </Box>
      </View>
    </Modal>
  );
};
