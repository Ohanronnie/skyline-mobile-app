import { Box } from '@/components/ui/box';
import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

interface PartnerCustomerCardProps {
  name: string;
  shipmentCount: number;
  phone: string;
  email: string;
  onViewDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const PartnerCustomerCard = ({
  name,
  shipmentCount,
  phone,
  email,
  onViewDetails,
  onEdit,
  onDelete,
}: PartnerCustomerCardProps) => {
  // Get initials
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Box className="bg-white p-4 rounded-xl mb-4">
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center flex-1">
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: '#1A293B80' }}>
            <Text className="text-black font-bold text-lg">{initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">{name}</Text>
            <Text className="text-gray-500 text-sm">
              {shipmentCount} shipments
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onViewDetails}>
          <Text className="text-primary-blue font-medium">View details</Text>
        </TouchableOpacity>
      </View>

      <View className="space-y-2 mb-4">
        <View className="flex-row items-center">
          <Ionicons name="call-outline" size={18} color="#6B7280" />
          <Text className="ml-2 text-gray-600">{phone}</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="mail-outline" size={18} color="#6B7280" />
          <Text className="ml-2 text-gray-600">{email}</Text>
        </View>
      </View>

      <View className="h-[1px] bg-gray-100 w-full mb-3" />

      <View className="flex-row justify-end gap-4">
        <TouchableOpacity onPress={onEdit}>
          <Ionicons name="create-outline" size={22} color="#4B5563" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete}>
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </Box>
  );
};
