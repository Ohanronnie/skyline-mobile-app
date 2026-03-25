import { Box } from "@/components/ui/box";
import { sendCustomerOtp } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Validate Ghana phone number using libphonenumber
const validateGhanaPhoneNumber = (
  phoneNumber: string
): { isValid: boolean; error?: string; formatted?: string } => {
  try {
    // Remove spaces for validation
    const cleaned = phoneNumber.replace(/\s/g, "");

    // Add +233 prefix if not present
    const fullNumber = cleaned.startsWith("+233")
      ? cleaned
      : cleaned.startsWith("233")
      ? `+${cleaned}`
      : cleaned.startsWith("0")
      ? `+233${cleaned.slice(1)}`
      : `+233${cleaned}`;

    // Validate using libphonenumber
    if (!isValidPhoneNumber(fullNumber, "GH")) {
      return { isValid: false, error: "Invalid Ghana phone number" };
    }

    // Parse and format the number
    const parsed = parsePhoneNumber(fullNumber, "GH");
    return {
      isValid: true,
      formatted: parsed.formatInternational(),
    };
  } catch (error) {
    return { isValid: false, error: "Invalid phone number format" };
  }
};

// Format phone number as user types (adds spaces for readability)
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "");

  // Limit to 9 digits
  const limited = digits.slice(0, 9);

  // Format: XXX XXX XXXX
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)} ${limited.slice(3)}`;
  } else {
    return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
  }
};

export default function CustomerLogin() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneChange = (text: string) => {
    // Format the phone number as user types
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleGetVerificationCode = async () => {
    try {
      // Clear previous errors
      setError("");

      // Remove spaces for validation
      const cleanedPhone = phoneNumber.replace(/\s/g, "");

      // Validate phone number using libphonenumber
      const validation = validateGhanaPhoneNumber(cleanedPhone);
      if (!validation.isValid) {
        setError(validation.error || "Invalid phone number");
        return;
      }

      // Use the formatted number from libphonenumber
      // It will be in format +233 XX XXX XXXX, we need +233XXXXXXXXX
      const fullNumber = cleanedPhone.startsWith("+233")
        ? cleanedPhone.replace(/\s/g, "")
        : cleanedPhone.startsWith("233")
        ? `+${cleanedPhone.replace(/\s/g, "")}`
        : cleanedPhone.startsWith("0")
        ? `+233${cleanedPhone.slice(1).replace(/\s/g, "")}`
        : `+233${cleanedPhone.replace(/\s/g, "")}`;

      // Parse to get the correct format
      const parsed = parsePhoneNumber(fullNumber, "GH");
      const fullPhoneNumber = parsed.number; // Returns in E.164 format: +233XXXXXXXXX

      setIsLoading(true);
      await sendCustomerOtp(fullPhoneNumber);
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { phoneNumber: fullPhoneNumber },
      });
    } catch (error: any) {
      console.log(error);
      setError(
        error.response?.data?.message || "Failed to send verification code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      <StatusBar style="light" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={StyleSheet.absoluteFill}>
          <ImageBackground
            source={require("@/assets/images/customer-login-fill.jpg")}
            style={StyleSheet.absoluteFill}
            resizeMode="cover">
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(0, 0, 0, 0.7)" },
              ]}
            />
            <SafeAreaView className="flex-1">
              <View className="flex-1 justify-center items-center px-6">
                <Image
                  source={require("@/assets/images/logo.png")}
                  className="mb-8"
                  style={{ width: 240, height: 93, aspectRatio: 300 / 116 }}
                  resizeMode="contain"
                />
                <View className=" mb-6">
                  <Text className="text-3xl font-bold text-white mb-2 text-left">
                    Track your shipments
                  </Text>
                  <Text className="text-white/80 text-left text-base">
                    Get real time updates on your packages from china to ghana
                  </Text>
                </View>
                <Box className="w-full max-w-md p-8 rounded-2xl bg-white backdrop-blur-lg border border-white/30 shadow-xl">
                  <View className="mb-6">
                    <Text className="text-black mb-2 font-medium">
                      Phone number
                    </Text>
                    <View
                      className={`flex-row items-center bg-white rounded-xl border ${
                        error ? "border-red-500" : "border-black/30"
                      }`}>
                      <View className="flex-row items-center px-3 py-3 border-r border-black/20">
                        <Ionicons
                          name="call-outline"
                          size={20}
                          color={error ? "#ef4444" : "black"}
                        />
                        <Text className="text-black font-semibold ml-2 text-base">
                          +233
                        </Text>
                      </View>
                      <TextInput
                        placeholder="241 234 567"
                        placeholderTextColor="rgba(0, 0, 0, 0.4)"
                        value={phoneNumber}
                        onChangeText={handlePhoneChange}
                        keyboardType="phone-pad"
                        maxLength={13} // 3 + space + 3 + space + 3 = 13 characters max
                        className="flex-1 px-3 py-3 text-black text-base"
                        style={{ fontFamily: "System" }}
                      />
                    </View>
                    {error && (
                      <Text className="text-red-500 text-sm mt-1 ml-1">
                        {error}
                      </Text>
                    )}
                  </View>

                  <Pressable
                    onPress={handleGetVerificationCode}
                    disabled={isLoading}>
                    <Box
                      className={`rounded-xl py-4 px-6 items-center ${
                        isLoading ? "bg-primary/70" : "bg-primary"
                      }`}>
                      {isLoading ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white font-semibold text-lg">
                          Get verification code
                        </Text>
                      )}
                    </Box>
                  </Pressable>
                </Box>
              </View>
            </SafeAreaView>
          </ImageBackground>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
