import { CustomSelect } from "@/components/custom-select";
import { Box } from "@/components/ui/box";
import { Input, InputField } from "@/components/ui/input";
import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast,
} from "@/components/ui/toast";
import { useShipments } from "@/hooks/useShipments";
import { Shipment, createDocument, uploadDocument } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { z } from "zod";

// Validation schema
const documentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  documentType: z.enum(["invoice", "shipping_data", "contract", "other"], {
    message: "Document type is required",
  }),
  relatedShipment: z.string().optional(),
  uploadMethod: z.enum(["url", "file_upload"], {
    message: "Upload method is required",
  }),
  description: z.string().optional(),
});

interface UploadDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UploadDocumentModal({
  visible,
  onClose,
  onSuccess,
}: UploadDocumentModalProps) {
  const [name, setName] = useState("");
  const [documentType, setDocumentType] = useState<
    "invoice" | "shipping_data" | "contract" | "other" | ""
  >("");
  const [relatedShipment, setRelatedShipment] = useState("");
  const [uploadMethod, setUploadMethod] = useState<"url" | "file_upload" | "">(
    "",
  );
  const [fileUrl, setFileUrl] = useState("");
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: shipmentsData } = useShipments();
  const shipments =
    shipmentsData?.pages
      .flatMap((page: any) => (page && page.data ? page.data : page))
      .filter(Boolean) || [];
  const toast = useToast();

  const resetForm = () => {
    setName("");
    setDocumentType("");
    setRelatedShipment("");
    setUploadMethod("");
    setFileUrl("");
    setSelectedFile(null);
    setDescription("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    // Clear previous errors
    setErrors({});

    const documentData = {
      name,
      documentType: documentType as
        | "invoice"
        | "shipping_data"
        | "contract"
        | "other",
      relatedShipment: relatedShipment || undefined,
      uploadMethod: uploadMethod as "url" | "file_upload",
      fileUrl: fileUrl || "",
      description: description || undefined,
    };

    // Validate with Zod
    const validation = documentSchema.safeParse(documentData);
    const fieldErrors: Record<string, string> = {};

    if (!validation.success) {
      // Map errors to field names
      validation.error?.issues?.forEach((issue: z.ZodIssue) => {
        const fieldName = issue.path[0] as string;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
    }

    // Additional validation for file/URL based on upload method
    if (uploadMethod === "file_upload" && !selectedFile) {
      fieldErrors.fileUrl = "Please select a file";
    } else if (uploadMethod === "url" && !fileUrl.trim()) {
      fieldErrors.fileUrl = "Please enter a URL";
    }

    // If there are any errors, set state and return
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    if (
      uploadMethod === "file_upload" &&
      selectedFile &&
      !selectedFile.canceled &&
      selectedFile.assets &&
      selectedFile.assets.length > 0
    ) {
      // File upload - use FormData
      const file = selectedFile.assets[0];
      const formData = new FormData();

      // Add file - React Native FormData format
      formData.append("file", {
        uri: file.uri,
        type: file.mimeType || "application/octet-stream",
        name: file.name || "document",
      } as any);

      // Add other fields
      formData.append("name", name);
      formData.append("type", documentType);
      if (relatedShipment) {
        formData.append("shipmentId", relatedShipment);
      }
      if (description) {
        formData.append("description", description);
      }

      uploadDocument(formData)
        .then(() => {
          setIsSubmitting(false);
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast
                nativeID={"toast-" + id}
                action="success"
                variant="outline"
                style={{ zIndex: 9999 }}
              >
                <View>
                  <ToastTitle>Success</ToastTitle>
                  <ToastDescription>
                    Document uploaded successfully!
                  </ToastDescription>
                </View>
              </Toast>
            ),
          });
          handleClose();
          onSuccess?.();
        })
        .catch((error: any) => {
          setIsSubmitting(false);
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Failed to upload document";
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast
                nativeID={"toast-" + id}
                action="error"
                variant="outline"
                style={{ zIndex: 9999 }}
              >
                <View>
                  <ToastTitle>Error</ToastTitle>
                  <ToastDescription>{errorMessage}</ToastDescription>
                </View>
              </Toast>
            ),
          });
        });
    } else if (uploadMethod === "url") {
      // URL upload - use JSON
      const documentPayload = {
        name,
        type: documentType,
        fileUrl: fileUrl.trim(),
        shipmentId: relatedShipment || undefined,
        description: description || undefined,
      };

      createDocument(documentPayload)
        .then(() => {
          setIsSubmitting(false);
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast
                nativeID={"toast-" + id}
                action="success"
                variant="outline"
                style={{ zIndex: 9999 }}
              >
                <View>
                  <ToastTitle>Success</ToastTitle>
                  <ToastDescription>
                    Document created successfully!
                  </ToastDescription>
                </View>
              </Toast>
            ),
          });
          handleClose();
          onSuccess?.();
        })
        .catch((error: any) => {
          setIsSubmitting(false);
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Failed to create document";
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast
                nativeID={"toast-" + id}
                action="error"
                variant="outline"
                style={{ zIndex: 9999 }}
              >
                <View>
                  <ToastTitle>Error</ToastTitle>
                  <ToastDescription>{errorMessage}</ToastDescription>
                </View>
              </Toast>
            ),
          });
        });
    } else {
      setIsSubmitting(false);
      setErrors({ fileUrl: "Please select a file or enter a URL" });
    }
  };

  const documentTypeOptions = [
    { label: "Invoice", value: "invoice" },
    { label: "Shipping Data", value: "shipping_data" },
    { label: "Contract", value: "contract" },
    { label: "Other", value: "other" },
  ];

  const uploadMethodOptions = [
    { label: "URL", value: "url" },
    { label: "File Upload", value: "file_upload" },
  ];

  const shipmentOptions = shipments.map((shipment: Shipment) => ({
    label: shipment.trackingNumber,
    value: shipment._id,
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/50"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Box className="bg-white rounded-t-3xl max-h-[85%]">
            <View className="p-6">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-bold text-gray-900">
                  Upload Document
                </Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View onStartShouldSetResponder={() => true}>
                  {/* Document Name - Full Width */}
                  <View className="mb-6">
                    <Text className="text-gray-700 font-medium mb-2">
                      Document name
                    </Text>
                    <Input
                      variant="outline"
                      size="lg"
                      className="bg-white rounded-xl border-gray-200"
                    >
                      <InputField
                        placeholder="Enter document name"
                        placeholderTextColor="#999"
                        value={name}
                        onChangeText={setName}
                        className="text-gray-900"
                      />
                    </Input>
                    {errors.name && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.name}
                      </Text>
                    )}
                  </View>

                  {/* Document Type - Full Width */}
                  <View className="mb-6">
                    <Text className="text-gray-700 font-medium mb-2">
                      Document type
                    </Text>
                    <CustomSelect
                      options={documentTypeOptions}
                      selectedValue={documentType}
                      onValueChange={(value) => {
                        if (value) {
                          setDocumentType(
                            value as
                              | "invoice"
                              | "shipping_data"
                              | "contract"
                              | "other",
                          );
                        }
                      }}
                      placeholder="Select document type"
                    />
                    {errors.documentType && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.documentType}
                      </Text>
                    )}
                  </View>

                  {/* Related to (Shipments) - Full Width */}
                  <View className="mb-6">
                    <Text className="text-gray-700 font-medium mb-2">
                      Related to
                    </Text>
                    <CustomSelect
                      options={
                        shipmentOptions.length > 0
                          ? shipmentOptions
                          : [{ label: "No shipments found", value: "" }]
                      }
                      selectedValue={relatedShipment}
                      onValueChange={(value) => {
                        if (value) {
                          setRelatedShipment(value);
                        }
                      }}
                      placeholder={
                        shipments.length === 0
                          ? "No shipments yet"
                          : "Select shipment"
                      }
                    />
                    {errors.relatedShipment && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.relatedShipment}
                      </Text>
                    )}
                  </View>

                  {/* Upload Method - Full Width */}
                  <View className="mb-6">
                    <Text className="text-gray-700 font-medium mb-2">
                      Upload method
                    </Text>
                    <CustomSelect
                      options={uploadMethodOptions}
                      selectedValue={uploadMethod}
                      onValueChange={(value) => {
                        if (value) {
                          setUploadMethod(value as "url" | "file_upload");
                          setFileUrl(""); // Reset file/URL when method changes
                          setSelectedFile(null); // Reset file selection
                        }
                      }}
                      placeholder="Select upload method"
                    />
                    {errors.uploadMethod && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.uploadMethod}
                      </Text>
                    )}
                  </View>

                  {/* File Upload or URL Input - Conditional */}
                  {uploadMethod === "file_upload" && (
                    <View className="mb-6">
                      <Text className="text-gray-700 font-medium mb-2">
                        File
                      </Text>
                      <Pressable
                        onPress={async () => {
                          try {
                            const result =
                              await DocumentPicker.getDocumentAsync({
                                type: "*/*",
                                copyToCacheDirectory: true,
                              });

                            if (
                              !result.canceled &&
                              result.assets &&
                              result.assets.length > 0
                            ) {
                              const file = result.assets[0];
                              setSelectedFile(result);
                              setFileUrl(file.name);
                            }
                          } catch (error) {
                            console.error("Error picking document:", error);
                            toast.show({
                              placement: "top",
                              render: ({ id }) => (
                                <Toast
                                  nativeID={"toast-" + id}
                                  action="error"
                                  variant="outline"
                                  style={{ zIndex: 9999 }}
                                >
                                  <View>
                                    <ToastTitle>Error</ToastTitle>
                                    <ToastDescription>
                                      Failed to select file. Please try again.
                                    </ToastDescription>
                                  </View>
                                </Toast>
                              ),
                            });
                          }
                        }}
                        android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                      >
                        <View className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-4 items-center">
                          <Ionicons
                            name="document-attach-outline"
                            size={32}
                            color="#9CA3AF"
                          />
                          <Text className="text-gray-500 text-sm mt-2">
                            {selectedFile && !selectedFile.canceled
                              ? "File selected"
                              : "Tap to select file"}
                          </Text>
                          {fileUrl && (
                            <Text
                              className="text-[#1A293B] text-sm mt-1 font-medium"
                              numberOfLines={1}
                            >
                              {fileUrl}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                      {errors.fileUrl && (
                        <Text className="text-red-500 text-sm mt-1">
                          {errors.fileUrl}
                        </Text>
                      )}
                    </View>
                  )}

                  {uploadMethod === "url" && (
                    <View className="mb-6">
                      <Text className="text-gray-700 font-medium mb-2">
                        URL
                      </Text>
                      <Input
                        variant="outline"
                        size="lg"
                        className="bg-white rounded-xl border-gray-200"
                      >
                        <InputField
                          placeholder="Enter document URL"
                          placeholderTextColor="#999"
                          value={fileUrl}
                          onChangeText={setFileUrl}
                          keyboardType="url"
                          autoCapitalize="none"
                          className="text-gray-900"
                        />
                      </Input>
                      {errors.fileUrl && (
                        <Text className="text-red-500 text-sm mt-1">
                          {errors.fileUrl}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Description - Full Width */}
                  <View className="mb-6">
                    <Text className="text-gray-700 font-medium mb-2">
                      Description
                    </Text>
                    <Input
                      variant="outline"
                      size="lg"
                      className="bg-white rounded-xl border-gray-200 h-[100px]"
                    >
                      <InputField
                        placeholder="Enter description (optional)"
                        placeholderTextColor="#999"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        className="text-gray-900 min-h-[100px] py-3"
                      />
                    </Input>
                    {errors.description && (
                      <Text className="text-red-500 text-sm mt-1">
                        {errors.description}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row gap-4 mt-4 mb-4">
                  <TouchableOpacity
                    onPress={handleClose}
                    className="flex-1 py-4 rounded-xl border border-gray-300 items-center"
                  >
                    <Text className="text-gray-700 font-bold text-lg">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                    className={`flex-1 py-4 rounded-xl items-center flex-row justify-center ${
                      isSubmitting ? "bg-gray-400" : "bg-primary-blue"
                    }`}
                  >
                    {isSubmitting ? (
                      <View className="flex-row items-center gap-2">
                        <ActivityIndicator color="white" size="small" />
                        <Text className="text-white font-bold text-lg">
                          Uploading...
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Ionicons
                          name="cloud-upload-outline"
                          size={24}
                          color="white"
                          className="mr-2"
                        />
                        <Text className="text-white font-bold text-lg ml-2">
                          Upload
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </Box>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
