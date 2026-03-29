import { ShipmentStatus } from '@/lib/api';
import { getShipmentProgressPercentage, getShipmentStatusColor } from '@/lib/shipment';
import { Text, TouchableOpacity, View } from 'react-native';

interface ActivityItemProps {
  containerNumber: string;
  date: string;
  customerName: string;
  status: ShipmentStatus;
  isLast?: boolean;
}

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const RecentActivityItem = ({
  containerNumber,
  date,
  customerName,
  status,
  isLast,
}: ActivityItemProps) => {
  const progress = getShipmentProgressPercentage(status);
  const color = getShipmentStatusColor(status);
console.log(progress, status)
  return (
    <View>
      <View className="py-4">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="font-bold text-gray-900 text-base">
              {containerNumber}
            </Text>
            <Text className="text-gray-900 font-medium mt-1">{customerName}</Text>
          </View>
          <Text className="text-gray-500 text-xs">{date}</Text>
        </View>

        <View className="mt-3">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-xs font-semibold text-gray-600">
              {formatStatus(status)}
            </Text>
            <Text className="text-xs font-bold text-gray-900">{progress}</Text>
          </View>
          
          <View className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <View 
              style={{ width: progress as any }} 
              className={`h-full rounded-full ${color}`}
            />
          </View>
        </View>

        <View className="flex-row justify-end mt-3">
          <TouchableOpacity className="bg-gray-50 border border-gray-100 px-4 py-1.5 rounded-lg">
            <Text className="text-gray-700 text-xs font-semibold">Track</Text>
          </TouchableOpacity>
        </View>
      </View>
      {!isLast && <View className="h-[1px] bg-gray-100 w-full" />}
    </View>
  );
};

