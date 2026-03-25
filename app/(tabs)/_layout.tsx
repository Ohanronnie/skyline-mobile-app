import BarcodeScanner from "@/components/BarcodeScanner";
import { Box } from "@/components/ui/box";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast,
} from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateShipment } from "@/hooks/useShipments";
import { ShipmentStatus } from "@/lib/api";
import { Tabs, useRouter } from "expo-router";

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ShipmentStatus | null>(
    null
  );
  const [isScanning, setIsScanning] = useState(false);
  const createShipmentMutation = useCreateShipment();
  const toast = useToast();

  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (modalError) {
      const timer = setTimeout(() => setModalError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [modalError]);

  const bottomPadding =
    Platform.OS === "ios" ? 20 : Math.max(insets.bottom, 12);

  const actionOptions = [
    {
      action: "Received",
      location: "China warehouse",
      status: ShipmentStatus.RECEIVED_CHINA,
    },
    {
      action: "Loaded",
      location: "China warehouse",
      status: ShipmentStatus.LOADED_CHINA,
    },
    {
      action: "Received",
      location: "Accra warehouse",
      status: ShipmentStatus.RECEIVED_ACCRA,
    },
    {
      action: "Delivered",
      location: "Accra warehouse",
      status: ShipmentStatus.DELIVERED_ACCRA,
    },
    {
      action: "Dispatched",
      location: "Kumasi warehouse",
      status: ShipmentStatus.DISPATCHED_KUMASI,
    },
    {
      action: "Received",
      location: "Kumasi warehouse",
      status: ShipmentStatus.RECEIVED_KUMASI,
    },
    {
      action: "Delivered",
      location: "Kumasi warehouse",
      status: ShipmentStatus.DELIVERED_KUMASI,
    },
    {
      action: "Dispatched",
      location: "Nkoranza warehouse",
      status: ShipmentStatus.DISPATCHED_NKORANZA,
    },
    {
      action: "Received",
      location: "Nkoranza warehouse",
      status: ShipmentStatus.RECEIVED_NKORANZA,
    },
    {
      action: "Delivered",
      location: "Nkoranza warehouse",
      status: ShipmentStatus.DELIVERED_NKORANZA,
    },
  ];

  const handleCloseCameraModal = () => {
    setShowCameraModal(false);
    setSelectedStatus(null);
    setIsScanning(false);
    setModalError(null);
  };

  const handleScan = (data: string, type: string) => {
    setIsScanning(false);
    console.log(
      `Bar code with type ${type} and data ${data} has been scanned!`
    );

    if (!selectedStatus) {
      setModalError("No status selected");
      return;
    }

    // Create shipment
    createShipmentMutation.mutate(
      {
        trackingNumber: data,
        description: `Scanned Shipment ${new Date().toLocaleDateString()}`,
        status: selectedStatus,
      },
      {
        onSuccess: () => {
          toast.show({
            placement: "bottom",
            render: ({ id }) => {
              return (
                <Toast
                  nativeID={"toast-" + id}
                  action="success"
                  variant="outline">
                  <View>
                    <ToastTitle>Success</ToastTitle>
                    <ToastDescription>
                      Shipment created successfully!
                    </ToastDescription>
                  </View>
                </Toast>
              );
            },
          });
          handleCloseCameraModal();
        },
        onError: (error: any) => {
          const errorMessage =
            error.response?.data?.message || error.message || "Unknown error";
          setModalError(errorMessage);
        },
      }
    );
  };

  const leftTabs = state.routes.filter(
    (route) => route.name === "index" || route.name === "shipments"
  );
  const rightTabs = state.routes.filter(
    (route) => route.name === "shipment-tracking" || route.name === "profile"
  );

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabBar}>
        {/* Left side tabs */}
        <View style={styles.tabsGroup}>
          {leftTabs.map((route) => {
            const { options } = descriptors[route.key];
            const isFocused =
              state.index ===
              state.routes.findIndex((r) => r.key === route.key);

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const iconName =
              route.name === "index"
                ? "home"
                : route.name === "shipments"
                ? "cube"
                : route.name === "warehouses"
                ? "business"
                : "help";

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={styles.tabButton}
                android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
                <View style={styles.tabContent}>
                  <Ionicons
                    name={iconName as any}
                    size={24}
                    color={isFocused ? "#1A293B" : "#999"}
                  />
                  {options.tabBarLabel &&
                    typeof options.tabBarLabel === "string" && (
                      <Text
                        style={[
                          styles.labelText,
                          { color: isFocused ? "#1A293B" : "#999" },
                        ]}>
                        {options.tabBarLabel}
                      </Text>
                    )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Camera button spacer */}
        <View style={styles.cameraSpacer} />

        {/* Right side tabs */}
        <View style={styles.tabsGroup}>
          {rightTabs.map((route) => {
            const { options } = descriptors[route.key];
            const isFocused =
              state.index ===
              state.routes.findIndex((r) => r.key === route.key);

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const iconName =
              route.name === "shipment-tracking" ? "location" : "person";

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={styles.tabButton}
                android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
                <View style={styles.tabContent}>
                  <Ionicons
                    name={iconName as any}
                    size={24}
                    color={isFocused ? "#1A293B" : "#999"}
                  />
                  {options.tabBarLabel &&
                    typeof options.tabBarLabel === "string" && (
                      <Text
                        style={[
                          styles.labelText,
                          { color: isFocused ? "#1A293B" : "#999" },
                        ]}>
                        {options.tabBarLabel}
                      </Text>
                    )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Camera button */}
        <View style={styles.cameraButtonContainer}>
          <Pressable
            onPress={() => setShowCameraModal(true)}
            style={styles.cameraButton}
            android_ripple={{ color: "rgba(0,0,0,0.1)" }}>
            <Box className="bg-[#1A293B] rounded-full w-16 h-16 items-center justify-center shadow-lg">
              <Ionicons name="camera" size={28} color="white" />
            </Box>
          </Pressable>
        </View>
      </View>

      {/* Camera Scanner Modal */}
      <Modal
        visible={showCameraModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseCameraModal}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen">
        {isScanning ? (
          <BarcodeScanner
            onScan={handleScan}
            onClose={() => setIsScanning(false)}
          />
        ) : (
          <View className="flex-1 bg-black/50 justify-end">
            <Pressable className="flex-1" onPress={handleCloseCameraModal} />
            <View
              className="bg-[#1A293B] rounded-t-3xl p-6"
              style={{ maxHeight: "90%" }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-2xl font-bold text-white">
                    Mobile scanner
                  </Text>
                  <Pressable
                    onPress={handleCloseCameraModal}
                    android_ripple={{ color: "rgba(255,255,255,0.1)" }}>
                    <Ionicons name="close" size={24} color="white" />
                  </Pressable>
                </View>

                {/* Start Button */}
                <Pressable
                  onPress={() => setIsScanning(true)}
                  disabled={!selectedStatus}
                  android_ripple={
                    selectedStatus
                      ? { color: "rgba(255,255,255,0.2)" }
                      : undefined
                  }
                  className="mb-4">
                  <View
                    className={`rounded-full px-4 py-3 flex-row items-center justify-center ${
                      selectedStatus ? "bg-primary-blue" : "bg-primary-blue/50"
                    }`}>
                    <Ionicons name="camera" size={20} color="white" />
                    <Text className="text-white font-semibold text-base ml-2">
                      Start
                    </Text>
                  </View>
                </Pressable>

                {/* Description */}
                <Text className="text-white/80 text-sm mb-6">
                  Scan percel barcodes or container ids to quicky or update
                  status
                </Text>

                {/* Select Actions */}
                <Text className="text-white font-semibold text-base mb-4">
                  Select actions
                </Text>

                {/* Action Buttons Grid */}
                <View className="flex-row flex-wrap gap-3 mb-6">
                  {actionOptions.map((option, index) => {
                    const label = `${option.action} (${option.location})`;
                    const isSelected = selectedStatus === option.status;
                    return (
                      <Pressable
                        key={`${option.action}-${option.location}-${index}`}
                        onPress={() => setSelectedStatus(option.status)}
                        android_ripple={{ color: "rgba(255,255,255,0.1)" }}
                        style={{ width: "47%" }}>
                        <View
                          className={`rounded-xl px-4 py-3 border ${
                            isSelected
                              ? "bg-[#FFFFFF33] border-white/50"
                              : "bg-transparent border-white/20"
                          }`}>
                          <Text
                            className={`text-sm ${
                              isSelected
                                ? "text-white font-semibold"
                                : "text-white/70"
                            }`}>
                            {label}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Cancel Button */}
                <Pressable
                  onPress={handleCloseCameraModal}
                  android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                  className="mt-4 mb-4">
                  <View className="bg-white rounded-full px-6 py-4 items-center">
                    <Text className="text-[#1A293B] font-semibold text-base">
                      Cancel
                    </Text>
                  </View>
                </Pressable>
              </ScrollView>

              {/* Error Toast inside Modal */}
              {modalError && (
                <View className="absolute bottom-4 left-4 right-4">
                  <Toast action="error" variant="solid">
                    <View>
                      <ToastTitle className="text-white">Error</ToastTitle>
                      <ToastDescription className="text-white">
                        {modalError}
                      </ToastDescription>
                    </View>
                  </Toast>
                </View>
              )}
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthenticated, isLoading, refetchUser, logout, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated and not loading
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)");
      return;
    }

    // Redirect if user is not admin (partners and customers should not access tabs)
    if (!isLoading && isAuthenticated && user) {
      // Check userType first (more reliable)
      if (user.userType === "partner") {
        router.replace("/(partners)");
        return;
      }
      if (user.userType === "customer") {
        router.replace("/(customer)/(tabs)/shipments");
        return;
      }
      // Check role as fallback (for admin/staff)
      if (
        user.userType !== "admin" &&
        user.role !== "admin" &&
        user.role !== "staff"
      ) {
        // Unknown user type, redirect to auth
        router.replace("/(auth)");
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Refetch user data when tabs are focused
  useEffect(() => {
    if (isAuthenticated) {
      refetchUser();
    }
  }, [isAuthenticated]);

  // Don't render anything if not authenticated or loading
  if (isLoading || !isAuthenticated) {
    return null;
  }

  // Don't render if user is not admin/staff
  if (
    user &&
    user.userType !== "admin" &&
    user.role !== "admin" &&
    user.role !== "staff"
  ) {
    return null;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="shipments"
        options={{
          title: "Shipments",
          tabBarLabel: "Shipments",
        }}
      />
      <Tabs.Screen
        name="camera-action"
        options={{
          title: "",
          tabBarLabel: "",
        }}
      />
      <Tabs.Screen
        name="warehouses"
        options={{
          title: "Warehouses",
          tabBarLabel: "Warehouses",
          href: null,
        }}
      />
      <Tabs.Screen
        name="shipment-tracking"
        options={{
          title: "Tracking",
          tabBarLabel: "Tracking",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBar: {
    flexDirection: "row",
    height: Platform.OS === "ios" ? 56 : 56,
    paddingTop: 6,
    paddingBottom: 0,
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    paddingHorizontal: 0,
  },
  tabsGroup: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  cameraSpacer: {
    width: 64,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    paddingVertical: 4,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  cameraButtonContainer: {
    position: "absolute",
    left: "50%",
    marginLeft: -32,
    top: Platform.OS === "ios" ? -28 : -28,
    width: 64,
    height: 64,
    zIndex: 10,
  },
  cameraButton: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
});
