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
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthIndex() {
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.userType === "customer") {
        router.replace("/(customer)/(tabs)/shipments");
      } else if (user.userType === "partner") {
        router.replace("/(partners)");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, isLoading, user]);

  if (isLoading || (isAuthenticated && user)) {
    return <View style={{ flex: 1, backgroundColor: "#1A293B" }} />;
  }

  const handleContinue = () => {
    if (selectedOrg && selectedRole) {
      if (selectedRole === "admin" || selectedRole === "staff") {
        router.push({
          pathname: "/(auth)/login",
          params: { organization: selectedOrg },
        });
      } else if (selectedRole === "customer") {
        router.push("/(auth)/customer-login");
      } else if (selectedRole === "partner") {
        router.push({
          pathname: "/(auth)/partner-login",
          params: { organization: selectedOrg },
        });
      }
    }
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={StyleSheet.absoluteFill}>
        <ImageBackground
          source={require("@/assets/images/background-image.jpg")}
          style={StyleSheet.absoluteFill}
          resizeMode="cover">
          <SafeAreaView className="flex-1">
            <View className="flex-1 justify-center items-center px-6">
              <Image
                source={require("@/assets/images/splash.png")}
                className="mb-8"
                style={{ width: 240, height: 93, aspectRatio: 300 / 116 }}
                resizeMode="contain"
              />
              <Box className="w-full max-w-md p-8 rounded-2xl bg-[#1A293B80] backdrop-blur-lg border border-white/30 shadow-xl">
                <View className="mb-4">
                  <Text className="text-white mb-2 font-medium">
                    Organization
                  </Text>
                  <Select
                    selectedValue={selectedOrg}
                    onValueChange={(value) => setSelectedOrg(value)}>
                    <SelectTrigger
                      variant="outline"
                      size="lg"
                      className="bg-[#1A293B40] border-white/30">
                      <SelectInput
                        placeholder="Select organization"
                        placeholderTextColor="rgba(255, 255, 255, 0.6)"
                        className="text-white"
                      />
                      <SelectIcon className="mr-3">
                        <Ionicons name="chevron-down" size={20} color="white" />
                      </SelectIcon>
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper>
                          <SelectDragIndicator />
                        </SelectDragIndicatorWrapper>
                        <SelectScrollView>
                          <SelectItem label="Skyrak" value="skyrak" />
                          <SelectItem label="Skyline" value="skyline" />
                        </SelectScrollView>
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                </View>

                <View className="mb-6">
                  <Text className="text-white mb-2 font-medium">Role</Text>
                  <Select
                    selectedValue={selectedRole}
                    onValueChange={(value) => setSelectedRole(value)}>
                    <SelectTrigger
                      variant="outline"
                      size="lg"
                      className="bg-[#1A293B40] border-white/30">
                      <SelectInput
                        placeholder="Select role"
                        placeholderTextColor="rgba(255, 255, 255, 0.6)"
                        className="text-white"
                      />
                      <SelectIcon className="mr-3">
                        <Ionicons name="chevron-down" size={20} color="white" />
                      </SelectIcon>
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper>
                          <SelectDragIndicator />
                        </SelectDragIndicatorWrapper>
                        <SelectScrollView>
                          <SelectItem label="Customer" value="customer" />
                          <SelectItem label="Partner" value="partner" />
                          <SelectItem label="Admin" value="admin" />
                          <SelectItem label="Staff" value="staff" />
                        </SelectScrollView>
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                </View>

                <Pressable
                  onPress={handleContinue}
                  disabled={!selectedOrg || !selectedRole}>
                  <Box
                    className={`rounded-lg py-4 px-6 items-center ${
                      selectedOrg && selectedRole ? "bg-white" : "bg-white/50"
                    }`}>
                    <Text
                      className={`font-semibold text-lg ${
                        selectedOrg && selectedRole
                          ? "text-[#1A293B]"
                          : "text-[#1A293B]/50"
                      }`}>
                      Continue
                    </Text>
                  </Box>
                </Pressable>
              </Box>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>
    </>
  );
}
