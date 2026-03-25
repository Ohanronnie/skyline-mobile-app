import { Box } from '@/components/ui/box';
import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

interface CustomerCardProps {
  id: string;
  name: string;
  shipmentCount: number;
  phone: string;
  email: string;
  location: string;
  isSelected: boolean;
  onSelect: () => void;
}

export const CustomerCard = ({
  name,
  shipmentCount,
  phone,
  email,
  location,
  isSelected,
  onSelect,
}: CustomerCardProps) => {
  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.7}>
      <Box
        className={`bg-white p-4 rounded-xl mb-4 border ${
          isSelected ? 'border-primary-blue' : 'border-gray-100'
        }`}>
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-primary-blue items-center justify-center mr-3">
              <Ionicons name="person" size={24} color="white" />
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-900">{name}</Text>
              <Text className="text-gray-500 text-sm">
                {shipmentCount} shipments
              </Text>
            </View>
          </View>
          <Ionicons
            name={isSelected ? 'radio-button-on' : 'radio-button-off'}
            size={24}
            color={isSelected ? '#0a7ea4' : '#9CA3AF'}
          />
        </View>

        <View className="space-y-2">
          <View className="flex-row items-center">
            <Ionicons name="call-outline" size={18} color="#6B7280" />
            <Text className="ml-2 text-gray-600">{phone}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="mail-outline" size={18} color="#6B7280" />
            <Text className="ml-2 text-gray-600">{email}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={18} color="#6B7280" />
            <Text className="ml-2 text-gray-600">{location}</Text>
          </View>
        </View>
      </Box>
    </TouchableOpacity>
  );
};
