import { CustomSelect } from "@/components/custom-select";
import { Input, InputField } from "@/components/ui/input";
import { useUpdateSMSTemplate } from "@/hooks/useShipments";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

interface EditTemplateModalProps {
  isVisible: boolean;
  onClose: () => void;
  template: {
    id: string;
    title: string;
    content: string;
  } | null;
  onSave: (updatedTemplate: {
    id: string;
    title: string;
    content: string;
  }) => void;
}

export function EditTemplateModal({
  isVisible,
  onClose,
  template,
  onSave,
}: EditTemplateModalProps) {
  const updateTemplateMutation = useUpdateSMSTemplate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const templateOptions = [
    { label: "Goods received at China", value: "Goods received at China" },
    { label: "Shipped", value: "Shipped" },
    { label: "In Transit", value: "In Transit" },
    { label: "Received in Ghana", value: "Received in Ghana" },
    { label: "Out for Delivery", value: "Out for Delivery" },
  ];

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setContent(template.content);
    }
  }, [template, isVisible]);

  const handleSave = async () => {
    if (!template) return;

    if (!title.trim() || !content.trim()) {
      Alert.alert("Error", "Title and content cannot be empty");
      return;
    }

    try {
      await updateTemplateMutation.mutateAsync({
        id: template.id,
        data: {
          title,
          content,
        },
      });
      onSave({
        id: template.id,
        title,
        content,
      });
      Alert.alert("Success", "Template updated successfully");
      onClose();
    } catch (error: any) {
      console.error("Update template error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update template";
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen">
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="w-full">
          <View className="bg-white rounded-3xl p-6 w-full max-w-md">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-[#1A293B]">
                Edit Template
              </Text>
              <Pressable
                onPress={onClose}
                android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
                <Ionicons name="close" size={24} color="#1A293B" />
              </Pressable>
            </View>

            {/* Template Name Select */}
            <View className="mb-6" style={{ zIndex: 10 }}>
              <Text className="text-base font-medium text-[#1A293B] mb-2">
                Template Name
              </Text>
              <CustomSelect
                options={templateOptions}
                selectedValue={title}
                onValueChange={(value) => setTitle(value)}
                placeholder="Select template type"
                disabled={true}
              />
            </View>

            {/* Message Text Area */}
            <View className="mb-6" style={{ zIndex: 1 }}>
              <Text className="text-base font-medium text-[#1A293B] mb-2">
                Message Text
              </Text>
              <Input
                variant="outline"
                size="lg"
                className="bg-white rounded-xl border-gray-200 h-40 items-start">
                <InputField
                  placeholder="Enter message text"
                  placeholderTextColor="#999"
                  value={content}
                  onChangeText={setContent}
                  multiline={true}
                  numberOfLines={6}
                  textAlignVertical="top"
                  className="text-gray-900 flex-1 py-3"
                />
              </Input>
            </View>

            {/* Actions */}
            <View className="flex-row gap-4" style={{ zIndex: 1 }}>
              <Pressable
                onPress={onClose}
                className="flex-1 border border-gray-300 rounded-full py-3 items-center">
                <Text className="text-gray-700 font-semibold text-base">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={updateTemplateMutation.isPending}
                className="flex-1 bg-[#1A293B] rounded-full py-3 items-center flex-row justify-center">
                {updateTemplateMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Save Changes
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
