import { Box } from "@/components/ui/box";
import { useSMSTemplates } from "@/hooks/useShipments";
import { SMSTemplate } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EditTemplateModal } from "./EditTemplateModal";
import { TemplatePreviewModal } from "./TemplatePreviewModal";

interface SMSManagementModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SMSManagementModal = ({
  isVisible,
  onClose,
}: SMSManagementModalProps) => {
  const { data: templates = [], isLoading, error } = useSMSTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<{
    id: string;
    title: string;
    content: string;
  } | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isEditVisible, setIsEditVisible] = useState(false);

  // Map API templates to component format
  const mappedTemplates = templates.map((template: SMSTemplate) => ({
    id: template._id,
    title: template.title,
    content: template.content,
    _original: template, // Keep original for updates
  }));

  const handleViewTemplate = (template: {
    id: string;
    title: string;
    content: string;
  }) => {
    setSelectedTemplate(template);
    setIsPreviewVisible(true);
  };

  const handleEditTemplate = (template: {
    id: string;
    title: string;
    content: string;
  }) => {
    setSelectedTemplate(template);
    setIsEditVisible(true);
  };

  const handleSaveTemplate = (updatedTemplate: {
    id: string;
    title: string;
    content: string;
  }) => {
    // This will be handled by EditTemplateModal with the mutation
    setIsEditVisible(false);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Box className="bg-white rounded-t-3xl h-[85%]">
          <View className="p-6 flex-1">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">
                SMS Templates
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerClassName="pb-6">
              {isLoading ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color="#1A293B" />
                  <Text className="text-gray-500 mt-4">
                    Loading templates...
                  </Text>
                </View>
              ) : error ? (
                <View className="py-8 items-center">
                  <Text className="text-red-500">Failed to load templates</Text>
                  <Text className="text-red-400 text-sm mt-2">
                    {(error as any)?.response?.data?.message ||
                      (error as Error)?.message ||
                      "Unknown error"}
                  </Text>
                </View>
              ) : mappedTemplates.length === 0 ? (
                <View className="py-8 items-center">
                  <Text className="text-gray-500">No templates found</Text>
                </View>
              ) : (
                <View>
                  {mappedTemplates.map((template) => (
                    <View
                      key={template.id}
                      className="border border-gray-200 rounded-xl p-4 mb-4 bg-white">
                      {/* Template Title */}
                      <Text className="text-base font-bold text-[#1A293B] mb-2">
                        {template.title}
                      </Text>

                      {/* Template Content Preview */}
                      <Text className="text-gray-600 text-sm mb-4 leading-5">
                        {template.content}
                      </Text>

                      {/* Actions */}
                      <View className="flex-row justify-end gap-4 border-t border-gray-100 pt-3">
                        <TouchableOpacity
                          className="flex-row items-center"
                          onPress={() => handleViewTemplate(template)}>
                          <Ionicons
                            name="eye-outline"
                            size={20}
                            color="#4B5563"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-row items-center"
                          onPress={() => handleEditTemplate(template)}>
                          <Ionicons
                            name="create-outline"
                            size={20}
                            color="#0065EA"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </Box>
      </View>

      <TemplatePreviewModal
        isVisible={isPreviewVisible}
        onClose={() => setIsPreviewVisible(false)}
        template={selectedTemplate}
      />

      <EditTemplateModal
        isVisible={isEditVisible}
        onClose={() => setIsEditVisible(false)}
        template={selectedTemplate}
        onSave={handleSaveTemplate}
      />
    </Modal>
  );
};
