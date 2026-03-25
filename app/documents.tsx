import { DocumentDetailsModal } from "@/components/document-details-modal";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { UploadDocumentModal } from "@/components/upload-document-modal";
import { useDocuments } from "@/hooks/useShipments";
import { Document as ApiDocument } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
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

// Mock document type - replace with actual API type when available
interface MockDocument {
  _id: string;
  filename: string;
  fileType: string;
  documentType: "invoice" | "shipping_data" | "contract" | "other";
  uploadedDate: string;
  fileSize: number; // in bytes
  relatedShipment?: {
    trackingNumber: string;
  };
  uploadedBy: {
    fullName: string;
  };
}

const filterOptions = [
  "All documents",
  "Invoices",
  "Shipping data",
  "Contracts",
];

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All documents");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ApiDocument | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data: documents = [], isLoading, refetch } = useDocuments();

  // Mock data fallback - remove when API is fully connected
  const mockDocuments: MockDocument[] = [
    {
      _id: "1",
      filename: "invoice_2024_001.pdf",
      fileType: "PDF",
      documentType: "invoice",
      uploadedDate: "2024-01-15",
      fileSize: 1024000, // 1MB
      relatedShipment: {
        trackingNumber: "TRK-12345",
      },
      uploadedBy: {
        fullName: "John Doe",
      },
    },
    {
      _id: "2",
      filename: "shipping_label_001.pdf",
      fileType: "PDF",
      documentType: "shipping_data",
      uploadedDate: "2024-01-16",
      fileSize: 512000, // 0.5MB
      relatedShipment: {
        trackingNumber: "TRK-12346",
      },
      uploadedBy: {
        fullName: "Jane Smith",
      },
    },
  ];

  // Use API data if available, otherwise use mock data: mockDocuments
  const displayDocuments = documents;

  const documentStats = useMemo(() => {
    const total = displayDocuments.length;
    const invoices = displayDocuments.filter(
      (d: any) => d.type === "invoice" || d.documentType === "invoice"
    ).length;
    const totalSize = displayDocuments.reduce(
      (acc: number, d: any) => acc + (d.fileSize || 0),
      0
    );
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(1);

    return [
      { label: "Total docs", value: total },
      { label: "Invoices", value: invoices },
      { label: "Storage", value: `${sizeInMB}MB` },
    ];
  }, [displayDocuments]);

  const filteredDocuments = useMemo(() => {
    return displayDocuments.filter((doc: any) => {
      const docType = doc.type || doc.documentType;
      const filename = doc.name || doc.filename;
      const shipmentId = doc.shipmentId || doc.relatedShipment;
      const trackingNumber =
        typeof shipmentId === "object" && shipmentId !== null
          ? shipmentId.trackingNumber
          : shipmentId || doc.relatedShipment?.trackingNumber;

      const matchesSearch =
        filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trackingNumber &&
          String(trackingNumber)
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      const matchesFilter =
        selectedFilter === "All documents" ||
        (selectedFilter === "Invoices" && docType === "invoice") ||
        (selectedFilter === "Shipping data" && docType === "shipping_data") ||
        (selectedFilter === "Contracts" && docType === "contract");

      return matchesSearch && matchesFilter;
    });
  }, [displayDocuments, searchQuery, selectedFilter]);

  const formatFileSize = (bytes: number): string => {
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

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <Pressable
          onPress={() => router.back()}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
          <Ionicons name="arrow-back" size={24} color="#1A293B" />
        </Pressable>
        <Text className="text-lg font-semibold text-[#1A293B]">Documents</Text>
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }>
        <View className="px-4 pt-6">
          {/* Stats */}
          <View className="flex-row justify-between mb-6">
            {documentStats.map((stat) => (
              <View
                key={stat.label}
                className="bg-white rounded-2xl border border-gray-100 p-4 items-center"
                style={{ width: "32%" }}>
                <Text className="text-2xl font-bold text-primary-blue">
                  {stat.value}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Upload Button - Aligned Right */}
          <View className="flex-row justify-end mb-3">
            <Pressable
              onPress={() => setShowUploadModal(true)}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}>
              <View className="bg-[#1A293B] rounded-xl px-3 py-2 flex-row items-center justify-center">
                <Ionicons name="add" size={18} color="white" />
                <Text className="text-white text-xs ml-2">
                  Upload Documents
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Search Input */}
          <View className="mb-6">
            <Input className="bg-white rounded-xl border-gray-200">
              <InputSlot className="pl-3">
                <Ionicons name="search" size={20} color="#999" />
              </InputSlot>
              <InputField
                placeholder="Search documents"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="text-[#1A293B]"
              />
            </Input>
          </View>

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ gap: 8 }}>
            {filterOptions.map((option) => {
              const isSelected = selectedFilter === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setSelectedFilter(option)}
                  android_ripple={{ color: "rgba(255,255,255,0.1)" }}>
                  <View
                    className={`px-4 py-2 rounded-full border ${
                      isSelected
                        ? "bg-[#1A293B] border-[#1A293B]"
                        : "bg-transparent border-[#1A293B]"
                    }`}>
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? "text-white" : "text-[#1A293B]"
                      }`}>
                      {option}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Documents List */}
          {isLoading ? (
            <ActivityIndicator size="large" color="#1A293B" />
          ) : (
            <View className="space-y-4">
              {filteredDocuments.map((document: any) => {
                const filename = document.name || document.filename;
                const fileType = document.fileType || "Document";
                const docType =
                  document.type || document.documentType || "other";
                const uploadedDate =
                  document.createdAt || document.uploadedDate;
                const fileSize = document.fileSize || 0;
                const shipmentId = document.shipmentId;
                const shipmentTrackingNumber =
                  typeof shipmentId === "object" && shipmentId !== null
                    ? shipmentId.trackingNumber || shipmentId._id
                    : shipmentId;
                const uploadedBy = document.uploadedBy?.fullName || "System";

                return (
                  <View
                    key={document._id}
                    className="bg-white rounded-2xl border border-gray-100 p-4">
                    {/* Header with Icon and Filename */}
                    <View className="flex-row items-start mb-4">
                      <Image
                        source={require("@/assets/images/documents-upload-icon.png")}
                        className="w-12 h-12 mr-3"
                        resizeMode="contain"
                      />
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-[#1A293B] mb-1">
                          {filename}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {fileType} •{" "}
                          {docType
                            .split("_")
                            .map(
                              (word: string) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </Text>
                        {uploadedDate && (
                          <Text className="text-xs text-gray-400 mt-1">
                            Uploaded {formatDate(uploadedDate)}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Table Info */}
                    <View className="bg-gray-50 rounded-xl p-3">
                      {fileSize > 0 && (
                        <View className="flex-row justify-between py-2 border-b border-gray-200/50">
                          <Text className="text-sm text-gray-500">
                            File size
                          </Text>
                          <Text className="text-sm font-medium text-[#1A293B]">
                            {formatFileSize(fileSize)}
                          </Text>
                        </View>
                      )}
                      {shipmentTrackingNumber && (
                        <View className="flex-row justify-between py-2 border-b border-gray-200/50">
                          <Text className="text-sm text-gray-500">
                            Related shipment
                          </Text>
                          <Text className="text-sm font-medium text-[#1A293B]">
                            {typeof shipmentTrackingNumber === "string"
                              ? shipmentTrackingNumber
                              : String(shipmentTrackingNumber)}
                          </Text>
                        </View>
                      )}
                      <View className="flex-row justify-between py-2">
                        <Text className="text-sm text-gray-500">
                          Uploaded by
                        </Text>
                        <Text className="text-sm font-medium text-[#1A293B]">
                          {uploadedBy}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row gap-2 mt-4">
                      <Pressable
                        onPress={() => {
                          // Convert to API Document format
                          const apiDocument: ApiDocument = {
                            _id: document._id,
                            name: document.name || document.filename,
                            type: (document.type ||
                              document.documentType) as any,
                            fileUrl: document.fileUrl || "",
                            fileSize: document.fileSize || 0,
                            shipmentId: shipmentId
                              ? typeof shipmentId === "string"
                                ? shipmentId
                                : shipmentId._id
                              : undefined,
                            description: document.description,
                            createdAt:
                              document.createdAt || document.uploadedDate,
                          };
                          setSelectedDocument(apiDocument);
                          setShowDetailsModal(true);
                        }}
                        android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                        className="flex-1">
                        <View className="bg-[#1A293B] rounded-xl py-2 items-center">
                          <Text className="text-sm font-semibold text-white">
                            View
                          </Text>
                        </View>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          console.log("Download document", document._id)
                        }
                        android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                        className="flex-1">
                        <View className="bg-gray-400 rounded-xl py-2 items-center">
                          <Text className="text-sm font-semibold text-white">
                            Download
                          </Text>
                        </View>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          console.log("Delete document", document._id)
                        }
                        android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                        className="flex-1">
                        <View className="bg-red-500 rounded-xl py-2 items-center">
                          <Text className="text-sm font-semibold text-white">
                            Delete
                          </Text>
                        </View>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
              {filteredDocuments.length === 0 && (
                <Text className="text-center text-gray-500 mt-4">
                  No documents found
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Upload Document Modal */}
      <UploadDocumentModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Document Details Modal */}
      <DocumentDetailsModal
        visible={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
      />
    </SafeAreaView>
  );
}
