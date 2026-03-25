import { Box } from "@/components/ui/box";
import { useAuth } from "@/contexts/AuthContext";
import { customerLogin, Organization, sendCustomerOtp, setTokens } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

export default function VerifyOTP() {
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const queryClient = useQueryClient();
  const { checkAuth } = useAuth();

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split("");
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      // Focus the last filled input or the next empty one
      const nextIndex = Math.min(index + pastedOtp.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (isLoading) return; // Prevent double invocation
    const code = otp.join("");
    console.log("Starting verification for code:", code);
    
    try {
      otpSchema.parse({ otp: code });

      setIsLoading(true);
      console.log("Sending login request...");
      // Assuming default organization is SKYLINE for now, or we could ask user/infer it
      const response = await customerLogin(phoneNumber, code, Organization.SKYLINE);
      console.log("Login successful, response:", response);
      
      console.log("Setting tokens...");
      await setTokens(response.accessToken, response.refreshToken, "customer");
      
      console.log("Checking auth state...");
      await checkAuth();
      
      // Small delay to ensure context propagates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log("Navigating to shipments...");
      router.replace("/(customer)/(tabs)/shipments");
    } catch (error: any) {
      console.log("Verification error:", JSON.stringify(error));
      if (error instanceof z.ZodError) {
        Alert.alert("Validation Error", error.issues[0].message);
      } else {
        Alert.alert(
          "Error",
          error.response?.data?.message || "Verification failed"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await sendCustomerOtp(phoneNumber);
      Alert.alert("Success", "Verification code resent");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to resend code"
      );
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

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
                <Box className="w-full max-w-md p-8 rounded-2xl bg-white backdrop-blur-lg border border-white/30 shadow-xl">
                  <View className="items-center mb-6">
                    <Text className="text-2xl font-bold text-black mb-2 text-center">
                      Enter verification code
                    </Text>
                    <Text className="text-black/70 text-center text-base">
                      We sent a verification code to{" "}
                      <Text className="font-semibold">
                        {phoneNumber || "+23333223333"}
                      </Text>
                    </Text>
                  </View>

                  <View className="flex-row justify-between mb-6">
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref: TextInput | null) => {
                          inputRefs.current[index] = ref;
                        }}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                        onKeyPress={({ nativeEvent }) =>
                          handleKeyPress(nativeEvent.key, index)
                        }
                        keyboardType="number-pad"
                        maxLength={1}
                        className="w-12 h-12 border-2 border-black/30 rounded-xl text-center text-xl font-semibold text-black bg-white"
                        style={{
                          borderColor: digit ? "#1A293B" : "rgba(0, 0, 0, 0.3)",
                        }}
                        selectTextOnFocus
                      />
                    ))}
                  </View>

                  <Pressable onPress={handleResendCode} className="mb-6">
                    <Text className="text-center text-black/70 text-base">
                      Didn't receive the code?{" "}
                      <Text className="text-primary-500 font-semibold">
                        Resend code
                      </Text>
                    </Text>
                  </Pressable>

                  <Pressable onPress={handleVerify} disabled={!isOtpComplete || isLoading}>
                    <Box
                      className={`rounded-xl py-4 px-6 items-center ${
                        isOtpComplete && !isLoading ? "bg-primary" : "bg-primary/50"
                      }`}>
                      {isLoading ? (
                        <Text className="text-white font-semibold text-lg">Verifying...</Text>
                      ) : (
                        <Text className="text-white font-semibold text-lg">
                          Verify
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
