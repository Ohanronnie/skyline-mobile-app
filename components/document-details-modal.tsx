import { Box } from "@/components/ui/box";
import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast,
} from "@/components/ui/toast";
import { API_BASE_URL, Document } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DocumentDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  document: Document | null;
}

export function DocumentDetailsModal({
  visible,
  onClose,
  document,
}: DocumentDetailsModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const toast = useToast();

  if (!document) return null;

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDocumentTypeLabel = (type: string): string => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Extract filename from fileUrl
  const getFilenameFromUrl = (fileUrl: string): string => {
    if (!fileUrl) return "";
    // Handle different URL formats:
    // - /uploads/documents/filename.pdf
    // - filename.pdf
    // - http://example.com/path/filename.pdf
    const parts = fileUrl.split("/");
    return parts[parts.length - 1] || fileUrl;
  };

  const handleDownload = async () => {
    if (!document.fileUrl) {
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast
            nativeID={"toast-" + id}
            action="error"
            variant="outline"
            style={{ zIndex: 9999 }}>
            <View>
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>No file URL available</ToastDescription>
            </View>
          </Toast>
        ),
      });
      return;
    }

    setIsDownloading(true);

    try {
      // Extract filename from fileUrl
      const filename = getFilenameFromUrl(document.fileUrl);

      // Use the view endpoint: /api/documents/view/:filename
      const fileUrl = `${API_BASE_URL}/documents/view/${encodeURIComponent(
        filename
      )}`;

      // Get file extension for proper naming
      const fileExtension = filename.includes(".")
        ? filename.substring(filename.lastIndexOf("."))
        : "";
      const localFileName = `${document.name || "document"}${fileExtension}`;

      // Download file
      const fileUri = `${FileSystem.documentDirectory}${localFileName}`;
      const downloadResult = await FileSystem.downloadAsync(fileUrl, fileUri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri);
        toast.show({
          placement: "top",
          render: ({ id }) => (
            <Toast
              nativeID={"toast-" + id}
              action="success"
              variant="outline"
              style={{ zIndex: 9999 }}>
              <View>
                <ToastTitle>Success</ToastTitle>
                <ToastDescription>
                  File downloaded successfully!
                </ToastDescription>
              </View>
            </Toast>
          ),
        });
      } else {
        toast.show({
          placement: "top",
          render: ({ id }) => (
            <Toast
              nativeID={"toast-" + id}
              action="success"
              variant="outline"
              style={{ zIndex: 9999 }}>
              <View>
                <ToastTitle>Success</ToastTitle>
                <ToastDescription>File saved to device</ToastDescription>
              </View>
            </Toast>
          ),
        });
      }
    } catch (error: any) {
      console.error("Download error:", error);
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast
            nativeID={"toast-" + id}
            action="error"
            variant="outline"
            style={{ zIndex: 9999 }}>
            <View>
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>
                {error.message || "Failed to download file"}
              </ToastDescription>
            </View>
          </Toast>
        ),
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!document.fileUrl) {
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast
            nativeID={"toast-" + id}
            action="error"
            variant="outline"
            style={{ zIndex: 9999 }}>
            <View>
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>No file URL available</ToastDescription>
            </View>
          </Toast>
        ),
      });
      return;
    }

    try {
      // Extract filename from fileUrl
      const filename = getFilenameFromUrl(document.fileUrl);

      // Use the view endpoint: /api/documents/view/:filename
      const fileUrl = `${API_BASE_URL}/documents/view/${encodeURIComponent(
        filename
      )}`;

      if (await Sharing.isAvailableAsync()) {
        // Get file extension for proper naming
        const fileExtension = filename.includes(".")
          ? filename.substring(filename.lastIndexOf("."))
          : "";
        const localFileName = `temp_${
          document.name || "document"
        }${fileExtension}`;

        // Download temporarily to share
        const fileUri = `${FileSystem.documentDirectory}${localFileName}`;
        const downloadResult = await FileSystem.downloadAsync(fileUrl, fileUri);
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        // Fallback: copy URL to clipboard or show message
        toast.show({
          placement: "top",
          render: ({ id }) => (
            <Toast
              nativeID={"toast-" + id}
              action="info"
              variant="outline"
              style={{ zIndex: 9999 }}>
              <View>
                <ToastTitle>Info</ToastTitle>
                <ToastDescription>
                  Sharing not available on this device
                </ToastDescription>
              </View>
            </Toast>
          ),
        });
      }
    } catch (error: any) {
      console.error("Share error:", error);
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast
            nativeID={"toast-" + id}
            action="error"
            variant="outline"
            style={{ zIndex: 9999 }}>
            <View>
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>
                {error.message || "Failed to share file"}
              </ToastDescription>
            </View>
          </Toast>
        ),
      });
    }
  };

  const shipmentId = document.shipmentId;
  const shipmentTrackingNumber = shipmentId;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <Box className="bg-white rounded-t-3xl max-h-[85%]">
          <View className="p-6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-gray-900">
                Document details
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Document Icon and Name */}
              <View className="items-center mb-6">
                <Image
                  source={require("@/assets/images/documents-upload-icon.png")}
                  className="w-20 h-20 mb-3"
                  resizeMode="contain"
                />
                <Text className="text-lg font-semibold text-[#1A293B] text-center">
                  {document.name}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  {getDocumentTypeLabel(document.type)}
                </Text>
              </View>

              {/* Document Information */}
              <View className="bg-gray-50 rounded-xl p-4 mb-4">
                <View className="space-y-3">
                  {document.fileSize && (
                    <View>
                      <Text className="text-sm text-gray-500 mb-1">
                        File size
                      </Text>
                      <Text className="text-sm font-semibold text-[#1A293B]">
                        {formatFileSize(document.fileSize)}
                      </Text>
                    </View>
                  )}
                  {shipmentTrackingNumber && (
                    <View>
                      <Text className="text-sm text-gray-500 mb-1">
                        Related shipment
                      </Text>
                      <Text className="text-sm font-semibold text-[#1A293B]">
                        {typeof shipmentTrackingNumber === "string"
                          ? shipmentTrackingNumber
                          : String(shipmentTrackingNumber)}
                      </Text>
                    </View>
                  )}
                  {document.createdAt && (
                    <View>
                      <Text className="text-sm text-gray-500 mb-1">
                        Uploaded date
                      </Text>
                      <Text className="text-sm font-semibold text-[#1A293B]">
                        {formatDate(document.createdAt)}
                      </Text>
                    </View>
                  )}
                  {document.description && (
                    <View>
                      <Text className="text-sm text-gray-500 mb-1">
                        Description
                      </Text>
                      <Text className="text-sm font-semibold text-[#1A293B]">
                        {document.description}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 mb-4">
                <Pressable
                  onPress={handleShare}
                  android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                  className="flex-1">
                  <View className="bg-white border-2 border-[#1A293B] rounded-xl py-3 items-center flex-row justify-center">
                    <Ionicons name="share-outline" size={20} color="#1A293B" />
                    <Text className="text-[#1A293B] font-semibold text-base ml-2">
                      Share
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={handleDownload}
                  disabled={isDownloading}
                  android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                  style={{ opacity: isDownloading ? 0.7 : 1 }}
                  className="flex-1">
                  <View className="bg-[#1A293B] rounded-xl py-3 items-center flex-row justify-center">
                    {isDownloading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Ionicons name="download" size={20} color="white" />
                        <Text className="text-white font-semibold text-base ml-2">
                          Download
                        </Text>
                      </>
                    )}
                  </View>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Box>
      </View>
    </Modal>
  );
}
