import { Box } from '@/components/ui/box';
import { Text, TouchableOpacity, View } from 'react-native';

interface ShipmentCardProps {
  shipmentNumber: string;
  date: string;
  containerNumber: string;
  customerName?: string;
  status: 'Assigned' | 'Pending assignment';
  onViewDetails: () => void;
  onAction: () => void;
}

export const ShipmentCard = ({
  shipmentNumber,
  date,
  containerNumber,
  customerName,
  status,
  onViewDetails,
  onAction,
}: ShipmentCardProps) => {
  const isAssigned = status === 'Assigned';

  return (
    <Box className="bg-white p-4 rounded-xl mb-4">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="font-bold text-gray-900 text-lg">{shipmentNumber}</Text>
        <Text className="text-gray-500 text-xs">{date}</Text>
      </View>

      <Text className="text-gray-500 text-sm mb-4">
        Container: <Text className="text-gray-900">{containerNumber}</Text>
      </Text>

      <View className="mb-4">
        <Text className="text-gray-500 text-xs mb-1">Customer</Text>
        <View className="flex-row justify-between items-center">
          <Text className="text-gray-900 font-medium text-base">
            {customerName || 'Not Assigned'}
          </Text>
          <View
            className={`px-3 py-1 rounded-full ${
              isAssigned ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
            <Text
              className={`text-xs font-medium ${
                isAssigned ? 'text-green-800' : 'text-yellow-800'
              }`}>
              {status}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onViewDetails}
          className="flex-1 bg-[#1A293B] py-3 rounded-lg items-center">
          <Text className="text-white font-medium">View details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onAction}
          className={`flex-1 py-3 rounded-lg items-center border ${
            isAssigned
              ? 'border-gray-300 bg-transparent'
              : 'bg-primary-blue border-primary-blue'
          }`}>
          <Text
            className={`font-medium ${
              isAssigned ? 'text-gray-700' : 'text-white'
            }`}>
            {isAssigned ? 'Notify' : 'Assign customer'}
          </Text>
        </TouchableOpacity>
      </View>
    </Box>
  );
};
