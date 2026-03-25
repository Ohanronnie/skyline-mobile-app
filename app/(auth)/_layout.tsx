import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="customer-login" options={{ headerShown: false }} />
      <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
      <Stack.Screen name="partner-login" options={{ headerShown: false }} />
      <Stack.Screen
        name="partner-verify-otp"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
