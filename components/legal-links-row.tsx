import { LEGAL_PRIVACY_URL, LEGAL_TERMS_URL } from "@/lib/legal";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { Text, TouchableOpacity, View } from "react-native";

export function LegalLinksRow() {
  return (
    <View className="space-y-3 mb-4">
      <TouchableOpacity
        onPress={() => WebBrowser.openBrowserAsync(LEGAL_PRIVACY_URL)}
        className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Ionicons name="document-text-outline" size={22} color="#1A293B" />
          <Text className="text-base font-semibold text-[#1A293B] ml-3">
            Privacy policy
          </Text>
        </View>
        <Ionicons name="open-outline" size={20} color="#9CA3AF" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => WebBrowser.openBrowserAsync(LEGAL_TERMS_URL)}
        className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Ionicons name="reader-outline" size={22} color="#1A293B" />
          <Text className="text-base font-semibold text-[#1A293B] ml-3">
            Terms of service
          </Text>
        </View>
        <Ionicons name="open-outline" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}
