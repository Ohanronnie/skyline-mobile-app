import { CustomSelect } from "@/components/custom-select";
import { Box } from "@/components/ui/box";
import { useAuth } from "@/contexts/AuthContext";
import { useInfiniteCustomers, useSMSTemplates } from "@/hooks/useShipments";
import {
  BroadcastPayload,
  BroadcastTarget,
  Customer,
  NotificationType,
  Partner,
  SMSTemplate,
  getCustomers,
  getPaginatedItems,
  getPaginatedTotal,
  getPartners,
  sendBroadcast,
} from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const recipientOptions: {
  id: BroadcastTarget;
  label: string;
}[] = [
  {
    id: "all",
    label: "All users",
  },
  {
    id: "partners",
    label: "Partners",
  },
  {
    id: "customers",
    label: "Customers",
  },
  {
    id: "partner",
    label: "Specific partner",
  },
  {
    id: "customer",
    label: "Specific customer",
  },
];

export default function BroadcastScreen() {
  const { user } = useAuth();
  const [selectedRecipient, setSelectedRecipient] =
    useState<BroadcastTarget>("all");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [partnerCount, setPartnerCount] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState("");
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("info");
  const [sendSms, setSendSms] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Fetch SMS templates from API
  const { data: smsTemplates = [], isLoading: isLoadingTemplates } = useSMSTemplates();
  const {
    data: customerSearchData,
    fetchNextPage: fetchNextCustomers,
    hasNextPage: hasMoreCustomers,
    isFetching: isFetchingCustomerSearch,
    isFetchingNextPage: isFetchingMoreCustomers,
  } = useInfiniteCustomers(debouncedCustomerSearch);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomerSearch(customerSearch.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Hardcoded welcome templates based on organization
  const skylineWelcomeTemplate = `Welcome to Skyline Shipping Solutions 

Dear Valued Client,

We're delighted to have you with us. Your shipping mark is (Client code, client or company name & City)

When sending goods to our warehouse, please ensure your supplier clearly writes or prints your shipping mark on each package to help us identify and process your shipment efficiently.

Warehouse Address (Please forward this to your supplier):

Shipping Mark: (Client code, client or company name & City)
Address: 广州市白云区三元南路390号DC 创意园1楼Royok 仓库
Warehouse Contact: Sam – +86 132 0708 7378

📦 Sample Address Format:
(Client code, client or company name & City)
广州市白云区三元南路390号DC 创意园1楼Royok 仓库
联系电话：Sam +86 132 0708 7378


If you need any assistance, please contact our Customer Service Representative at +233 544 120 798.

Thank you for choosing Skyline — we look forward to serving you!

— Skyline Shipping Solutions -`;

  const skyrakWelcomeTemplate = `Welcome to SkyRak Procurement and Logistics.

Dear Valued Client,

We’re delighted to have you with us. Your shipping mark is (Client code, client or company name & City)

When sending goods to our warehouse, please ensure your supplier clearly writes or prints your shipping mark on each package to help us identify and process your shipment efficiently.

Warehouse Address (Please forward this to your supplier):

Shipping Mark: (Client code, client or company name & City)
Address: 广州市白云区三元南路390号DC 创意园1楼Royok 仓库
Warehouse Contact: Sam – +86 132 0708 7378

📦 Sample Address Format:
(Client code, client or company name & City)
广州市白云区三元南路390号DC 创意园1楼Royok 仓库
联系电话：Sam +86 132 0708 7378
Vina: +86 197 0025 5576


If you need any assistance, please contact our Customer Service Representative at +233 544 120 798.

Thank you for choosing SkyRak — we look forward to serving you!

— SkyRak Procurement and Logistics-`;

  // Get the appropriate welcome template based on user's organization
  const welcomeTemplate = user?.organization?.toLowerCase() === "skyrak" 
    ? skyrakWelcomeTemplate 
    : skylineWelcomeTemplate;

  const welcomeTemplateTitle = user?.organization?.toLowerCase() === "skyrak"
    ? "Skyrak Welcome Message"
    : "Skyline Welcome Message";

  const handleUseTemplate = (template: SMSTemplate | string) => {
    const content = typeof template === "string" ? template : template.content;
    setMessage(content);
    setShowTemplates(false);
  };

  useEffect(() => {
    // Preload counts for customers and partners
    const loadCounts = async () => {
      try {
        setIsLoadingCustomers(true);
        setIsLoadingPartners(true);
        const [customersData, partnersData] = await Promise.all([
          getCustomers(),
          getPartners(),
        ]);
        const nextCustomers = getPaginatedItems(customersData);
        const nextPartners = getPaginatedItems(partnersData);

        setCustomers(nextCustomers);
        setPartners(nextPartners);
        setCustomerCount(getPaginatedTotal(customersData));
        setPartnerCount(getPaginatedTotal(partnersData));
      } catch (error) {
        console.log("[broadcast] failed to load counts", error);
      } finally {
        setIsLoadingCustomers(false);
        setIsLoadingPartners(false);
      }
    };

    loadCounts();
  }, []);

  const customerSearchResults = useMemo(() => {
    return (
      customerSearchData?.pages.flatMap((page) => page.data ?? []) ?? []
    );
  }, [customerSearchData]);

  const customerPickerResults = useMemo(() => {
    const result = new Map<string, Customer>();

    if (selectedCustomer?._id) {
      result.set(selectedCustomer._id, selectedCustomer);
    }

    customerSearchResults.forEach((customer) => {
      if (customer?._id) {
        result.set(customer._id, customer);
      }
    });

    return Array.from(result.values());
  }, [customerSearchResults, selectedCustomer]);

  const handleSelectRecipient = (target: BroadcastTarget) => {
    setSelectedRecipient(target);
  };

  const getRecipientDescription = (id: BroadcastTarget) => {
    switch (id) {
      case "all":
        if (customerCount == null || partnerCount == null) {
          return "Loading recipient counts...";
        }
        return `${customerCount} customers · ${partnerCount} partners`;
      case "customers":
        if (customerCount == null) return "Loading customers...";
        return `${customerCount} customers`;
      case "partners":
        if (partnerCount == null) return "Loading partners...";
        return `${partnerCount} partners`;
      case "customer":
        if (selectedCustomer)
          return `1 customer selected (${selectedCustomer.name})`;
        return "Choose the customer to send this to";
      case "partner":
        if (selectedPartner)
          return `1 partner selected (${selectedPartner.name})`;
        return "Choose the partner to send this to";
      default:
        return "";
    }
  };

  const handleSend = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a title for this broadcast.");
      return;
    }
    if (!message.trim()) {
      Alert.alert("Missing message", "Please enter a message to send.");
      return;
    }
    if (!sendSms && !sendNotification) {
      Alert.alert(
        "Nothing to send",
        "Please enable SMS or In-app notification."
      );
      return;
    }

    if (selectedRecipient === "customer" && !selectedCustomer) {
      Alert.alert(
        "Select customer",
        "Please choose the customer you want to send this broadcast to."
      );
      return;
    }

    if (selectedRecipient === "partner" && !selectedPartner) {
      Alert.alert(
        "Select partner",
        "Please choose the partner you want to send this broadcast to."
      );
      return;
    }

    const payload: BroadcastPayload = {
      target: selectedRecipient,
      recipientId:
        selectedRecipient === "customer"
          ? selectedCustomer?._id
          : selectedRecipient === "partner"
          ? selectedPartner?._id
          : undefined,
      title: title.trim(),
      message: message.trim(),
      type,
      sendSms,
      sendNotification,
    };

    try {
      setIsSending(true);
      const result = await sendBroadcast(payload);
      console.log("[broadcast] sent", { payload, result });
      Alert.alert(
        "Broadcast sent",
        `Your message was queued for ${result.count} recipients.`
      );
      setMessage("");
      setTitle("");
    } catch (error: any) {
      console.log("[broadcast] error", {
        error: error?.response?.data,
        status: error?.response?.status,
        message: error?.message,
      });
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send broadcast.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSending(false);
    }
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
        <Text className="text-lg font-semibold text-[#1A293B]">Broadcast</Text>
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
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4">
          <Text className="text-2xl font-bold text-[#1A293B] mb-1">
            Send broadcast
          </Text>
          <Text className="text-base text-gray-600 mb-6">
            Send messages to your users instantly
          </Text>

          {/* Title */}
          <View className="bg-white rounded-2xl p-4 mb-6 border border-gray-200">
            <Text className="text-base font-semibold text-[#1A293B] mb-3">
              Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. System Maintenance"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-200 rounded-2xl px-4 py-3 text-base text-[#1A293B]"
            />
          </View>

          {/* Recipients Box */}
          <View className="bg-white rounded-2xl p-4 mb-6 border border-gray-200">
            <Text className="text-base font-semibold text-[#1A293B] mb-4">
              Select recipients
            </Text>
            {recipientOptions.map((option) => {
              const isSelected = selectedRecipient === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => handleSelectRecipient(option.id)}
                  android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                  className={`border rounded-2xl p-4 mb-3 ${
                    isSelected
                      ? "border-primary-blue bg-primary-blue/5"
                      : "border-gray-200 bg-white"
                  }`}>
                  <Text
                    className={`text-base font-semibold mb-1 ${
                      isSelected ? "text-primary-blue" : "text-[#1A293B]"
                    }`}>
                    {option.label}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {getRecipientDescription(option.id)}
                  </Text>
                </Pressable>
              );
            })}

            {/* Specific customer select */}
            {selectedRecipient === "customer" && (
              <View className="mt-2">
                <Text className="text-sm font-medium text-[#1A293B] mb-2">
                  Choose customer
                </Text>
                <TextInput
                  value={customerSearch}
                  onChangeText={setCustomerSearch}
                  placeholder="Search customers by name, email or phone"
                  placeholderTextColor="#9CA3AF"
                  className="border border-gray-200 rounded-2xl px-4 py-3 text-base text-[#1A293B] mb-3"
                />
                {selectedCustomer && (
                  <View className="border border-primary-blue bg-primary-blue/5 rounded-2xl p-3 mb-3">
                    <Text className="text-xs font-medium text-primary-blue mb-1">
                      Selected customer
                    </Text>
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-[#1A293B]">
                          {selectedCustomer.name}
                        </Text>
                        {!!selectedCustomer.phone && (
                          <Text className="text-sm text-gray-500 mt-1">
                            {selectedCustomer.phone}
                          </Text>
                        )}
                        {!!selectedCustomer.email && (
                          <Text className="text-sm text-gray-500">
                            {selectedCustomer.email}
                          </Text>
                        )}
                      </View>
                      <Pressable
                        onPress={() => setSelectedCustomer(null)}
                        android_ripple={{ color: "rgba(0,0,0,0.05)" }}>
                        <View className="bg-white border border-gray-200 rounded-xl px-3 py-2">
                          <Text className="text-sm font-medium text-[#1A293B]">
                            Change
                          </Text>
                        </View>
                      </Pressable>
                    </View>
                  </View>
                )}
                <View
                  className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50"
                  style={{ maxHeight: 280 }}>
                  {isLoadingCustomers || isFetchingCustomerSearch ? (
                    <View className="py-6 items-center">
                      <ActivityIndicator size="small" color="#1A293B" />
                      <Text className="text-sm text-gray-500 mt-2">
                        Loading customers...
                      </Text>
                    </View>
                  ) : customerPickerResults.length === 0 ? (
                    <View className="py-6 items-center px-4">
                      <Text className="text-sm text-gray-500 text-center">
                        No customers found for this search.
                      </Text>
                    </View>
                  ) : (
                    <ScrollView
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}>
                      {customerPickerResults.map((customer, index) => {
                        const isSelected = selectedCustomer?._id === customer._id;

                        return (
                          <Pressable
                            key={customer._id}
                            onPress={() => setSelectedCustomer(customer)}
                            android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                            className={`px-4 py-3 ${
                              index < customerPickerResults.length - 1
                                ? "border-b border-gray-200"
                                : ""
                            } ${isSelected ? "bg-primary-blue/5" : "bg-white"}`}>
                            <View className="flex-row items-start justify-between gap-3">
                              <View className="flex-1">
                                <Text
                                  className={`text-base font-medium ${
                                    isSelected
                                      ? "text-primary-blue"
                                      : "text-[#1A293B]"
                                  }`}>
                                  {customer.name}
                                </Text>
                                {!!customer.phone && (
                                  <Text className="text-sm text-gray-500 mt-1">
                                    {customer.phone}
                                  </Text>
                                )}
                                {!!customer.email && (
                                  <Text className="text-sm text-gray-500">
                                    {customer.email}
                                  </Text>
                                )}
                              </View>
                              {isSelected && (
                                <Ionicons
                                  name="checkmark-circle"
                                  size={20}
                                  color="#1A293B"
                                />
                              )}
                            </View>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
                {hasMoreCustomers && (
                  <Pressable
                    onPress={() => fetchNextCustomers()}
                    disabled={isFetchingMoreCustomers}
                    android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                    className="mt-2">
                    <View className="bg-gray-100 rounded-xl py-2 items-center">
                      {isFetchingMoreCustomers ? (
                        <ActivityIndicator size="small" color="#1A293B" />
                      ) : (
                        <Text className="text-sm font-medium text-[#1A293B]">
                          Load more customers
                        </Text>
                      )}
                    </View>
                  </Pressable>
                )}
              </View>
            )}

            {/* Specific partner select */}
            {selectedRecipient === "partner" && (
              <View className="mt-2">
                <Text className="text-sm font-medium text-[#1A293B] mb-2">
                  Choose partner
                </Text>
                <CustomSelect
                  options={partners.map((partner) => ({
                    label: partner.name,
                    value: partner._id,
                  }))}
                  selectedValue={selectedPartner?._id}
                  onValueChange={(value) => {
                    const partner =
                      partners.find((p) => p._id === value) || null;
                    setSelectedPartner(partner);
                  }}
                  placeholder={
                    isLoadingPartners ? "Loading partners..." : "Select partner"
                  }
                  className="mb-1"
                  variant="filled"
                  direction="up"
                />
              </View>
            )}
          </View>

          {/* Message Box */}
          <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-[#1A293B]">
                Message
              </Text>
              <Pressable
                onPress={() => setShowTemplates(!showTemplates)}
                android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
                <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-1.5">
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color="#1A293B"
                  />
                  <Text className="text-sm font-medium text-[#1A293B] ml-1.5">
                    Templates
                  </Text>
                  <Ionicons
                    name={showTemplates ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#1A293B"
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </Pressable>
            </View>

            {/* Templates Dropdown */}
            {showTemplates && (
              <View className="mb-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                <Text className="text-sm font-medium text-[#1A293B] mb-2">
                  Select a template:
                </Text>
                <ScrollView 
                  style={{ maxHeight: 250 }}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {/* Hardcoded Welcome Template (org-based) */}
                  <Pressable
                    onPress={() => handleUseTemplate(welcomeTemplate)}
                    android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                    className="bg-white rounded-lg p-3 border border-primary-blue mb-2">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-sm font-semibold text-primary-blue">
                            {welcomeTemplateTitle}
                          </Text>
                          <View className="ml-2 bg-primary-blue/10 px-2 py-0.5 rounded">
                            <Text className="text-xs text-primary-blue">Default</Text>
                          </View>
                        </View>
                        <Text 
                          className="text-xs text-gray-500 mt-1"
                          numberOfLines={2}
                        >
                          Warehouse address and shipping instructions
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#0065EA"
                      />
                    </View>
                  </Pressable>

                  {/* Loading state for API templates */}
                  {isLoadingTemplates ? (
                    <View className="py-4 items-center">
                      <ActivityIndicator size="small" color="#1A293B" />
                      <Text className="text-xs text-gray-500 mt-2">
                        Loading more templates...
                      </Text>
                    </View>
                  ) : (
                    /* API Templates */
                    smsTemplates.map((template) => (
                      <Pressable
                        key={template._id}
                        onPress={() => handleUseTemplate(template)}
                        android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                        className="bg-white rounded-lg p-3 border border-gray-200 mb-2">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1">
                            <Text className="text-sm font-semibold text-[#1A293B]">
                              {template.title}
                            </Text>
                            <Text 
                              className="text-xs text-gray-500 mt-1"
                              numberOfLines={2}
                            >
                              {template.content}
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#9CA3AF"
                          />
                        </View>
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              </View>
            )}

            <TextInput
              multiline
              value={message}
              onChangeText={setMessage}
              placeholder="Type your broadcast message here..."
              placeholderTextColor="#9CA3AF"
              textAlignVertical="top"
              className="border border-gray-200 rounded-2xl px-4 py-3 min-h-[140px] text-base text-[#1A293B]"
            />
          </View>

          {/* Options */}
          <View className="bg-white rounded-2xl p-4 border border-gray-200 mb-6">
            <Text className="text-base font-semibold text-[#1A293B] mb-3">
              Delivery options
            </Text>
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-sm font-medium text-[#1A293B]">
                  Send SMS
                </Text>
                <Text className="text-xs text-gray-500">
                  Sends SMS to all matched recipients
                </Text>
              </View>
              <Pressable
                onPress={() => setSendSms((v) => !v)}
                android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
                <Box
                  className={`w-10 h-6 rounded-full ${
                    sendSms ? "bg-primary-blue" : "bg-gray-300"
                  } items-${sendSms ? "end" : "start"} justify-center px-1`}>
                  <View className="w-4 h-4 rounded-full bg-white" />
                </Box>
              </Pressable>
            </View>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-medium text-[#1A293B]">
                  In-app notification
                </Text>
                <Text className="text-xs text-gray-500">
                  Shows in the Skyline notifications center
                </Text>
              </View>
              <Pressable
                onPress={() => setSendNotification((v) => !v)}
                android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
                <Box
                  className={`w-10 h-6 rounded-full ${
                    sendNotification ? "bg-primary-blue" : "bg-gray-300"
                  } items-${
                    sendNotification ? "end" : "start"
                  } justify-center px-1`}>
                  <View className="w-4 h-4 rounded-full bg-white" />
                </Box>
              </Pressable>
            </View>
          </View>

          {/* Send Button */}
          <Pressable
            onPress={handleSend}
            android_ripple={{ color: "rgba(255,255,255,0.2)" }}>
            <View
              className={`rounded-full py-3 items-center ${
                isSending ? "bg-gray-400" : "bg-primary-blue"
              }`}>
              <Text className="text-white font-semibold text-base">
                {isSending ? "Sending..." : "Send broadcast"}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
