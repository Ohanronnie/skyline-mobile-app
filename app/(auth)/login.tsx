import { Box } from "@/components/ui/box";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { login, setTokens } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organization: z.string().min(1, "Organization is required"),
});

export default function Login() {
  const { organization } = useLocalSearchParams<{ organization: string }>();
  const router = useRouter();
  const { checkAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [backendError, setBackendError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      await setTokens(data.accessToken, data.refreshToken, "admin");
      await checkAuth(); // Update auth context
      router.replace("/(tabs)");
    },
    onError: (error: any) => {
      console.error("Login failed:", error);
      const message =
        error?.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setBackendError(message);
    },
  });

  const handleLogin = () => {
    try {
      // Ensure organization is a string, default to empty string if undefined for validation
      const org = Array.isArray(organization)
        ? organization[0]
        : organization || "";

      loginSchema.parse({ email, password, organization: org });
      setErrors({});
      setBackendError("");

      loginMutation.mutate({
        email,
        password,
        organization: org,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: any = {};
        err.issues.forEach((error: z.ZodIssue) => {
          if (error.path[0]) {
            fieldErrors[error.path[0]] = error.message;
          }
        });
        setErrors(fieldErrors);
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
          resizeMode="cover"
        >
          <SafeAreaView className="flex-1">
            <KeyboardAwareScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 24,
              }}
              enableOnAndroid={true}
              extraScrollHeight={20}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Image
                source={require("@/assets/images/logo.png")}
                className="mb-8"
                style={{ width: 240, height: 93, aspectRatio: 300 / 116 }}
                resizeMode="contain"
              />
              <Box className="w-full max-w-md p-8 rounded-2xl bg-[#1A293B80] backdrop-blur-lg border border-white/30 shadow-xl">
                <Text className="text-3xl font-bold text-white mb-2 text-center">
                  Welcome Back
                </Text>
                <Text className="text-white/80 mb-8 text-center">
                  Sign in to{" "}
                  {organization
                    ? typeof organization === "string"
                      ? organization.charAt(0).toUpperCase() +
                        organization.slice(1)
                      : organization[0]
                    : "your account"}
                </Text>

                <View className="mb-4">
                  <Text className="text-white mb-2 font-medium">Email</Text>
                  <Input
                    variant="outline"
                    size="lg"
                    className={`bg-[#1A293B40] border-white/30 ${errors.email ? "border-red-500" : ""}`}
                  >
                    <InputField
                      placeholder="Enter your email"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="text-white"
                    />
                  </Input>
                  {errors.email && (
                    <Text className="text-red-400 text-sm mt-1">
                      {errors.email}
                    </Text>
                  )}
                </View>

                <View className="mb-6">
                  <Text className="text-white mb-2 font-medium">Password</Text>
                  <Input
                    variant="outline"
                    size="lg"
                    className={`bg-[#1A293B40] border-white/30 ${errors.password ? "border-red-500" : ""}`}
                  >
                    <InputField
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      className="text-white flex-1"
                    />
                    <InputSlot
                      className="pr-3"
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color="rgba(255, 255, 255, 0.6)"
                      />
                    </InputSlot>
                  </Input>
                  {errors.password && (
                    <Text className="text-red-400 text-sm mt-1">
                      {errors.password}
                    </Text>
                  )}
                  {backendError && (
                    <Text className="text-red-400 text-sm mt-1">
                      {backendError}
                    </Text>
                  )}
                </View>

                <Pressable
                  onPress={handleLogin}
                  disabled={loginMutation.isPending}
                >
                  <Box
                    className={`bg-white rounded-lg py-4 px-6 items-center ${loginMutation.isPending ? "opacity-70" : ""}`}
                  >
                    {loginMutation.isPending ? (
                      <ActivityIndicator color="#1A293B" />
                    ) : (
                      <Text className="text-[#1A293B] font-semibold text-lg">
                        Sign In
                      </Text>
                    )}
                  </Box>
                </Pressable>
              </Box>
            </KeyboardAwareScrollView>
          </SafeAreaView>
        </ImageBackground>
      </View>
    </>
  );
}
